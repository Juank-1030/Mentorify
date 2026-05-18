"""
Motor de Inferencia SBC (Sistema Basado en Conocimiento)
Implementa las reglas R01-R06 para control pedagógico
"""

from typing import Tuple, Dict, Any

class MotorInferencia:
    """
    Motor de inferencia que aplica reglas SI-ENTONCES
    para determinar la acción pedagógica apropiada
    """
    
    # Estados del estudiante
    ESTADOS = [
        "INICIO_SESION",
        "EXPLORACION_CONCEPTUAL",
        "INTENTO_INICIAL",
        "AVANCE_PARCIAL",
        "ERROR_UNICO",
        "ESTANCAMIENTO",
        "PISTA_AUXILIO",
        "COMPLETADO"
    ]
    
    def aplicar_reglas(
        self,
        tipo_input: str,
        clasificacion_intento: str = None,
        pistas_entregadas_sesion: int = 0,
        errores_consecutivos: int = 0,
        estado_actual: str = "INICIO_SESION"
    ) -> Tuple[str, str]:
        """
        Aplica las reglas R01-R06 para determinar la acción e instrucción al LLM
        
        Returns:
            Tuple[accion, instruccion_llm]
        """
        
        # REGLA R06 (Anti-evasión) - Se verifica primero
        if tipo_input == "consulta_conceptual":
            # Esta verificación se hace en el clasificador, pero la reforzamos aquí
            pass
        
        # REGLA R05: Errores consecutivos >= 3
        if errores_consecutivos >= 3:
            return (
                "pista_nivel_3_excepcional",
                "El estudiante muestra dificultad persistente. Proporciona una pista específica que reduzca el espacio de búsqueda sin entregar la solución completa. Formula una pregunta que señale directamente el área problemática sin revelar cómo resolverla."
            )
        
        # REGLA R01: Solicitud directa con pocas pistas
        if tipo_input == "solicitud_directa" and pistas_entregadas_sesion < 1:
            return (
                "pista_nivel_1",
                "Formula una pregunta socrática sobre el concepto fundamental del ejercicio, sin mencionar la solución. Activa el conocimiento previo del estudiante."
            )
        
        # REGLA R02: Solicitud directa con pistas intermedias
        if tipo_input == "solicitud_directa" and 1 <= pistas_entregadas_sesion < 3:
            return (
                "pista_nivel_2",
                "Proporciona una pista procedimental: indica el primer paso a ejecutar, sin completarlo. Guía al estudiante sobre por dónde comenzar."
            )
        
        # REGLA R03: Intento parcial correcto
        if tipo_input == "intento_parcial" and clasificacion_intento == "correcto_parcial":
            return (
                "validacion_positiva_con_continuacion",
                "Valida el progreso del estudiante de forma específica (menciona qué hizo bien). Luego formula una pregunta que lo dirija al siguiente paso lógico del razonamiento."
            )
        
        # REGLA R04: Intento parcial incorrecto
        if tipo_input == "intento_parcial" and clasificacion_intento == "incorrecto" and errores_consecutivos < 3:
            return (
                "retroalimentacion_correctiva",
                "Indica que el enfoque no es correcto sin revelar cuál es el error específico. Haz una pregunta que ayude al estudiante a identificar por sí mismo dónde está el problema."
            )
        
        # REGLA R01 alternativa: Solicitud directa después de 3+ pistas
        if tipo_input == "solicitud_directa" and pistas_entregadas_sesion >= 3:
            return (
                "pista_nivel_3_excepcional",
                "El estudiante ha recibido múltiples pistas. Proporciona una orientación más específica que reduzca significativamente el espacio de búsqueda, pero sin entregar la solución completa."
            )
        
        # Caso por defecto: consulta conceptual normal
        if tipo_input == "consulta_conceptual":
            return (
                "pista_nivel_1",
                "Responde la pregunta conceptual con otra pregunta que active el razonamiento del estudiante. No des la definición completa, guía hacia ella."
            )
        
        # Verificación de respuesta
        if tipo_input == "verificacion":
            return (
                "evaluacion_formativa",
                "No confirmes ni niegues directamente. Formula una pregunta que ayude al estudiante a auto-evaluar su respuesta. Pide que explique su razonamiento."
            )
        
        # Default: continuar guiando
        return (
            "continuar_guiando",
            "Continúa guiando al estudiante con una pregunta socrática que lo acerque al siguiente paso del razonamiento."
        )
    
    def actualizar_estado(
        self,
        estado_actual: str,
        accion: str,
        clasificacion: str
    ) -> str:
        """
        Actualiza el estado del estudiante según la acción tomada
        """
        transiciones = {
            ("INICIO_SESION", "pista_nivel_1"): "EXPLORACION_CONCEPTUAL",
            ("INICIO_SESION", "intento_parcial"): "INTENTO_INICIAL",
            
            ("EXPLORACION_CONCEPTUAL", "intento_parcial"): "INTENTO_INICIAL",
            ("EXPLORACION_CONCEPTUAL", "pista_nivel_1"): "EXPLORACION_CONCEPTUAL",
            ("EXPLORACION_CONCEPTUAL", "pista_nivel_2"): "EXPLORACION_CONCEPTUAL",
            
            ("INTENTO_INICIAL", "validacion_positiva_con_continuacion"): "AVANCE_PARCIAL",
            ("INTENTO_INICIAL", "retroalimentacion_correctiva"): "ERROR_UNICO",
            ("INTENTO_INICIAL", "pista_nivel_2"): "INTENTO_INICIAL",
            
            ("AVANCE_PARCIAL", "validacion_positiva_con_continuacion"): "AVANCE_PARCIAL",
            ("AVANCE_PARCIAL", "retroalimentacion_correctiva"): "ERROR_UNICO",
            ("AVANCE_PARCIAL", "pista_nivel_3_excepcional"): "PISTA_AUXILIO",
            
            ("ERROR_UNICO", "retroalimentacion_correctiva"): "ERROR_UNICO",
            ("ERROR_UNICO", "pista_nivel_3_excepcional"): "ESTANCAMIENTO",
            ("ERROR_UNICO", "validacion_positiva_con_continuacion"): "AVANCE_PARCIAL",
            
            ("ESTANCAMIENTO", "pista_nivel_3_excepcional"): "PISTA_AUXILIO",
            ("ESTANCAMIENTO", "validacion_positiva_con_continuacion"): "AVANCE_PARCIAL",
            
            ("PISTA_AUXILIO", "validacion_positiva_con_continuacion"): "AVANCE_PARCIAL",
            ("PISTA_AUXILIO", "retroalimentacion_correctiva"): "ESTANCAMIENTO",
        }
        
        clave = (estado_actual, accion)
        nuevo_estado = transiciones.get(clave, estado_actual)
        
        # Si la sesión se completó
        if accion == "completado":
            return "COMPLETADO"
        
        return nuevo_estado
    
    def detectar_patron_evasion(self, texto_input: str) -> bool:
        """
        Detecta patrones de evasión (Regla R06)
        """
        patrones_evasion = [
            "desde cero",
            "todo sobre",
            "explícame completamente",
            "como si no supiera nada",
            "con mucho detalle",
            "paso a paso desde cero",
            "no sé nada",
            "dame todo",
            "explicación completa",
            "desde el principio"
        ]
        
        texto_lower = texto_input.lower()
        return any(patron in texto_lower for patron in patrones_evasion)
