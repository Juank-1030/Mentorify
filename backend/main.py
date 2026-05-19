"""
Mentorify - Backend Principal (FastAPI)
Plataforma de tutoría académica inteligente con aprendizaje socrático
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn, io, json
from dotenv import load_dotenv
load_dotenv()

from backend.database.models import init_db
from backend.database.crud import (
    crear_sesion, obtener_sesion, actualizar_sesion,
    guardar_interaccion, obtener_ejercicios, obtener_ejercicio,
    guardar_progreso, obtener_progreso, obtener_metricas,
    crear_ejercicio_libre, crear_quiz, guardar_respuestas_quiz,
    obtener_quiz, obtener_historial_estudiante
)
from backend.llm.system_prompt import get_quiz_prompt
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

class IniciarSesionLibreRequest(BaseModel):
    tema: str
    estudiante_id: str

class GenerarQuizRequest(BaseModel):
    sesion_id: int
    estudiante_id: str

class EvaluarQuizRequest(BaseModel):
    quiz_id: int
    respuestas: Dict[str, str]  # {"1": "A", "2": "C", ...}

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

@app.post("/api/sesion/iniciar-libre")
async def iniciar_sesion_libre(request: IniciarSesionLibreRequest):
    """Iniciar una sesión de aprendizaje libre sobre cualquier tema"""
    ejercicio = crear_ejercicio_libre(request.tema)

    sesion = crear_sesion(
        estudiante_id=request.estudiante_id,
        ejercicio_id=ejercicio["id"]
    )

    mensaje_bienvenida = (
        f"¡Hola! Soy Mentorify, tu mentor académico. 🎓\n\n"
        f"Hoy exploraremos juntos: **{request.tema}**\n\n"
        f"No te daré respuestas directas — te ayudaré a construir tu propio entendimiento "
        f"con preguntas que activen tu razonamiento.\n\n"
        f"¿Qué sabes ya sobre este tema? ¿Por dónde te gustaría comenzar?"
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

# ==================== QUIZ / EVALUACIÓN ====================

@app.post("/api/quiz/generar")
async def generar_quiz(request: GenerarQuizRequest):
    """Genera un quiz de 5 preguntas basado en el tema de la sesión activa"""
    sesion = obtener_sesion(request.sesion_id)
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    ejercicio = obtener_ejercicio(sesion["ejercicio_id"])
    tema = ejercicio["titulo"] if ejercicio else "el tema de estudio"

    prompt_quiz = [
        {"role": "system", "content": get_quiz_prompt()},
        {"role": "user", "content": (
            f"Genera 5 preguntas de opción múltiple sobre: {tema}\n"
            f"Conceptos clave a evaluar: {', '.join(ejercicio.get('conceptos_clave', []) if ejercicio else [])}\n"
            f"Contexto del ejercicio: {ejercicio.get('enunciado', '') if ejercicio else ''}"
        )}
    ]

    resultado_raw = cliente_llm.generar_respuesta(prompt_quiz, max_tokens=3000, temperature=0.2)

    preguntas = _parsear_preguntas_quiz(resultado_raw, tema)

    quiz = crear_quiz(
        sesion_id=request.sesion_id,
        estudiante_id=request.estudiante_id,
        tema=tema,
        preguntas=preguntas
    )

    # Retornar preguntas SIN la clave correcta (no revelarla al frontend)
    preguntas_sin_respuesta = [
        {k: v for k, v in p.items() if k != "correcta" and k != "explicacion"}
        for p in preguntas
    ]
    return {"quiz_id": quiz["id"], "tema": tema, "preguntas": preguntas_sin_respuesta}


@app.post("/api/quiz/evaluar")
async def evaluar_quiz(request: EvaluarQuizRequest):
    """Evalúa las respuestas del estudiante y retorna puntaje + feedback"""
    quiz = obtener_quiz(request.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz no encontrado")

    preguntas = quiz["preguntas"]
    respuestas = request.respuestas  # {"1": "A", "2": "C", ...}

    correctas = 0
    feedback = {}
    for p in preguntas:
        pid = str(p["id"])
        respuesta_usuario = respuestas.get(pid, "")
        es_correcto = respuesta_usuario == p.get("correcta", "")
        if es_correcto:
            correctas += 1
        feedback[pid] = {
            "correcta": es_correcto,
            "respuesta_usuario": respuesta_usuario,
            "respuesta_correcta": p.get("correcta", ""),
            "explicacion": p.get("explicacion", "")
        }

    puntaje = round((correctas / len(preguntas)) * 100) if preguntas else 0
    guardar_respuestas_quiz(request.quiz_id, respuestas, puntaje, feedback)

    return {
        "puntaje": puntaje,
        "correctas": correctas,
        "total": len(preguntas),
        "feedback": feedback
    }


def _parsear_preguntas_quiz(resultado_raw: str, tema: str) -> List[Dict]:
    """Extrae y valida la lista de preguntas del texto crudo devuelto por el LLM."""
    texto = resultado_raw.strip()

    # Eliminar bloques de markdown (```json ... ```)
    if "```" in texto:
        partes = texto.split("```")
        for parte in partes:
            parte = parte.strip()
            if parte.startswith("json"):
                parte = parte[4:].strip()
            if parte.startswith("{") or parte.startswith("["):
                texto = parte
                break

    try:
        inicio = texto.find("{")
        if inicio < 0:
            raise ValueError("No JSON object found")
        # Take everything from first { to end (rfind may cut a trailing ] after last })
        fragmento = texto[inicio:]
        # Sanitize: LLMs sometimes escape single quotes as \' which is invalid JSON
        fragmento = fragmento.replace("\\'", "'")
        # Attempt direct parse first
        try:
            data = json.loads(fragmento)
        except json.JSONDecodeError:
            # Common failure: outer closing } is missing or trailing chars after ]
            # Try to close the object if it ends with ]
            for suffix in ["}", "}}", "]}",  "]}"]:
                try:
                    data = json.loads(fragmento + suffix)
                    break
                except json.JSONDecodeError:
                    pass
            else:
                # Last resort: extract up to last }
                fin = fragmento.rfind("}") + 1
                data = json.loads(fragmento[:fin])
        preguntas_raw = data.get("preguntas", [])
    except Exception as e:
        print(f"[quiz] Error parseando JSON: {e}\nRaw: {resultado_raw[:500]}")
        preguntas_raw = []

    # Validar que cada pregunta tenga los campos requeridos y una opción correcta válida
    preguntas_validas = []
    opciones_validas = {"A", "B", "C", "D"}
    for p in preguntas_raw:
        if not isinstance(p, dict):
            continue
        if not all(k in p for k in ("id", "pregunta", "opciones", "correcta")):
            continue
        if not isinstance(p.get("opciones"), dict):
            continue
        if p.get("correcta") not in opciones_validas:
            continue
        # Asegurar que las 4 opciones existan
        if not all(op in p["opciones"] for op in opciones_validas):
            continue
        preguntas_validas.append(p)

    if len(preguntas_validas) >= 3:
        return preguntas_validas

    print(f"[quiz] LLM devolvió {len(preguntas_validas)} preguntas válidas — usando fallback")
    return _preguntas_fallback(tema)


def _preguntas_fallback(tema: str) -> List[Dict]:
    """3 preguntas de respaldo con estructura real cuando el LLM falla."""
    return [
        {
            "id": 1,
            "pregunta": f"¿Cuál es el objetivo principal del estudio de {tema}?",
            "opciones": {
                "A": f"Comprender los fundamentos y aplicaciones de {tema}",
                "B": "Memorizar definiciones sin contexto práctico",
                "C": "Ignorar los conceptos teóricos subyacentes",
                "D": "Aplicar métodos aleatorios sin criterio"
            },
            "correcta": "A",
            "explicacion": f"El estudio de {tema} busca construir comprensión profunda de sus fundamentos para aplicarlos correctamente."
        },
        {
            "id": 2,
            "pregunta": f"Al aprender {tema}, ¿qué enfoque es más efectivo?",
            "opciones": {
                "A": "Copiar soluciones sin analizar el razonamiento detrás",
                "B": "Relacionar los nuevos conceptos con conocimientos previos",
                "C": "Evitar la práctica y concentrarse solo en la teoría",
                "D": "Resolver problemas sin verificar los resultados"
            },
            "correcta": "B",
            "explicacion": "Conectar nuevos conceptos con conocimiento previo (aprendizaje significativo) mejora la retención y comprensión."
        },
        {
            "id": 3,
            "pregunta": f"¿Cuál de las siguientes actitudes favorece el aprendizaje de {tema}?",
            "opciones": {
                "A": "Rendirse al primer error sin reflexionar",
                "B": "Buscar siempre la respuesta directa sin razonar",
                "C": "Analizar los errores cometidos para entender su causa",
                "D": "Depender exclusivamente de la memorización"
            },
            "correcta": "C",
            "explicacion": "Analizar y aprender de los errores es una estrategia de aprendizaje activo que fortalece el entendimiento."
        }
    ]


# ==================== SUBIDA DE ARCHIVOS ====================

@app.post("/api/upload")
async def subir_archivo(file: UploadFile = File(...)):
    """Recibe un archivo y extrae su texto para usarlo como contexto"""
    contenido = await file.read()
    nombre = (file.filename or "").lower()
    texto_extraido = ""
    tipo = nombre.rsplit(".", 1)[-1] if "." in nombre else "desconocido"

    if nombre.endswith(".txt"):
        texto_extraido = contenido.decode("utf-8", errors="ignore")

    elif nombre.endswith(".pdf"):
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(contenido))
            for page in reader.pages:
                texto_extraido += (page.extract_text() or "") + "\n"
        except ImportError:
            texto_extraido = "[PyPDF2 no instalado. Instala con: pip install pypdf2]"
        except Exception as e:
            texto_extraido = f"[Error al leer PDF: {e}]"

    elif nombre.endswith((".docx", ".doc")):
        try:
            import docx
            doc = docx.Document(io.BytesIO(contenido))
            texto_extraido = "\n".join(p.text for p in doc.paragraphs)
        except ImportError:
            texto_extraido = "[python-docx no instalado. Instala con: pip install python-docx]"
        except Exception as e:
            texto_extraido = f"[Error al leer documento: {e}]"

    elif nombre.endswith((".png", ".jpg", ".jpeg")):
        tipo = "imagen"
        texto_extraido = f"[Imagen adjunta: {file.filename}]"

    else:
        texto_extraido = f"[Formato no soportado: {file.filename}]"

    return {
        "filename": file.filename,
        "tipo": tipo,
        "texto_extraido": texto_extraido[:6000]
    }


# ==================== HISTORIAL ====================

@app.get("/api/historial/{estudiante_id}")
async def obtener_historial(estudiante_id: str, limite: int = 10):
    """Obtener historial de sesiones del estudiante"""
    return obtener_historial_estudiante(estudiante_id, limite)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
