"""
Cliente de OpenAI para Mentorify
NO usa streaming - espera respuesta completa para filtrado
"""

import os
from typing import Dict, List, Any, Optional
from backend.llm.system_prompt import get_system_prompt, get_few_shot_examples

# Intentar importar OpenAI, si no está disponible usar mock
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None


class ClienteOpenAI:
    """
    Cliente para interactuar con OpenAI GPT-4o-mini
    Sin streaming - respuesta completa buffered para filtrado
    """
    
    def __init__(self, api_key: str = None):
        """
        Inicializar el cliente de OpenAI
        
        Args:
            api_key: API key de OpenAI. Si es None, usa OPENAI_API_KEY del entorno.
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = "gpt-4o-mini"
        
        if OPENAI_AVAILABLE and self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None
    
    def construir_prompt(
        self,
        ejercicio: Dict[str, Any],
        instruccion: str,
        historial: List[Dict] = None,
        texto_actual: str = None
    ) -> List[Dict[str, str]]:
        """
        Construye el prompt completo para el LLM como conversación real.

        Args:
            ejercicio: Dict con información del ejercicio
            instruccion: Instrucción pedagógica (pista_nivel_1, etc.)
            historial: Historial de interacciones previas
            texto_actual: Mensaje actual del estudiante (el que acaba de enviar)

        Returns:
            Lista de mensajes para la API de OpenAI
        """
        system_prompt = get_system_prompt()

        contexto_ejercicio = (
            f"EJERCICIO ACTUAL\n"
            f"Título: {ejercicio.get('titulo', 'Ejercicio')}\n"
            f"Dominio: {ejercicio.get('dominio', 'General')} | "
            f"Nivel: {ejercicio.get('nivel_dificultad', 'No especificado')}\n"
            f"Enunciado: {ejercicio.get('enunciado', 'No disponible')}\n"
            f"Conceptos clave: {', '.join(ejercicio.get('conceptos_clave', []))}\n\n"
            f"INSTRUCCIÓN PEDAGÓGICA ACTUAL: [{instruccion}]\n"
            f"NUNCA des la solución completa. NUNCA escribas código completo. "
            f"Guía exclusivamente con preguntas socráticas."
        )

        messages = [{"role": "system", "content": system_prompt + "\n\n" + contexto_ejercicio}]

        # Historial como turnos reales de conversación
        for interaccion in (historial or [])[-6:]:
            messages.append({"role": "user", "content": interaccion.get("texto_estudiante", "")})
            messages.append({"role": "assistant", "content": interaccion.get("respuesta_sistema", "")})

        # Mensaje actual del estudiante
        if texto_actual:
            messages.append({"role": "user", "content": texto_actual})

        return messages
    
    def construir_prompt_restringido(
        self,
        ejercicio: Dict[str, Any],
        instruccion: str,
        razon_bloqueo: str
    ) -> List[Dict[str, str]]:
        """
        Construye un prompt con restricciones adicionales tras bloqueo del filtro
        
        Args:
            ejercicio: Dict con información del ejercicio
            instruccion: Instrucción pedagógica original
            razon_bloqueo: Razón por la que fue bloqueada la respuesta anterior
            
        Returns:
            Lista de mensajes para la API de OpenAI
        """
        system_prompt = get_system_prompt()
        
        restriccion_adicional = f"""
═══════════════════════════════════════════════
⚠️ RESTRICCIÓN ADICIONAL ⚠️
═══════════════════════════════════════════════

Tu respuesta anterior fue bloqueada por: {razon_bloqueo}

Debes generar una NUEVA respuesta que:
1. Cumpla estrictamente con las reglas socráticas
2. NO contenga código completo
3. NO revele la solución
4. NO explique más de 2 pasos secuenciales

La respuesta debe ser EXCLUSIVAMENTE preguntas y pistas parciales.
"""
        
        contexto_ejercicio = f"""
═══════════════════════════════════════════════
EJERCICIO ACTUAL
═══════════════════════════════════════════════
Título: {ejercicio.get('titulo', 'Ejercicio')}
Enunciado: {ejercicio.get('enunciado', 'No disponible')}
"""
        
        messages = [
            {"role": "system", "content": system_prompt + restriccion_adicional},
            {"role": "user", "content": contexto_ejercicio + f"\n\nInstrucción: [{instruccion}]\n\nGenera una respuesta que cumpla todas las restricciones."}
        ]
        
        return messages
    
    def construir_prompt_verificacion(
        self,
        ejercicio: Dict[str, Any],
        intento_estudiante: str
    ) -> List[Dict[str, str]]:
        """
        Construye prompt para verificar la respuesta del estudiante
        
        Args:
            ejercicio: Dict con información del ejercicio
            intento_estudiante: Respuesta/intento del estudiante
            
        Returns:
            Lista de mensajes para la API de OpenAI
        """
        system_prompt = """Eres un evaluador académico. Tu tarea es verificar si la respuesta del estudiante es correcta.

