@echo off
REM MIDI Progression Editor - Development Environment Launcher
REM Starts both backend (ASP.NET Core) and frontend (Vite) servers

echo Starting MIDI Progression Editor Development Environment...
echo.

REM Start the backend server in a new window
echo [1/2] Starting Backend Server (ASP.NET Core)...
start "Backend - ParametricMusic.Api" /D "%~dp0server\ParametricMusic.Api" dotnet run

REM Wait a moment for the backend to initialize
timeout /t 2 /nobreak >nul

REM Start the frontend dev server in a new window
echo [2/2] Starting Frontend Dev Server (Vite)...
start "Frontend - Client" /D "%~dp0client" npm run dev

echo.
echo ===================================================================
echo Both servers are starting in separate windows:
echo   - Backend:  http://localhost:5000 (or as configured)
echo   - Frontend: http://localhost:5173
echo   - Swagger:  http://localhost:5000/swagger (or as configured)
echo ===================================================================
echo.
echo Press any key to exit this launcher window...
pause >nul
