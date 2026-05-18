# Instrucciones para Ejecutar Mentorify

## Resumen de Funcionalidad

✅ **FUNCIONAL (100%)**:
- Frontend React completo con todas las páginas
- Backend FastAPI con todos los endpoints
- Base de datos SQLite con modelos y CRUD
- Motor de inferencia SBC con reglas R01-R06
- Clasificador de intentos del estudiante
- Filtro post-generación anti-respuestas directas

️ **OPCIONAL**:
- LLM OpenAI: Funciona con respuestas mock si no hay API key

---

## Paso 1: Iniciar el Backend (Python + FastAPI)

### 1.1 Instalar dependencias de Python

```bash
cd backend
pip install -r requirements.txt
```

### 1.2 Configurar variable de entorno (OPCIONAL)

Si tienes una API key de OpenAI:

```bash
# Linux/Mac
export OPENAI_API_KEY="sk-..."

# Windows
set OPENAI_API_KEY=sk-...
```

**Nota**: Si NO proporcionas API key, el sistema usará respuestas socráticas predefinidas (mock) que mantienen la pedagogía.

### 1.3 Inicializar la base de datos

```bash
cd backend
python init_db.py
```

Esto creará el archivo `mentorify.db` con los 10 ejercicios iniciales.

### 1.4 Ejecutar el servidor backend

```bash
cd backend
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Verás algo como:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 1.5 Verificar que el backend funciona

Abre tu navegador y ve a:
- http://localhost:8000/api/health → Debe retornar `{"status": "healthy"}`
- http://localhost:8000/api/ejercicios → Debe retornar lista de ejercicios
- http://localhost:8000/docs → Documentación interactiva de la API

---

## Paso 2: Iniciar el Frontend (React + Vite)

### 2.1 Instalar dependencias (ya deberían estar instaladas)

```bash
npm install
```

### 2.2 Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Verás algo como:
```
VITE ready in 500ms

➜  Local:   http://localhost:5173/
```

### 2.3 Abrir la aplicación

Ve a http://localhost:5173 en tu navegador.

---

## Paso 3: Probar la Aplicación

1. **Landing Page**: Verás la página de presentación de Mentorify
2. **Click en "Comenzar a aprender"**: Te llevará al chat
3. **Seleccionar un ejercicio**: Elige uno de la lista lateral
4. **Interactuar**: Escribe una pregunta o intento
5. **Recibir guía socrática**: El sistema te responderá con preguntas, no con respuestas

---

## Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/sesion/iniciar` | Inicia nueva sesión |
| POST | `/api/sesion/interactuar` | Envía mensaje al mentor |
| GET | `/api/ejercicios` | Lista ejercicios |
| POST | `/api/sesion/verificar` | Verifica intento final |
| GET | `/api/progreso/{id}` | Obtiene progreso |
| GET | `/api/metricas` | Métricas del sistema |
| GET | `/api/health` | Health check |

---

## Solución de Problemas

### Error: "No se pudo conectar con el servidor"

**Causa**: El backend no está corriendo.

**Solución**:
```bash
cd backend
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Error: "Module not found: backend.database"

**Causa**: Las importaciones no encuentran los módulos.

**Solución**: Asegúrate de estar en el directorio correcto:
```bash
cd backend
python -m uvicorn backend.main:app --reload
```

### Error: "OPENAI_API_KEY not found"

**No es un error**. El sistema funciona sin API key usando respuestas mock.

Si quieres usar OpenAI real:
```bash
export OPENAI_API_KEY="tu-key-aqui"
```

### La base de datos no tiene ejercicios

**Solución**: Ejecuta el seed:
```bash
cd backend
python init_db.py
```

---

## Flujo de Funcionamiento

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend    │────▶│  Motor SBC  │
│   (React)   │◀────│  (FastAPI)   │◀────│ (Reglas)    │
└─────────────┘     ──────────────┘     └─────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  LLM OpenAI  │
                   │   (Opcional) │
                   ──────────────┘
```

1. Usuario escribe mensaje en el frontend
2. Frontend envía a `/api/sesion/interactuar`
3. Backend clasifica el input (solicitud_directa, intento_parcial, etc.)
4. Motor SBC aplica reglas R01-R06 según estado y clasificación
5. Se construye prompt para LLM con instrucción pedagógica
6. LLM genera respuesta (o usa mock si no hay API key)
7. Filtro post-generación verifica que no haya respuesta directa
8. Si pasa el filtro → se guarda en BD y se retorna al frontend
9. Si no pasa → se regenera con restricciones adicionales

---

## Archivos Clave

### Backend
- `backend/main.py` - Endpoints de la API
- `backend/sbc/motor_inferencia.py` - Reglas R01-R06
- `backend/sbc/clasificador_intento.py` - Clasifica input del estudiante
- `backend/sbc/filtro_postgeneracion.py` - Bloquea respuestas directas
- `backend/database/models.py` - Modelos de base de datos
- `backend/llm/cliente_openai.py` - Cliente OpenAI (con fallback mock)

### Frontend
- `src/pages/ChatPage.tsx` - Interfaz principal de chat
- `src/pages/LandingPage.tsx` - Página de aterrizaje
- `src/services/api.ts` - Conexión con backend
- `src/App.tsx` - Rutas de la aplicación

---

## ¿Cómo Cumple con los Requisitos?

### ✅ 3 Capas de Control

1. **System Prompt**: `backend/llm/system_prompt.py` con reglas estrictas
2. **Filtro Post-Gen**: `backend/sbc/filtro_postgeneracion.py` detecta código completo
3. **Motor SBC**: `backend/sbc/motor_inferencia.py` con reglas R01-R06

### ✅ Clasificador de Intentos

`backend/sbc/clasificador_intento.py` detecta:
- `solicitud_directa`: "dame", "resuelve", "dame el código"
- `consulta_conceptual`: "qué es", "cómo funciona"
- `intento_parcial`: el estudiante propone solución
- `verificacion`: "¿está bien?", "¿es correcto?"

### ✅ Estados del Estudiante

Implementados en `MotorInferencia`:
- INICIO_SESION, EXPLORACION_CONCEPTUAL, INTENTO_INICIAL
- AVANCE_PARCIAL, ERROR_UNICO, ESTANCAMIENTO
- PISTA_AUXILIO, COMPLETADO

### ✅ Base de Datos

Tablas en `backend/database/models.py`:
- `ejercicios` - 10 ejercicios seed
- `sesiones` - Seguimiento de sesiones
- `interacciones` - Historial de chat
- `progreso_estudiante` - Métricas por estudiante

### ✅ Frontend Completo

- Landing page con hero, características, testimonios
- Chat con sidebar de ejercicios y panel de progreso
- Página de resultados con videos recomendados
- Dashboard de progreso con gráficas

---

## Notas Importantes

1. **Sin API Key**: El sistema es completamente funcional con respuestas mock socráticas
2. **Con API Key**: Las respuestas serán generadas por GPT-4o-mini manteniendo la pedagogía
3. **Base de Datos**: Se crea automáticamente en `backend/mentorify.db`
4. **CORS**: El backend permite conexiones desde cualquier origen (para desarrollo)

---

© 2025 Mentorify - Aprendizaje Socrático con IA
