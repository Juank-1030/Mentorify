# Mentorify - Plataforma de Tutoría Académica Inteligente

🎓 **Tu mentor académico inteligente con aprendizaje socrático mediado por IA**

Mentorify es un agente tutor que NUNCA da respuestas directas. En lugar de resolver, GUÍA. En lugar de responder, PREGUNTA.

##  Inicio Rápido

### 1. Iniciar el Backend

```bash
cd backend
python -m pip install -r requirements.txt
# Opcional: export OPENAI_API_KEY="tu-key"
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Iniciar el Frontend

```bash
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.
En caso de que la instalacion de los requerimientos del back falle, instalar ultima version de python desde aqui: https://www.python.org/downloads/
En caso de que la instalacion de npm falle, instalar node.js desde aqui: https://nodejs.org/es

## 🚀 Características Principales

- **Guía Socrática**: Aprendizaje mediante preguntas que activan el razonamiento
- **Pistas Adaptativas**: Ayuda personalizada según el nivel de comprensión
- **Motor de Reglas SBC**: Sistema basado en conocimiento con reglas SI-ENTONCES
- **Filtro Anti-Respuestas**: Bloquea respuestas directas del LLM
- **Seguimiento de Progreso**: Métricas detalladas de aprendizaje

## ️ ¿Qué es Funcional y Qué No?

| Componente | Estado | Explicación |
|------------|--------|-------------|
| **Frontend UI** | ✅ 100% Funcional | Toda la interfaz React funciona |
| **API Backend** | ✅ 100% Funcional | Endpoints FastAPI completos |
| **Base de Datos** | ✅ 100% Funcional | SQLite con modelos y CRUD |
| **Motor SBC** | ✅ 100% Funcional | Reglas R01-R06 implementadas |
| **Clasificador** | ✅ 100% Funcional | Detecta tipo de input del estudiante |
| **Filtro Post-Gen** | ✅ 100% Funcional | Bloquea respuestas directas |
| **LLM OpenAI** | ️ Opcional | Funciona con mock si no hay API key |

### Modo Sin API Key de OpenAI

El sistema está diseñado para funcionar **sin necesidad de API key**. Si no se proporciona `OPENAI_API_KEY`, el backend usa respuestas socráticas predefinidas que mantienen la pedagogía del sistema.

## 🏗️ Arquitectura del Sistema

```
mentorify/
├── backend/
│   ├── main.py                 # Aplicación FastAPI principal
│   ├── sbc/
│   │   ├── motor_inferencia.py # Reglas R01-R06
│   │   ├── clasificador_intento.py
│   │   └── filtro_postgeneracion.py
│   ├── llm/
│   │   ├── cliente_openai.py   # Cliente OpenAI (sin streaming)
│   │   ── system_prompt.py    # Prompt del sistema
│   └── database/
│       ├── models.py           # Modelos SQLAlchemy
│       ├── crud.py             # Operaciones CRUD
│       └── ejercicios_seed.py  # Seed de ejercicios
├── frontend/
│   ── src/
│       ├── pages/              # Páginas principales
│       ├── components/         # Componentes reutilizables
│       └── services/           # Servicios de API
└── README.md
```

## 🛠️ Instalación y Configuración

### Requisitos Previos

- Node.js 18+ 
- Python 3.9+
- API Key de OpenAI

### 1. Configurar el Backend (Python)

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install fastapi uvicorn sqlalchemy openai python-dotenv

# Configurar variable de entorno
export OPENAI_API_KEY="tu-api-key-aqui"  # En Windows: set OPENAI_API_KEY=tu-api-key-aqui

# Iniciar el servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Configurar el Frontend (React)

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 📖 Endpoints de la API

### POST /api/sesion/iniciar
Inicia una nueva sesión de tutoría.

```json
{
  "ejercicio_id": 1,
  "estudiante_id": "student123"
}
```

### POST /api/sesion/interactuar
Envía una interacción del estudiante y recibe guía socrática.

```json
{
  "sesion_id": 1,
  "texto_estudiante": "No sé cómo empezar..."
}
```

### GET /api/ejercicios
Obtiene lista de ejercicios disponibles.

### POST /api/sesion/verificar
Verifica el intento final del estudiante.

### GET /api/progreso/{estudiante_id}
Obtiene el progreso del estudiante.

### GET /api/metricas
Obtiene métricas del sistema.

## 🧠 Reglas del Motor de Inferencia (SBC)

### R01 - Primera Solicitud Directa
**SI** tipo_input == "solicitud_directa" AND pistas < 1  
**ENTONCES** pista_nivel_1 (pregunta sobre concepto fundamental)

