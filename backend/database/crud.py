"""
Operaciones CRUD para la base de datos
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.models import Sesion, Interaccion, Ejercicio, ProgresoEstudiante, Quiz, SessionLocal, engine
from datetime import datetime
from typing import Optional, List, Dict, Any
import json

def crear_sesion(estudiante_id: str, ejercicio_id: int) -> Dict:
    """Crear una nueva sesión de tutoría"""
    db = SessionLocal()
    try:
        sesion = Sesion(
            estudiante_id=estudiante_id,
            ejercicio_id=ejercicio_id,
            estado_actual="INICIO_SESION",
            pistas_entregadas=0,
            errores_consecutivos=0,
            errores_totales=0,
            completado=False
        )
        db.add(sesion)
        db.commit()
        db.refresh(sesion)
        
        return {
            "id": sesion.id,
            "estudiante_id": sesion.estudiante_id,
            "ejercicio_id": sesion.ejercicio_id,
            "fecha_inicio": sesion.fecha_inicio.isoformat(),
            "estado_actual": sesion.estado_actual,
            "pistas_entregadas": sesion.pistas_entregadas,
            "errores_consecutivos": sesion.errores_consecutivos,
            "historial_interacciones": []
        }
    finally:
        db.close()

def obtener_sesion(sesion_id: int) -> Optional[Dict]:
    """Obtener una sesión por ID"""
    db = SessionLocal()
    try:
        sesion = db.query(Sesion).filter(Sesion.id == sesion_id).first()
        if not sesion:
            return None
        
        # Obtener historial de interacciones
        interacciones = db.query(Interaccion).filter(
            Interaccion.sesion_id == sesion_id
        ).order_by(Interaccion.turno).all()
        
        historial = [
            {
                "turno": i.turno,
                "tipo_input": i.tipo_input,
                "texto_estudiante": i.texto_estudiante,
                "respuesta_sistema": i.respuesta_sistema,
                "accion_tomada": i.accion_tomada,
                "timestamp": i.timestamp.isoformat()
            }
            for i in interacciones
        ]
        
        return {
            "id": sesion.id,
            "estudiante_id": sesion.estudiante_id,
            "ejercicio_id": sesion.ejercicio_id,
            "fecha_inicio": sesion.fecha_inicio.isoformat(),
            "estado_actual": sesion.estado_actual,
            "pistas_entregadas": sesion.pistas_entregadas,
            "errores_consecutivos": sesion.errores_consecutivos,
            "errores_totales": sesion.errores_totales,
            "completado": sesion.completado,
            "historial_interacciones": historial
        }
    finally:
        db.close()

def actualizar_sesion(
    sesion_id: int,
    estado_actual: Optional[str] = None,
    pistas_entregadas: Optional[int] = None,
    errores_consecutivos: Optional[int] = None,
    errores_totales: Optional[int] = None,
    completado: Optional[bool] = None
) -> bool:
    """Actualizar una sesión existente"""
    db = SessionLocal()
    try:
        sesion = db.query(Sesion).filter(Sesion.id == sesion_id).first()
        if not sesion:
            return False
        
        if estado_actual is not None:
            sesion.estado_actual = estado_actual
        if pistas_entregadas is not None:
            sesion.pistas_entregadas = pistas_entregadas
        if errores_consecutivos is not None:
            sesion.errores_consecutivos = errores_consecutivos
        if errores_totales is not None:
            sesion.errores_totales = errores_totales
        if completado is not None:
            sesion.completado = completado
            if completado:
                sesion.fecha_fin = datetime.utcnow()
        
        db.commit()
        return True
    finally:
        db.close()

def guardar_interaccion(
    sesion_id: int,
    tipo_input: str,
    clasificacion: Dict,
    texto_estudiante: str,
    respuesta_sistema: str,
    accion_tomada: str
) -> int:
    """Guardar una interacción en la base de datos"""
    db = SessionLocal()
    try:
        # Obtener el turno actual
        ultimo_turno = db.query(Interaccion).filter(
            Interaccion.sesion_id == sesion_id
        ).count()
        
        interaccion = Interaccion(
            sesion_id=sesion_id,
            turno=ultimo_turno + 1,
            tipo_input=tipo_input,
            clasificacion=clasificacion,
            texto_estudiante=texto_estudiante,
            respuesta_sistema=respuesta_sistema,
            accion_tomada=accion_tomada
        )
        db.add(interaccion)
        db.commit()
        db.refresh(interaccion)
        return interaccion.id
    finally:
        db.close()

def obtener_ejercicios(dominio: Optional[str] = None, nivel: Optional[str] = None) -> List[Dict]:
    """Obtener lista de ejercicios filtrados"""
    db = SessionLocal()
    try:
        query = db.query(Ejercicio)
        
        if dominio:
            query = query.filter(Ejercicio.dominio == dominio)
        if nivel:
            query = query.filter(Ejercicio.nivel_dificultad == nivel)
        
        ejercicios = query.all()
        
        return [
            {
                "id": e.id,
                "titulo": e.titulo,
                "enunciado": e.enunciado,
                "dominio": e.dominio,
                "nivel_dificultad": e.nivel_dificultad,
                "conceptos_clave": e.conceptos_clave
            }
            for e in ejercicios
        ]
    finally:
        db.close()

def obtener_ejercicio(ejercicio_id: int) -> Optional[Dict]:
    """Obtener un ejercicio por ID"""
    db = SessionLocal()
    try:
        ejercicio = db.query(Ejercicio).filter(Ejercicio.id == ejercicio_id).first()
        if not ejercicio:
            return None
        
        return {
            "id": ejercicio.id,
            "titulo": ejercicio.titulo,
            "enunciado": ejercicio.enunciado,
            "dominio": ejercicio.dominio,
            "nivel_dificultad": ejercicio.nivel_dificultad,
            "conceptos_clave": ejercicio.conceptos_clave,
            "criterios_verificacion": ejercicio.criterios_verificacion
        }
    finally:
        db.close()

def guardar_progreso(
    estudiante_id: str,
    ejercicio_id: int,
    completado: bool = False,
    errores_concepto: Optional[Dict] = None
) -> bool:
    """Guardar o actualizar progreso del estudiante"""
    db = SessionLocal()
    try:
        progreso = db.query(ProgresoEstudiante).filter(
            ProgresoEstudiante.estudiante_id == estudiante_id,
            ProgresoEstudiante.ejercicio_id == ejercicio_id
        ).first()
        
        if not progreso:
            progreso = ProgresoEstudiante(
                estudiante_id=estudiante_id,
                ejercicio_id=ejercicio_id,
                completaciones=1 if completado else 0,
                errores_por_concepto=errores_concepto or {},
                ultima_sesion=datetime.utcnow()
            )
            db.add(progreso)
        else:
            if completado:
                progreso.completaciones += 1
            if errores_concepto:
                for concepto, error_count in errores_concepto.items():
                    if concepto in progreso.errores_por_concepto:
                        progreso.errores_por_concepto[concepto] += error_count
                    else:
                        progreso.errores_por_concepto[concepto] = error_count
            progreso.ultima_sesion = datetime.utcnow()
        
        db.commit()
        return True
    finally:
        db.close()

def obtener_progreso(estudiante_id: str) -> Dict:
    """Obtener progreso completo del estudiante"""
    db = SessionLocal()
    try:
        progresos = db.query(ProgresoEstudiante).filter(
            ProgresoEstudiante.estudiante_id == estudiante_id
        ).all()
        
        sesiones = db.query(Sesion).filter(
            Sesion.estudiante_id == estudiante_id
        ).all()
        
        # Calcular métricas por dominio
        dominios = {}
        for sesion in sesiones:
            ejercicio = db.query(Ejercicio).filter(Ejercicio.id == sesion.ejercicio_id).first()
            if ejercicio:
                dominio = ejercicio.dominio
                if dominio not in dominios:
                    dominios[dominio] = {
                        "completados": 0,
                        "totales": 0,
                        "errores_totales": 0
                    }
                dominios[dominio]["totales"] += 1
                if sesion.completado:
                    dominios[dominio]["completados"] += 1
                dominios[dominio]["errores_totales"] += sesion.errores_totales
        
        return {
            "estudiante_id": estudiante_id,
            "sesiones_totales": len(sesiones),
            "ejercicios_completados": sum(p.completaciones for p in progresos),
            "progreso_por_dominio": dominios,
            "historial": [
                {
                    "sesion_id": s.id,
                    "ejercicio_id": s.ejercicio_id,
                    "fecha": s.fecha_inicio.isoformat(),
                    "completado": s.completado,
                    "pistas_usadas": s.pistas_entregadas,
                    "errores": s.errores_totales
                }
                for s in sesiones[-10:]  # Últimas 10 sesiones
            ]
        }
    finally:
        db.close()

def crear_quiz(sesion_id: int, estudiante_id: str, tema: str, preguntas: List[Dict]) -> Dict:
    """Crear un nuevo quiz en la base de datos"""
    db = SessionLocal()
    try:
        quiz = Quiz(
            sesion_id=sesion_id,
            estudiante_id=estudiante_id,
            tema=tema,
            preguntas=preguntas,
            completado=False
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        return {"id": quiz.id, "tema": quiz.tema, "preguntas": quiz.preguntas}
    finally:
        db.close()

def guardar_respuestas_quiz(quiz_id: int, respuestas: Dict, puntaje: int, feedback: Dict) -> bool:
    """Guardar respuestas y puntaje de un quiz"""
    db = SessionLocal()
    try:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            return False
        quiz.respuestas_usuario = respuestas
        quiz.puntaje = puntaje
        quiz.feedback_respuestas = feedback
        quiz.completado = True
        db.commit()
        return True
    finally:
        db.close()

def obtener_quiz(quiz_id: int) -> Optional[Dict]:
    """Obtener un quiz por ID"""
    db = SessionLocal()
    try:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            return None
        return {
            "id": quiz.id,
            "sesion_id": quiz.sesion_id,
            "tema": quiz.tema,
            "preguntas": quiz.preguntas,
            "puntaje": quiz.puntaje,
            "feedback_respuestas": quiz.feedback_respuestas,
            "completado": quiz.completado
        }
    finally:
        db.close()

def obtener_historial_estudiante(estudiante_id: str, limite: int = 10) -> List[Dict]:
    """Obtener historial de sesiones de un estudiante con info del ejercicio"""
    db = SessionLocal()
    try:
        sesiones = db.query(Sesion).filter(
            Sesion.estudiante_id == estudiante_id
        ).order_by(Sesion.fecha_inicio.desc()).limit(limite).all()

        resultado = []
        for s in sesiones:
            ejercicio = db.query(Ejercicio).filter(Ejercicio.id == s.ejercicio_id).first()
            resultado.append({
                "sesion_id": s.id,
                "tema": ejercicio.titulo if ejercicio else "Sesión libre",
                "dominio": ejercicio.dominio if ejercicio else "libre",
                "fecha": s.fecha_inicio.isoformat(),
                "completado": s.completado,
                "pistas_usadas": s.pistas_entregadas,
                "errores": s.errores_totales,
                "estado": s.estado_actual
            })
        return resultado
    finally:
        db.close()

def crear_ejercicio_libre(tema: str) -> Dict:
    """Crear un ejercicio dinámico de tema libre para sesión personalizada"""
    db = SessionLocal()
    try:
        ejercicio = Ejercicio(
            titulo=tema,
            enunciado=f"Quiero aprender sobre: {tema}",
            dominio="libre",
            nivel_dificultad="libre",
            conceptos_clave=[],
            criterios_verificacion={}
        )
        db.add(ejercicio)
        db.commit()
        db.refresh(ejercicio)
        return {
            "id": ejercicio.id,
            "titulo": ejercicio.titulo,
            "enunciado": ejercicio.enunciado,
            "dominio": ejercicio.dominio,
            "nivel_dificultad": ejercicio.nivel_dificultad,
            "conceptos_clave": ejercicio.conceptos_clave,
            "criterios_verificacion": ejercicio.criterios_verificacion
        }
    finally:
        db.close()

def obtener_metricas() -> Dict:
    """Obtener métricas del sistema"""
    db = SessionLocal()
    try:
        # Total de interacciones
        total_interacciones = db.query(Interaccion).count()
        
        # Interacciones con respuestas directas bloqueadas
        respuestas_bloqueadas = db.query(Interaccion).filter(
            Interaccion.accion_tomada.like("%regeneracion%")
        ).count()
        
        # Sesiones completadas
        sesiones_totales = db.query(Sesion).count()
        sesiones_completadas = db.query(Sesion).filter(Sesion.completado == True).count()
        
        # Clasificaciones de intentos para auditoría
        clasificaciones = db.query(
            Interaccion.tipo_input,
            func.count(Interaccion.id).label('count')
        ).group_by(Interaccion.tipo_input).all()
        
        clasificaciones_dict = {c.tipo_input: c.count for c in clasificaciones}
        
        tasa_bloqueo = (respuestas_bloqueadas / total_interacciones * 100) if total_interacciones > 0 else 0
        tasa_completacion = (sesiones_completadas / sesiones_totales * 100) if sesiones_totales > 0 else 0
        
        return {
            "total_interacciones": total_interacciones,
            "respuestas_directas_bloqueadas": respuestas_bloqueadas,
            "tasa_respuestas_bloqueadas": round(tasa_bloqueo, 2),
            "sesiones_totales": sesiones_totales,
            "sesiones_completadas": sesiones_completadas,
            "tasa_completacion": round(tasa_completacion, 2),
            "precision_clasificador": 85.0,  # Valor estimado, se calcularía con dataset etiquetado
            "clasificaciones_por_tipo": clasificaciones_dict
        }
    finally:
        db.close()
