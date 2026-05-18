"""
Cliente de OpenAI para Mentorify
NO usa streaming - espera respuesta completa para filtrado
"""

import os
from typing import Dict, List, Any, Optional
from llm.system_prompt import get_system_prompt, get_few_shot_examples

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
        historial: List[Dict] = None
    ) -> List[Dict[str, str]]:
        """
        Construye el prompt completo para el LLM
        
        Args:
            ejercicio: Dict con información del ejercicio
            instruccion: Instrucción pedagógica (pista_nivel_1, etc.)
            historial: Historial de interacciones previas
            
        Returns:
            Lista de mensajes para la API de OpenAI
        """
        system_prompt = get_system_prompt()
        
        # Construir contexto del ejercicio
        contexto_ejercicio = f"""
═══════════════════════════════════════════════
EJERCICIO ACTUAL
═══════════════════════════════════════════════
Título: {ejercicio.get('titulo', 'Ejercicio')}
Dominio: {ejercicio.get('dominio', 'General')}
Nivel: {ejercicio.get('nivel_dificultad', 'No especificado')}

Enunciado:
{ejercicio.get('enunciado', 'No disponible')}

Conceptos clave: {', '.join(ejercicio.get('conceptos_clave', []))}
"""
        
        # Construir historial de conversación
        historial_texto = ""
        if historial and len(historial) > 0:
            historial_texto = "\n═══════════════════════════════════════════════\nHISTORIAL DE CONVERSACIÓN\n═══════════════════════════════════════════════\n"
            for interaccion in historial[-5:]:  # Últimas 5 interacciones
                historial_texto += f"\nEstudiante: {interaccion.get('texto_estudiante', '')}"
                historial_texto += f"\nMentorify: {interaccion.get('respuesta_sistema', '')}"
        
        # Instrucción específica
        instruccion_completa = f"""
═══════════════════════════════════════════════
TU INSTRUCCIÓN ACTUAL: [{instruccion}]
═══════════════════════════════════════════════

Basado en esta instrucción y el contexto del ejercicio, genera tu respuesta para el estudiante.
Recuerda: NUNCA des la solución completa. NUNCA escribas código completo.
"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": contexto_ejercicio + historial_texto + instruccion_completa}
        ]
        
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
        Genera una respuesta mock cuando no hay API key disponible
        
        Esto permite probar la aplicación sin configuración de OpenAI
        """
        # Extraer instrucción del mensaje
        user_content = ""
        for msg in messages:
            if msg["role"] == "user":
                user_content = msg["content"]
                break
        
        # Respuestas genéricas socráticas
        respuestas_socraticas = [
            " Interesante pregunta. Antes de continuar, piensa: ¿qué conceptos clave del ejercicio podrías aplicar aquí? ¿Qué información tienes disponible?",
            "💡 Buen intento. Analicemos juntos: ¿qué pasaría si cambiaras ese enfoque? ¿Qué ventajas o desventajas ves?",
            "🎓 Estás en el camino correcto. Considera esto: ¿cuál sería el caso más simple de este problema? ¿Cómo lo resolverías?",
            "🔍 Observa detenidamente el enunciado. ¿Hay alguna pista sobre qué estrategia sería más eficiente? ¿Por qué?",
            "✨ Veo que estás pensando en la dirección adecuada. Ahora reflexiona: ¿qué pasos intermedios necesitarías antes de llegar a la solución?",
        ]
        
        # Seleccionar respuesta basada en contenido
        if "pista_nivel_1" in user_content.lower():
            return "🤔 Piensa en los conceptos fundamentales de este ejercicio. ¿Qué sabes sobre el tema que podría aplicarse aquí? ¿Cuál sería el primer principio que deberías considerar?"
        
        if "pista_nivel_2" in user_content.lower():
            return "💡 Para comenzar, identifica cuál sería el caso más simple del problema. ¿Qué valor o condición haría que la solución fuera trivial? Una vez que tengas eso, ¿cómo podrías construir sobre él?"
        
        if "pista_nivel_3" in user_content.lower():
            return "🎯 Veo que has intentado varias aproximaciones. Enfócate en este aspecto específico: ¿qué condición debe cumplirse para que tu solución funcione correctamente? Revisa esa parte con cuidado."
        
        if "validacion" in user_content.lower():
            return "✅ ¡Excelente progreso! Has identificado un componente importante. Ahora, pensando en el siguiente paso: ¿qué necesitarías hacer para completar la solución? ¿Qué pieza falta?"
        
        if "retroalimentacion" in user_content.lower():
            return "🤔 Tu enfoque tiene mérito, pero hay algo que no está funcionando como esperas. Revisa: ¿estás considerando todos los casos posibles? ¿Hay alguna condición especial que debas manejar?"
        
        # Respuesta por defecto
        import random
        return random.choice(respuestas_socraticas)


# Singleton para usar en toda la aplicación
_cliente_instance = None

def get_cliente_openai() -> ClienteOpenAI:
    """Obtener instancia singleton del cliente"""
    global _cliente_instance
    if _cliente_instance is None:
        _cliente_instance = ClienteOpenAI()
    return _cliente_instance
