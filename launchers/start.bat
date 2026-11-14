@echo off
chcp 65001 >nul
title NEX-SCOPE - Asistente de Inicio y Auto-Reparación

echo ============================================================
echo   🔍 NEX-SCOPE - RADAR ESTRATÉGICO Y DE MONETIZACIÓN
echo ============================================================
echo.

cd /d "%~dp0\.."

:: 1. Comprobar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado o no se encuentra en el PATH.
    echo Descárgalo e instálalo desde: https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Crear .env.local si no existe
if not exist ".env.local" (
    if exist ".env.example" (
        echo [INFO] Creando archivo .env.local a partir de .env.example...
        copy ".env.example" ".env.local" >nul
    )
)

:: 3. Instalar node_modules si no existen
if not exist "node_modules" (
    echo [INFO] Instalando dependencias del proyecto (npm install)...
    echo Esto puede tardar 1 o 2 minutos en la primera ejecución...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Falló la instalación de dependencias con npm install.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas correctamente.
)

:: 4. Generar Prisma Client y sincronizar DB
echo [INFO] Inicializando base de datos local SQLite (Prisma)...
call npx prisma generate
call npx prisma db push --skip-generate >nul 2>nul

:: 5. Iniciar Servidor en Modo Dev
echo.
echo [OK] NEX-SCOPE listo para operar.
echo [INFO] Abriendo servidor en http://localhost:3000 ...
echo [INFO] Presiona Ctrl+C en esta ventana para detener el servidor.
echo ============================================================
echo.

start "" "http://localhost:3000"
call npm run dev
