@echo off
setlocal
cd /d "%~dp0backend" || (echo ERROR: No se encuentra la carpeta backend. & pause & exit /b 1)

echo ==============================================
echo    CEBADA360 - Backend (Python 3.12)
echo ==============================================

if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" -c "import sys; sys.exit(0 if sys.version_info[:2] == (3, 12) else 1)" >nul 2>&1
    if errorlevel 1 (
        echo ERROR: El entorno .venv existente no utiliza Python 3.12.
        echo Renombra la carpeta backend\.venv y vuelve a ejecutar este archivo.
        pause
        exit /b 1
    )
) else (
    echo Creando entorno virtual con Python 3.12...
    py -3.12 -m venv .venv
    if errorlevel 1 goto :error
)

echo Verificando dependencias...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :error
".venv\Scripts\python.exe" -m pip install pytest
if errorlevel 1 goto :error

echo Ejecutando pruebas...
".venv\Scripts\python.exe" -m pytest -q
if errorlevel 1 goto :error

echo.
echo Pruebas aprobadas. Iniciando servidor en http://127.0.0.1:8000
".venv\Scripts\python.exe" -m uvicorn main:app --reload --port 8000
if errorlevel 1 goto :error
exit /b 0

:error
echo.
echo ERROR: No se pudo completar el inicio del backend.
pause
exit /b 1