### R02 - Solicitud con Pistas Previas
**SI** tipo_input == "solicitud_directa" AND 1 <= pistas < 3  
**ENTONCES** pista_nivel_2 (indica primer paso sin completar)

### R03 - Intento Parcial Correcto
**SI** tipo_input == "intento_parcial" AND clasificacion == "correcto_parcial"  
**ENTONCES** validación positiva con pregunta de continuación

### R04 - Intento Incorrecto
**SI** tipo_input == "intento_parcial" AND clasificacion == "incorrecto" AND errores < 3  
**ENTONCES** retroalimentación correctiva sin revelar error

### R05 - Estancamiento
**SI** errores_consecutivos >= 3  
**ENTONCES** pista_nivel_3_excepcional (reduce espacio de búsqueda)

### R06 - Anti-Evasión
**SI** consulta_conceptual con patrones como "desde cero", "todo sobre", "completamente"  
**ENTONCES** reclasificar como solicitud_directa

## 💾 Modelos de Base de Datos

### Tabla: ejercicios
- id, titulo, enunciado, dominio, nivel_dificultad
- conceptos_clave (JSON), solucion_referencia (PRIVADO)
- criterios_verificacion (JSON)

### Tabla: sesiones
- id, estudiante_id, ejercicio_id, fecha_inicio, fecha_fin
- estado_actual, pistas_entregadas, errores_consecutivos
- errores_totales, completado (bool)

### Tabla: interacciones
- id, sesion_id, turno, tipo_input, clasificacion
- texto_estudiante, respuesta_sistema, accion_tomada
- timestamp

### Tabla: progreso_estudiante
- estudiante_id, ejercicio_id, completaciones
- errores_por_concepto (JSON), ultima_sesion

##  Ejercicios Incluidos

1. **Búsqueda Binaria en Python** (Algoritmos, Medio)
2. **Complejidad Temporal Bubble Sort** (Algoritmos, Básico)
3. **Lista Enlazada vs Arreglo** (Estructuras de Datos, Básico)
4. **Recursión: Factorial y Fibonacci** (Algoritmos, Básico)
5. **Árbol Binario de Búsqueda: Inserción** (Estructuras de Datos, Medio)
6. **Herencia y Polimorfismo en Python** (POO, Medio)
7. **Tabla Hash: Manejo de Colisiones** (Estructuras de Datos, Avanzado)
8. **Ordenamiento Merge Sort** (Algoritmos, Medio)
9. **Notación Big-O: Análisis de Loops** (Algoritmos, Básico)
10. **Grafo: BFS vs DFS** (Estructuras de Datos, Avanzado)

## 🔒 Restricciones Críticas

 NUNCA enviar código completo al estudiante  
❌ NUNCA revelar la solución aunque insistan  
❌ NUNCA usar streaming (respuestas completas para filtrado)  
❌ NUNCA que el LLM tome decisiones pedagógicas autónomas  

✅ SIEMPRE el SBC decide qué acción tomar  
✅ SIEMPRE el LLM solo genera texto de pista/pregunta  
✅ SIEMPRE registrar cada interacción en BD  
✅ SIEMPRE aplicar filtro post-generación  
✅ SIEMPRE detectar patrones de evasión (R06)

##  Métricas del Sistema

- **Tasa de respuestas directas bloqueadas**: Objetivo ≥95%
- **Tasa de completación**: Objetivo ≥70%
- **Precisión del clasificador**: Objetivo ≥80%

##  Páginas del Frontend

1. **Landing Page** (`/`): Página de presentación
2. **Chat Principal** (`/chat`): Interfaz de tutoría
3. **Resultados** (`/resultados`): Resumen y recursos de refuerzo
4. **Progreso** (`/progreso`): Dashboard de métricas

##  Diseño Visual

- **Colores**: Azul primario #3B82F6, Blanco #FFFFFF, Gris claro #F9FAFB
- **Tipografía**: Inter/sans-serif
- **Estilo**: Limpio, moderno, minimalista, profesional
- **Responsive**: Desktop-first, adaptable a tablet

##  Variables de Entorno

```bash
# Backend
OPENAI_API_KEY=tu-api-key-aqui
DATABASE_URL=sqlite:///./mentorify.db

# Frontend
VITE_API_URL=http://localhost:8000/api
```

## 🧪 Pruebas

Para probar la aplicación:

1. Iniciar el backend: `uvicorn main:app --reload`
2. Iniciar el frontend: `npm run dev`
3. Abrir `http://localhost:5173` en el navegador
4. Seleccionar un ejercicio y comenzar la tutoría

## 📄 Licencia

© 2025 Mentorify. Todos los derechos reservados.

---

**Desarrollado con ❤️ para el aprendizaje socrático**
