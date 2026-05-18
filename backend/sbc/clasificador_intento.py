"""
Clasificador de Intento del Estudiante
Clasifica el input en: solicitud_directa, consulta_conceptual, intento_parcial, verificacion
"""

from typing import Dict, List, Any
import re

class ClasificadorIntento:
    """
    Clasifica el input del estudiante usando patrones léxicos
    y análisis semántico básico
    """
    
    # Patrones para cada categoría
    PATRONES_SOLICITUD_DIRECTA = [
        r"\bdame\b",
        r"\bdime\b",
        r"\bcuál es la respuesta\b",
        r"\bcual es la respuesta\b",
        r"\bresuelve\b",
        r"\bdame el código\b",
        r"\bdame la solución\b",
        r"\bdame la respuesta\b",
        r"\bquiero la respuesta\b",
        r"\bnecesito la solución\b",
        r"\bhazlo por mí\b",
        r"\bhazlo tu\b",
        r"\bhazlo tú\b",
        r"\bresuélvelo\b",
        r"\bproporciona el código\b",
        r"\bmuestrame la respuesta\b",
        r"\bmuéstrame la respuesta\b",
        r"\bquiero que lo hagas\b",
    ]
    
    PATRONES_VERIFICACION = [
        r"\bestá bien\b",
        r"\bes correcto\b",
        r"\bestá correcto\b",
        r"\bbien hecho\b",
        r"\blo hice bien\b",
        r"\bcorrecto\b",
        r"\bverifica\b",
        r"\bverifíca\b",
        r"\brevísalo\b",
        r"\brevisalo\b",
        r"\bqué opinas\b",
        r"\bqué te parece\b",
        r"\bfunciona\b",
        r"\bestá bien así\b",
    ]
    
    PATRONES_CONSULTA_CONCEPTUAL = [
        r"\bqué es\b",
        r"\bque es\b",
        r"\bcómo funciona\b",
        r"\bcomo funciona\b",
        r"\bexplica\b",
        r"\bdefinición\b",
        r"\bdefinicion\b",
        r"\bpara qué sirve\b",
        r"\bpara que sirve\b",
        r"\bcuándo usar\b",
        r"\bcuando usar\b",
        r"\bpor qué\b",
        r"\bporque\b",
        r"\ben qué consiste\b",
        r"\ben que consiste\b",
    ]
    
    # Patrones anti-evasión (Regla R06)
    PATRONES_EVASION = [
        r"\bdesde cero\b",
        r"\btodo sobre\b",
        r"\bexplícame completamente\b",
        r"\bcomo si no supiera nada\b",
        r"\bcon mucho detalle\b",
        r"\bpaso a paso desde cero\b",
        r"\bno sé nada\b",
        r"\bdame todo\b",
        r"\bexplicación completa\b",
        r"\bdesde el principio\b",
        r"\bsin omitir nada\b",
        r"\bcompleto y detallado\b",
    ]
    
    def __init__(self):
        """Inicializar el clasificador"""
        self.compilados_solicitud = [re.compile(p, re.IGNORECASE) for p in self.PATRONES_SOLICITUD_DIRECTA]
        self.compilados_verificacion = [re.compile(p, re.IGNORECASE) for p in self.PATRONES_VERIFICACION]
        self.compilados_conceptual = [re.compile(p, re.IGNORECASE) for p in self.PATRONES_CONSULTA_CONCEPTUAL]
        self.compilados_evasion = [re.compile(p, re.IGNORECASE) for p in self.PATRONES_EVASION]
    
    def clasificar(self, texto: str, historial: List[Dict] = None) -> Dict[str, Any]:
        """
        Clasifica el input del estudiante
        
        Args:
            texto: El texto del estudiante
            historial: Historial de interacciones previas
            
        Returns:
            Dict con:
                - tipo: solicitud_directa, consulta_conceptual, intento_parcial, verificacion
                - clasificacion_intento: correcto_parcial, incorrecto (solo para intento_parcial)
                - confianza: float 0-1
                - patrones_detectados: lista de patrones encontrados
        """
        texto_lower = texto.lower()
        
        # Verificar patrones de evasión primero (Regla R06)
        tiene_evasion = self._detectar_evasion(texto)
        
        # Verificar solicitud directa
        es_solicitud, patrones_sol = self._verificar_patrones(
            texto, self.compilados_solicitud
        )
        
        # Verificar verificación
        es_verificacion, patrones_ver = self._verificar_patrones(
            texto, self.compilados_verificacion
        )
        
        # Verificar consulta conceptual
        es_conceptual, patrones_con = self._verificar_patrones(
            texto, self.compilados_conceptual
        )
        
        # Determinar clasificación principal
        if tiene_evasion or es_solicitud:
            return {
                "tipo": "solicitud_directa",
                "clasificacion_intento": None,
                "confianza": 0.9 if tiene_evasion else 0.85,
                "patrones_detectados": patrones_sol + (["evasion"] if tiene_evasion else []),
                "es_evasion": tiene_evasion
            }
        
        if es_verificacion:
            return {
                "tipo": "verificacion",
                "clasificacion_intento": None,
                "confianza": 0.8,
                "patrones_detectados": patrones_ver
            }
        
        if es_conceptual:
            return {
                "tipo": "consulta_conceptual",
                "clasificacion_intento": None,
                "confianza": 0.75,
                "patrones_detectados": patrones_con
            }
        
        # Si no coincide con ningún patrón específico, es un intento parcial
        # Clasificar si es correcto o incorrecto (análisis básico)
        clasificacion_intento = self._clasificar_intento_parcial(texto, historial)
        
        return {
            "tipo": "intento_parcial",
            "clasificacion_intento": clasificacion_intento,
            "confianza": 0.7,
            "patrones_detectados": []
        }
    
    def _verificar_patrones(self, texto: str, patrones_compilados: List) -> tuple:
        """
        Verifica si el texto coincide con alguno de los patrones
        
        Returns:
            Tuple[bool, List[str]]: (coincide, lista de patrones encontrados)
        """
        encontrados = []
        for patron in patrones_compilados:
            if patron.search(texto):
                encontrados.append(patron.pattern)
        return len(encontrados) > 0, encontrados
    
    def _detectar_evasion(self, texto: str) -> bool:
        """Detecta patrones de evasión (Regla R06)"""
        for patron in self.compilados_evasion:
            if patron.search(texto):
                return True
        return False
    
    def _clasificar_intento_parcial(self, texto: str, historial: List[Dict] = None) -> str:
        """
        Clasifica un intento parcial como correcto_parcial o incorrecto
        
        Este es un análisis básico. En producción se podría usar:
        - Embeddings de OpenAI para similitud semántica
        - Comparación con la solución de referencia
        - Análisis de código estático
        """
        texto_lower = texto.lower()
        
        # Indicadores de incertidumbre (posible error)
        indicadores_incertidumbre = [
            "no estoy seguro",
            "creo que",
            "tal vez",
            "quizás",
            "no sé si",
            "me confunde",
            "no entiendo",
            "está mal",
            "no funciona",
            "error",
            "???",
            "??",
        ]
        
        # Indicadores de confianza (posible correcto)
        indicadores_confianza = [
            "así funciona",
            "la solución es",
            "debería ser",
            "funciona porque",
            "esto hace",
            "el resultado es",
        ]
        
        # Contar indicadores
        incertidumbre_count = sum(1 for ind in indicadores_incertidumbre if ind in texto_lower)
        confianza_count = sum(1 for ind in indicadores_confianza if ind in texto_lower)
        
        # Si hay código, analizar estructura básica
        tiene_codigo = "```" in texto or ("def " in texto and ":" in texto)
        
        # Análisis básico
        if incertidumbre_count > confianza_count:
            return "incorrecto"
        
        if confianza_count > 0 and incertidumbre_count == 0:
            return "correcto_parcial"
        
        # Verificar en historial si hubo correcciones previas
        if historial:
            ultima_interaccion = historial[-1] if historial else None
            if ultima_interaccion:
                accion_previa = ultima_interaccion.get("accion_tomada", "")
                if "retroalimentacion_correctiva" in accion_previa:
                    # El estudiante respondió a una corrección, asumir que intentó corregir
                    return "correcto_parcial"
        
        # Default: asumir correcto parcial para ser positivos
        return "correcto_parcial"
    
    def calcular_similitud(self, texto1: str, texto2: str) -> float:
        """
        Calcula similitud coseno básica entre dos textos
        (Implementación simplificada sin embeddings)
        """
        # Tokenizar
        tokens1 = set(texto1.lower().split())
        tokens2 = set(texto2.lower().split())
        
        # Intersección y unión
        interseccion = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)
        
        if len(union) == 0:
            return 0.0
        
        return len(interseccion) / len(union)
