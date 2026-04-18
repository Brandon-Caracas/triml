@echo off
REM Script de instalación para Windows

echo 🚀 Inicializando Peluquería SaaS...

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no está instalado. Descárgalo desde https://nodejs.org
    exit /b 1
)

echo ✅ Node.js versión:
node -v

REM Backend setup
echo.
echo 📦 Instalando Backend...
cd backend
call npm install
if exist .env (
    echo ⚠️  backend\.env ya existe
) else (
    copy .env.example .env
    echo ⚠️  Actualiza el archivo backend\.env
)

REM Frontend setup
echo.
echo 📦 Instalando Frontend...
cd ..\frontend
call npm install

echo.
echo ✅ ¡Instalación completada!
echo.
echo 📝 Próximos pasos:
echo 1. Edita backend\.env con tu configuración
echo 2. Abre dos terminales:
echo    Terminal 1: cd backend ^&^& npm run dev
echo    Terminal 2: cd frontend ^&^& npm run dev
echo 3. Accede a http://localhost:5173
echo.
echo 🎉 ¡Listo!
