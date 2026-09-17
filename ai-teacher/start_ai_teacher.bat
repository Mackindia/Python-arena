@echo off
title AI Teacher Server - Port 8000
color 0A

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║        AI Teacher Assistant - FastAPI            ║
echo  ╠══════════════════════════════════════════════════╣
echo  ║  Server  : http://localhost:8000                 ║
echo  ║  Docs    : http://localhost:8000/docs            ║
echo  ║  ReDoc   : http://localhost:8000/redoc           ║
echo  ╚══════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/3] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Install Python 3.10+ and add to PATH.
    pause
    exit /b 1
)
echo       Python OK

echo [2/3] Checking uvicorn...
python -c "import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo [WARN] uvicorn not found. Installing from requirements.txt...
    pip install -r requirements.txt
)
echo       uvicorn OK

echo [3/3] Starting server...
echo.
echo  ──────────────────────────────────────────────────
echo   Server is starting... 
echo   Press Ctrl+C to stop
echo  ──────────────────────────────────────────────────
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo  Server stopped.
pause
