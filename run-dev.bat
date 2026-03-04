@echo off
REM MIDI Progression Editor - Development Environment Launcher
REM Starts both backend (ASP.NET Core) and frontend (Vite) servers

echo Starting MIDI Progression Editor Development Environment...
echo.

REM Kill any existing dotnet/backend processes to free up ports
echo [0/3] Cleaning up existing processes...
taskkill /F /IM dotnet.exe >nul 2>&1
taskkill /F /IM "ParametricMusic.Api.exe" >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start the backend server in a new window
echo [1/3] Starting Backend Server (ASP.NET Core)...
start "Backend - ParametricMusic.Api" /D "%~dp0server\ParametricMusic.Api" cmd /k "dotnet run || pause"

REM Wait for the backend to initialize
timeout /t 5 /nobreak >nul

REM Start the frontend dev server in a new window
echo [2/3] Starting Frontend Dev Server (Vite)...
start "Frontend - Client" /D "%~dp0client" cmd /k "npm run dev || pause"

echo.
echo ===================================================================
echo Both servers are starting in separate windows:
echo   - Backend:  http://localhost:5110
echo   - Frontend: http://localhost:5173
echo   - Swagger:  http://localhost:5110/swagger
echo ===================================================================
echo.
echo If you see errors in the opened terminal windows, they will stay open.
echo Press any key to close this launcher window...
pause >nul
