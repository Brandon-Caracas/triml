#!/bin/bash

# Script de instalación del proyecto completo

echo "🚀 Inicializando Peluquería SaaS..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo desde https://nodejs.org"
    exit 1
fi

echo "✅ Node.js versión: $(node -v)"

# Backend setup
echo ""
echo "📦 Instalando Backend..."
cd backend
npm install
cp .env.example .env
echo "⚠️  Actualiza el archivo backend/.env con tus valores"

# Frontend setup
echo ""
echo "📦 Instalando Frontend..."
cd ../frontend
npm install

echo ""
echo "✅ ¡Instalación completada!"
echo ""
echo "📝 Próximos pasos:"
echo "1. Edita backend/.env con tu configuración de MongoDB y JWT"
echo "2. Abre dos terminales:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo "3. Accede a http://localhost:5173"
echo ""
echo "🎉 ¡Listo para comenzar!"
