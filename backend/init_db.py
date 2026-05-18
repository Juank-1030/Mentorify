"""
Script para inicializar la base de datos de Mentorify
"""

from database.models import init_db

if __name__ == "__main__":
    print("Inicializando base de datos de Mentorify...")
    init_db()
    print("✅ Base de datos inicializada correctamente!")
    print("✅ Ejercicios seed cargados!")
