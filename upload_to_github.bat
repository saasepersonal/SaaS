@echo off
setlocal EnableDelayedExpansion
echo ==========================================
echo Automatizacion de Subida a GitHub
echo ==========================================
cd /d "c:\Users\Rooster\Desktop\saas"

REM 1. Inicializar Git si no existe
if not exist .git (
    echo [INFO] Inicializando repositorio Git...
    git init
    echo.
)

REM 2. Comprobar si existe el remoto 'origin'
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 goto :ASK_COMMIT

echo.
echo [!] ATENCION: No se ha detectado un repositorio remoto vinculado.
echo Por favor, ve a GitHub, crea un repositorio nuevo (vacio) y copia la URL.
echo Ejemplo: https://github.com/TuUsuario/tu-repo.git
echo.
set /p REPO_URL=">> Pega la URL del repositorio aqui: "

if "%REPO_URL%"=="" (
    echo [ERROR] No ingresaste una URL. El proceso no puede continuar.
    pause
    exit /b
)

git remote add origin !REPO_URL!
echo [OK] Repositorio vinculado correctamente.

:ASK_COMMIT
echo.
echo ==========================================
set /p COMMIT_MSG=">> Escribe un mensaje para este cambio (Enter para 'Actualizacion'): "
if "!COMMIT_MSG!"=="" set COMMIT_MSG=Actualizacion automatica

echo.
echo [1/3] Agregando archivos...
git add .
REM Ignorar warnings de line endings

echo.
echo [2/3] Guardando cambios localmente...
git commit -m "!COMMIT_MSG!"

echo.
echo [3/3] Subiendo a GitHub...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo [EXITO] Tu codigo se subio correctamente.
    echo Ahora ve a Vercel e importa este repositorio.
    echo ==========================================
) else (
    echo.
    echo ==========================================
    echo [ERROR] Algo fallo al subir.
    echo - Revisa tu conexion a internet.
    echo - Verifica que tengas permisos en el repositorio.
    echo ==========================================
)

echo.
pause
