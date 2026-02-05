@echo off
title Pre-Execution Risk Guardian

echo ========================================
echo   Pre-Execution Risk Guardian Launcher
echo ========================================
echo.

:: Start Backend
echo [1/2] Starting Backend (FastAPI + Gemini)...
start "Guardian Backend" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Frontend
echo [2/2] Starting Frontend (React + Vite)...
start "Guardian Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo.
echo   Close this window or press any key to exit.
echo ========================================
pause > nul
