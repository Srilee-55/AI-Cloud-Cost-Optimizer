@echo off
title AI Cloud Cost Optimizer - Launchpad
echo ======================================================================
echo 🚀 Starting AI Cloud Cost Optimizer Copilot...
echo ======================================================================
echo.

:: 1. Start Backend FastAPI Server
echo [1/2] Launching Python FastAPI Backend Server on port 8000...
start "AI Optimizer Backend" /min cmd /c "cd /d %~dp0\backend && ..\venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

:: 2. Start Frontend Vite Dev Server
echo [2/2] Launching Vite Frontend Dev Server on port 5173...
start "AI Optimizer Frontend" /min cmd /c "cd /d %~dp0\frontend && npx vite --host 0.0.0.0 --port 5173"

:: 3. Wait a few seconds for servers to initialize
timeout /t 3 /nobreak >nul

:: 4. Open default browser to Data Ingestion page
echo.
echo ✅ Servers are up and running!
echo 🌐 Opening: http://localhost:5173/cloud/data
echo.
start http://localhost:5173/cloud/data

echo ======================================================================
echo Application is active. Keep the minimized terminal windows running.
echo To stop the application, simply close the minimized backend/frontend windows.
echo ======================================================================
pause
