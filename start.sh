#!/bin/bash

echo "🚀 Iniciando Mentorify..."
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio raíz del proyecto"
    exit 1
fi

# Iniciar backend en segundo plano
echo "📦 Iniciando backend (FastAPI) en puerto 8000..."
cd backend
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Esperar a que el backend inicie
sleep 3

# Verificar si el backend está corriendo
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Backend corriendo en http://localhost:8000"
else
    echo "️  Backend no responde aún, continuando..."
fi

echo ""
echo "📦 Iniciando frontend (Vite) en puerto 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Mentorify iniciado!"
echo ""
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores"
echo ""

# Esperar a que el usuario presione Ctrl+C
wait
