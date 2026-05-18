"""
Filtro Post-Generación
Analiza la salida del LLM antes de enviarla al usuario
Detecta y bloquea respuestas directas no permitidas
"""

import re
from typing import Dict, Any, List

class FiltroPostGeneracion:
    """
    Filtro que analiza la respuesta del LLM y detecta
    patrones de respuesta directa que deben ser bloqueados
    """
    
    # Patrones de respuesta directa prohibida
    PATRONES_PROHIBIDOS = [
        # Frases que revelan la respuesta
        r"la respuesta es",
        r"el resultado es",
        r"la solución es",
        r"el código es",
        r"el código completo es",
        r"así se hace",
        r"así se resuelve",
        r"debes hacer.*:",
        r"tienes que.*:",
        r"simplemente.*:",
        
        # Explicaciones paso a paso completas
        r"paso 1.*paso 2.*paso 3",
        r"primero.*luego.*después.*finalmente",
        r"paso a paso.*:",
        
        # Código completo
        r"```python.*def.*return.*```",
        r"```.*\n.*\n.*\n.*```",
    ]
    
    # Patrones que indican bloques de código completos
    PATRONES_CODIGO_COMPLETO = [
        r"```[a-z]*\s*\n(?:def |class |import |from ).*?\n```",
        r"```[a-z]*\s*\n(?:for |while |if ).*?\n```",
    ]
    
    # Patrones permitidos (preguntas socráticas, pistas parciales)
    PATRONES_PERMITIDOS = [
        r"\?.*$",  # Preguntas
        r"¿.*\?",  # Preguntas en español
        r"piensa en",
        r"considera",
        r"reflexiona",
        r"¿qué pasaría si",
        r"¿cómo podrías",
        r"¿por qué no",
        r"intenta",
        r"analiza",
        r"observa",
    ]
    
    def __init__(self):
        """Inicializar el filtro"""
        self.compilados_prohibidos = [
            re.compile(p, re.IGNORECASE | re.DOTALL) 
            for p in self.PATRONES_PROHIBIDOS
        ]
        self.compilados_codigo = [
            re.compile(p, re.IGNORECASE | re.DOTALL) 
            for p in self.PATRONES_CODIGO_COMPLETO
        ]
        self.compilados_permitidos = [
            re.compile(p, re.IGNORECASE) 
            for p in self.PATRONES_PERMITIDOS
        ]
    
    def verificar(self, respuesta: str) -> Dict[str, Any]:
        """
        Verifica si la respuesta del LLM cumple con las reglas pedagógicas
        
        Args:
            respuesta: Texto completo generado por el LLM
            
        Returns:
            Dict con:
                - aprobado: bool
                - razon: str (si fue rechazado)
                - patrones_detectados: List[str]
        """
        patrones_detectados = []
        
        # Verificar patrones prohibidos
        for i, patron in enumerate(self.compilados_prohibidos):
            if patron.search(respuesta):
                patrones_detectados.append(f"prohibido_{i}")
        
        # Verificar bloques de código completo
        bloques_codigo = self._extraer_bloques_codigo(respuesta)
        for bloque in bloques_codigo:
            if self._es_codigo_completo(bloque):
                patrones_detectados.append("codigo_completo")
        
        # Contar pasos procedimentales
        pasos = self._contar_pasos_procedimentales(respuesta)
        if pasos >= 3:
            patrones_detectados.append("demasiados_pasos")
        
        # Verificar si hay frases de respuesta directa
        if self._tiene_respuesta_directa(respuesta):
            patrones_detectados.append("respuesta_directa")
        
        # Decisión
        if patrones_detectados:
            return {
                "aprobado": False,
                "razon": self._generar_razon_bloqueo(patrones_detectados),
                "patrones_detectados": patrones_detectados
            }
        
        return {
            "aprobado": True,
            "razon": None,
            "patrones_detectados": []
        }
    
    def _extraer_bloques_codigo(self, texto: str) -> List[str]:
        """Extrae todos los bloques de código del texto"""
        patron = r"```[a-z]*\s*\n(.*?)```"
        return re.findall(patron, texto, re.DOTALL)
    
    def _es_codigo_completo(self, bloque_codigo: str) -> bool:
        """
        Determina si un bloque de código es una solución completa
        
        Criterios:
        - Tiene más de 5 líneas
        - Contiene una función completa con return
        - O contiene una clase completa
        """
        lineas = [l.strip() for l in bloque_codigo.split('\n') if l.strip()]
        
        if len(lineas) < 5:
            return False
        
        # Verificar si tiene estructura completa de función
        tiene_def = any(l.startswith('def ') for l in lineas)
        tiene_return = any('return ' in l for l in lineas)
        tiene_clase = any(l.startswith('class ') for l in lineas)
        
        if tiene_def and tiene_return:
            return True
        
        if tiene_clase:
            return True
        
        # Verificar si parece un algoritmo completo
        tiene_bucle = any('for ' in l or 'while ' in l for l in lineas)
        if tiene_def and tiene_bucle and tiene_return:
            return True
        
        return False
    
    def _contar_pasos_procedimentales(self, texto: str) -> int:
        """
        Cuenta el número de pasos procedimentales secuenciales
        
        Detecta patrones como:
        - "Paso 1:", "Paso 2:", etc.
        - "Primero...", "Luego...", "Después...", "Finalmente..."
        - Números seguidos de punto al inicio de línea
        """
        count = 0
        
        # Patrones de pasos numerados
        pasos_numerados = re.findall(r'(?:paso\s*\d+|paso\s*[a-d])', texto, re.IGNORECASE)
        count += len(pasos_numerados)
        
        # Patrones secuenciales
        secuenciales = [
            r'\bprimero\b',
            r'\bluego\b',
            r'\bdespués\b',
            r'\bfinalmente\b',
            r'\bpor último\b',
            r'\bpor ultimo\b',
        ]
        
        for patron in secuenciales:
            if re.search(patron, texto, re.IGNORECASE):
                count += 1
        
        # Números al inicio de línea (1., 2., 3., etc.)
        numeros_linea = re.findall(r'^\s*\d+\.\s', texto, re.MULTILINE)
        count += len(numeros_linea)
        
        return count
    
    def _tiene_respuesta_directa(self, texto: str) -> bool:
        """
        Detecta si el texto contiene una respuesta directa
        
        Busca frases que indiquen que se está dando la solución
        """
        frases_directas = [
            "la respuesta correcta es",
            "la solución correcta es",
            "el código correcto es",
            "deberías escribir",
            "lo que debes hacer es",
            "la forma correcta es",
            "así es como se hace",
            "este es el código",
            "copia este código",
            "usa este código",
        ]
        
        texto_lower = texto.lower()
        return any(frase in texto_lower for frase in frases_directas)
    
    def _generar_razon_bloqueo(self, patrones: List[str]) -> str:
        """Genera una razón legible para el bloqueo"""
        razones = {
            "prohibido_0": "Contiene frases que revelan la respuesta",
            "prohibido_1": "Contiene frases que revelan la respuesta",
            "prohibido_2": "Contiene frases que revelan la respuesta",
            "prohibido_3": "Contiene frases que revelan la respuesta",
            "prohibido_4": "Contiene frases que revelan la respuesta",
            "prohibido_5": "Contiene frases que revelan la respuesta",
            "prohibido_6": "Contiene frases que revelan la respuesta",
            "prohibido_7": "Contiene frases que revelan la respuesta",
            "prohibido_8": "Contiene frases que revelan la respuesta",
            "prohibido_9": "Contiene explicación paso a paso completa",
            "prohibido_10": "Contiene explicación paso a paso completa",
            "prohibido_11": "Contiene explicación paso a paso completa",
            "codigo_completo": "Contiene bloques de código completos",
            "demasiados_pasos": "Explica más de 3 pasos procedimentales secuenciales",
            "respuesta_directa": "Contiene frases de respuesta directa",
        }
        
        razones_detectadas = [razones.get(p, "Patrón prohibido detectado") for p in patrones]
        return "; ".join(razones_detectadas)
    
    def es_pista_socratica(self, texto: str) -> bool:
        """
        Verifica si el texto es una pregunta o pista socrática válida
        """
        # Debe contener al menos una pregunta o patrón permitido
        for patron in self.compilados_permitidos:
            if patron.search(texto):
                return True
        
        # O debe terminar en signo de interrogación
        if texto.strip().endswith('?') or '?' in texto:
            return True
        
        return False
