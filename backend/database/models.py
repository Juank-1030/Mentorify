"""
Modelos de Base de Datos - SQLAlchemy
Tablas: sesiones, interacciones, ejercicios, progreso_estudiante
"""

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = "sqlite:///./mentorify.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==================== MODELOS ====================

class Ejercicio(Base):
    __tablename__ = "ejercicios"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    enunciado = Column(Text, nullable=False)
    dominio = Column(String(50), nullable=False)
    nivel_dificultad = Column(String(20), nullable=False)
    conceptos_clave = Column(JSON, default=list)
    solucion_referencia = Column(Text, nullable=True)  # PRIVADO, no enviar al frontend
    criterios_verificacion = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sesiones = relationship("Sesion", back_populates="ejercicio")

class Sesion(Base):
    __tablename__ = "sesiones"
    
    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(String(100), nullable=False, index=True)
    ejercicio_id = Column(Integer, ForeignKey("ejercicios.id"), nullable=False)
    fecha_inicio = Column(DateTime, default=datetime.utcnow)
    fecha_fin = Column(DateTime, nullable=True)
    estado_actual = Column(String(50), default="INICIO_SESION")
    pistas_entregadas = Column(Integer, default=0)
    errores_consecutivos = Column(Integer, default=0)
    errores_totales = Column(Integer, default=0)
    completado = Column(Boolean, default=False)
    
    ejercicio = relationship("Ejercicio", back_populates="sesiones")
    interacciones = relationship("Interaccion", back_populates="sesion")

class Interaccion(Base):
    __tablename__ = "interacciones"
    
    id = Column(Integer, primary_key=True, index=True)
    sesion_id = Column(Integer, ForeignKey("sesiones.id"), nullable=False)
    turno = Column(Integer, nullable=False)
    tipo_input = Column(String(50), nullable=False)
    clasificacion = Column(JSON, default=dict)
    texto_estudiante = Column(Text, nullable=False)
    respuesta_sistema = Column(Text, nullable=False)
    accion_tomada = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    sesion = relationship("Sesion", back_populates="interacciones")

class ProgresoEstudiante(Base):
    __tablename__ = "progreso_estudiante"
    
    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(String(100), nullable=False, index=True)
    ejercicio_id = Column(Integer, nullable=False)
    completaciones = Column(Integer, default=0)
    errores_por_concepto = Column(JSON, default=dict)
    ultima_sesion = Column(DateTime, default=datetime.utcnow)

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    sesion_id = Column(Integer, nullable=False, index=True)
    estudiante_id = Column(String(100), nullable=False, index=True)
    tema = Column(String(200), nullable=False)
    preguntas = Column(JSON)          # list of {id, pregunta, opciones, correcta, explicacion}
    puntaje = Column(Integer, nullable=True)
    respuestas_usuario = Column(JSON, nullable=True)   # {1: "A", 2: "C", ...}
    feedback_respuestas = Column(JSON, nullable=True)  # {1: {correcto, explicacion}, ...}
    completado = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# ==================== FUNCIONES DE INICIALIZACIÓN ====================

def init_db():
    """Inicializar la base de datos y poblar con datos de ejemplo"""
    Base.metadata.create_all(bind=engine)
    
    # Poblar ejercicios iniciales
    from backend.database.ejercicios_seed import seed_ejercicios
    seed_ejercicios()

def get_db():
    """Obtener sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
