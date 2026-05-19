"""
Mentorify - Backend Principal (FastAPI)
Plataforma de tutoría académica inteligente con aprendizaje socrático
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn

from backend.database.models import init_db
from backend.database.crud import (
    crear_sesion, obtener_sesion, actualizar_sesion,
    guardar_interaccion, obtener_ejercicios, obtener_ejercicio,
    guardar_progreso, obtener_progreso, obtener_metricas
)
from backend.sbc.motor_inferencia import MotorInferencia
from backend.sbc.clasificador_intento import ClasificadorIntento
from backend.sbc.filtro_postgeneracion import FiltroPostGeneracion
from backend.llm.cliente_openai import ClienteOpenAI

app = FastAPI(title="Mentorify API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar componentes
motor_inferencia = MotorInferencia()
clasificador = ClasificadorIntento()
filtro = FiltroPostGeneracion()
cliente_llm = ClienteOpenAI()

# Inicializar base de datos
init_db()

# ==================== MODELOS PYDANTIC ====================

class IniciarSesionRequest(BaseModel):
    ejercicio_id: int
    estudiante_id: str

class InteractuarRequest(BaseModel):
    sesion_id: int
    texto_estudiante: str

class VerificarRequest(BaseModel):
    sesion_id: int
    intento_final: str

class EjercicioResponse(BaseModel):
    id: int
    titulo: str
    enunciado: str
    dominio: str
    nivel_dificultad: str
    conceptos_clave: List[str]

class InteraccionResponse(BaseModel):
    respuesta: str
    accion_tomada: str
    estado_estudiante: str
    pistas_entregadas: int
    errores_consecutivos: int

class VerificacionResponse(BaseModel):
    correcto: bool
    feedback: str
    resumen_razonamiento: str

# ==================== ENDPOINTS ====================

@app.post("/api/sesion/iniciar")
async def iniciar_sesion(request: IniciarSesionRequest):
    """Iniciar una nueva sesión de tutoría"""
    ejercicio = obtener_ejercicio(request.ejercicio_id)
    if not ejercicio:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    
    sesion = crear_sesion(
        estudiante_id=request.estudiante_id,
        ejercicio_id=request.ejercicio_id
    )
    
    mensaje_bienvenida = (
        f"¡Hola! Soy Mentorify, tu mentor académico. 🎓\n\n"
        f"Hoy trabajaremos en: **{ejercicio['titulo']}**\n\n"
        f"{ejercicio['enunciado']}\n\n"
        f"Estoy aquí para guiarte con preguntas, no para darte respuestas. "
        f"¡Comencemos! ¿Qué piensas sobre este ejercicio?"
    )
    
    return {
        "sesion_id": sesion["id"],
        "ejercicio_enunciado": ejercicio["enunciado"],
        "mensaje_bienvenida": mensaje_bienvenida,
        "ejercicio": ejercicio
    }

@app.post("/api/sesion/interactuar")
async def interactuar(request: InteractuarRequest):
    """Procesar interacción del estudiante"""
    sesion = obtener_sesion(request.sesion_id)
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    # Paso 1: Clasificar input del estudiante
    clasificacion = clasificador.clasificar(
        request.texto_estudiante,
        sesion["historial_interacciones"]
    )
    
    # Paso 2: Consultar estado actual del SBC
    estado_actual = sesion["estado_actual"]
    pistas_entregadas = sesion["pistas_entregadas"]
    errores_consecutivos = sesion["errores_consecutivos"]
    
    # Paso 3: Aplicar reglas del motor de inferencia
    accion, instruccion_llm = motor_inferencia.aplicar_reglas(
        tipo_input=clasificacion["tipo"],
        clasificacion_intento=clasificacion.get("clasificacion_intento"),
        pistas_entregadas_sesion=pistas_entregadas,
        errores_consecutivos=errores_consecutivos,
        estado_actual=estado_actual
    )
    
    # Paso 4: Construir prompt para LLM
    ejercicio = obtener_ejercicio(sesion["ejercicio_id"])
    prompt_llm = cliente_llm.construir_prompt(
        ejercicio=ejercicio,
        instruccion=instruccion_llm,
        historial=sesion["historial_interacciones"],
        texto_actual=request.texto_estudiante
    )
    
    # Paso 5: Llamar LLM (SIN STREAMING)
    respuesta_llm = cliente_llm.generar_respuesta(prompt_llm)
    
    # Paso 6: Pasar respuesta por filtro post-generación
    filtro_resultado = filtro.verificar(respuesta_llm)
    
    if not filtro_resultado["aprobado"]:
        # Regenerar con restricción adicional
        prompt_restringido = cliente_llm.construir_prompt_restringido(
            ejercicio=ejercicio,
            instruccion=instruccion_llm,
            razon_bloqueo=filtro_resultado["razon"]
        )
        respuesta_llm = cliente_llm.generar_respuesta(prompt_restringido)
    
    # Paso 7: Actualizar BD
    nuevo_estado = motor_inferencia.actualizar_estado(
        estado_actual=estado_actual,
        accion=accion,
        clasificacion=clasificacion["tipo"]
    )
    
    nuevas_pistas = pistas_entregadas
    nuevos_errores = errores_consecutivos
    
    if accion in ["pista_nivel_1", "pista_nivel_2", "pista_nivel_3_excepcional"]:
        nuevas_pistas += 1
    
    if clasificacion["tipo"] == "intento_parcial" and clasificacion.get("clasificacion_intento") == "incorrecto":
        nuevos_errores += 1
    elif clasificacion["tipo"] == "intento_parcial" and clasificacion.get("clasificacion_intento") == "correcto_parcial":
        nuevos_errores = 0
    
    actualizar_sesion(
        sesion_id=request.sesion_id,
        estado_actual=nuevo_estado,
        pistas_entregadas=nuevas_pistas,
        errores_consecutivos=nuevos_errores
    )
    
    # Guardar interacción
    guardar_interaccion(
        sesion_id=request.sesion_id,
        tipo_input=clasificacion["tipo"],
        clasificacion=clasificacion,
        texto_estudiante=request.texto_estudiante,
        respuesta_sistema=respuesta_llm,
        accion_tomada=accion
    )
    
    return {
        "respuesta": respuesta_llm,
        "accion_tomada": accion,
        "estado_estudiante": nuevo_estado,
        "pistas_entregadas": nuevas_pistas,
        "errores_consecutivos": nuevos_errores
    }

@app.get("/api/ejercicios")
async def listar_ejercicios(dominio: Optional[str] = None, nivel: Optional[str] = None):
    """Listar ejercicios disponibles"""
    ejercicios = obtener_ejercicios(dominio=dominio, nivel=nivel)
    return [
        EjercicioResponse(
            id=e["id"],
            titulo=e["titulo"],
            enunciado=e["enunciado"],
            dominio=e["dominio"],
            nivel_dificultad=e["nivel_dificultad"],
            conceptos_clave=e["conceptos_clave"]
        )
        for e in ejercicios
    ]

@app.get("/api/progreso/{estudiante_id}")
async def obtener_progreso_estudiante(estudiante_id: str):
    """Obtener progreso del estudiante"""
    progreso = obtener_progreso(estudiante_id)
    return progreso

@app.post("/api/sesion/verificar")
async def verificar_intento(request: VerificarRequest):
    """Verificar intento final del estudiante"""
    sesion = obtener_sesion(request.sesion_id)
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    ejercicio = obtener_ejercicio(sesion["ejercicio_id"])
    
    # Evaluar respuesta usando LLM
    prompt_verificacion = cliente_llm.construir_prompt_verificacion(
        ejercicio=ejercicio,
        intento_estudiante=request.intento_final
    )
    
    resultado = cliente_llm.generar_respuesta(prompt_verificacion)
    
    # Parsear resultado (espera formato JSON)
    try:
        import json
        # Extraer JSON de la respuesta
        inicio = resultado.find("{")
        fin = resultado.rfind("}") + 1
        if inicio >= 0 and fin > inicio:
            resultado_json = json.loads(resultado[inicio:fin])
        else:
            resultado_json = {"correcto": False, "feedback": resultado, "resumen": ""}
    except:
        resultado_json = {"correcto": False, "feedback": resultado, "resumen": ""}
    
    # Actualizar sesión como completada si es correcto
    if resultado_json.get("correcto"):
        actualizar_sesion(
            sesion_id=request.sesion_id,
            estado_actual="COMPLETADO",
            completado=True
        )
    
    return VerificacionResponse(
        correcto=resultado_json.get("correcto", False),
        feedback=resultado_json.get("feedback", ""),
        resumen_razonamiento=resultado_json.get("resumen", "")
    )

@app.get("/api/metricas")
async def obtener_metricas_sistema():
    """Obtener métricas del sistema"""
    metricas = obtener_metricas()
    return metricas

@app.get("/api/health")
async def health_check():
    """Endpoint de salud del sistema"""
    return {"status": "healthy", "timestamp": "2025-01-15T10:00:00Z"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