Responde EXCLUSIVAMENTE en formato JSON con esta estructura:
{
    "correcto": true/false,
    "feedback": "Explicación del porqué es correcto o incorrecto",
    "resumen": "Resumen del razonamiento del estudiante"
}

No agregues texto fuera del JSON. Sé objetivo y preciso."""
        
        prompt_verificacion = f"""
EJERCICIO: {ejercicio.get('enunciado', 'No disponible')}

CRITERIOS DE VERIFICACIÓN: {ejercicio.get('criterios_verificacion', 'No especificado')}

INTENTO DEL ESTUDIANTE:
{intento_estudiante}

Evalúa si el intento del estudiante es correcto según los criterios.
Responde en JSON."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt_verificacion}
        ]
        
        return messages
    
    def generar_respuesta(self, messages: List[Dict[str, str]]) -> str:
        """
        Genera respuesta del LLM (SIN STREAMING)
        
        Args:
            messages: Lista de mensajes para la API
            
        Returns:
            Respuesta completa del LLM
        """
        if self.client is None:
            return self._generar_respuesta_mock(messages)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500,
                stream=False  # NO STREAMING - respuesta completa buffered
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            # Fallback a respuesta mock en caso de error
            print(f"Error en llamada a OpenAI: {e}")
            return self._generar_respuesta_mock(messages)
    
    def _generar_respuesta_mock(self, messages: List[Dict[str, str]]) -> str:
        """
        Genera una respuesta mock socrática contextual cuando no hay API key disponible.
        Usa el ejercicio y la instrucción del SBC para dar una respuesta relevante.
        """
        instruccion = "continuar_guiando"
        ejercicio_titulo = "el ejercicio"
        texto_estudiante = ""

        for msg in messages:
            content = msg.get("content", "")
            if msg["role"] == "system":
                # Extraer título del ejercicio
                for line in content.split("\n"):
                    if line.startswith("Título:"):
                        ejercicio_titulo = line.replace("Título:", "").strip()
                # Extraer tipo de instrucción
                for clave in ["pista_nivel_3", "pista_nivel_2", "pista_nivel_1",
                              "validacion_positiva", "retroalimentacion_correctiva",
                              "evaluacion_formativa", "continuar_guiando"]:
                    if clave in content:
                        instruccion = clave
                        break
            elif msg["role"] == "user":
                texto_estudiante = content  # El último user message es el actual

        respuestas = {
            "pista_nivel_1": (
                f"Antes de avanzar, piensa: ¿qué principio fundamental aplica en '{ejercicio_titulo}'? "
                f"¿Qué conceptos del tema conoces que podrían ser relevantes aquí?"
            ),
            "pista_nivel_2": (
                f"Ya tienes una idea del concepto. Ahora bien: ¿cuál sería el primer paso concreto "
                f"para atacar '{ejercicio_titulo}'? ¿Por dónde comenzarías y por qué?"
            ),
            "pista_nivel_3": (
                f"Has hecho varios intentos. Enfócate en un punto específico: ¿qué condición debe "
                f"cumplirse obligatoriamente para que tu solución de '{ejercicio_titulo}' sea correcta? "
                f"Revisa esa parte con cuidado."
            ),
            "validacion_positiva": (
                f"Ese razonamiento va por buen camino. ¿Cuál sería el siguiente paso lógico "
                f"para completar '{ejercicio_titulo}'? ¿Qué pieza te falta aún?"
            ),
            "retroalimentacion_correctiva": (
                f"Tu planteamiento tiene un aspecto que revisar. Reflexiona: ¿estás considerando "
                f"todos los casos posibles en '{ejercicio_titulo}'? "
                f"¿Hay alguna condición especial que estés pasando por alto?"
            ),
            "evaluacion_formativa": (
                f"Interesante. Antes de confirmar, explícame tu razonamiento: "
                f"¿por qué crees que esa es la respuesta correcta para '{ejercicio_titulo}'?"
            ),
        }

        return respuestas.get(
            instruccion,
            f"Profundiza en tu razonamiento: ¿por qué ese enfoque funcionaría para '{ejercicio_titulo}'? "
            f"¿Qué evidencia tienes de que es el camino correcto?"
        )


# Singleton para usar en toda la aplicación
_cliente_instance = None

def get_cliente_openai() -> ClienteOpenAI:
    """Obtener instancia singleton del cliente"""
    global _cliente_instance
    if _cliente_instance is None:
        _cliente_instance = ClienteOpenAI()
    return _cliente_instance
