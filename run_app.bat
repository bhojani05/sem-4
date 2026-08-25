@echo off
echo ===================================================
echo Starting FinVest Financial Buddy Servers...
echo ===================================================
powershell -Command "Stop-Process -Name python,node -ErrorAction SilentlyContinue" >nul 2>&1
cd /d "%~dp0backend"
start "FinVest Backend" cmd /k "python manage.py runserver 8000"
cd /d "%~dp0frontend"
start "FinVest Frontend" cmd /k "npm run dev"
echo ===================================================
echo Servers launched! Open http://localhost:5175/
echo ===================================================
