# Mentorify - Script de arranque del backend
# Ejecutar desde la carpeta raiz del proyecto: .\start_backend.ps1

$ErrorActionPreference = "Stop"

Write-Host "Iniciando Mentorify Backend..." -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "backend\main.py")) {
    Write-Host "Error: Ejecuta este script desde la carpeta raiz del proyecto Mentorify" -ForegroundColor Red
    exit 1
}

# Instalar dependencias si no estan instaladas
Write-Host "Verificando dependencias..." -ForegroundColor Yellow
pip install -r backend\requirements.txt --quiet

# Iniciar el servidor
Write-Host "Servidor corriendo en http://localhost:8000" -ForegroundColor Green
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
