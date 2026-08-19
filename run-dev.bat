@echo off
REM MIDI Progression Editor - Development Environment Launcher
REM Starts both backend (ASP.NET Core) and frontend (Vite) servers

echo Starting MIDI Progression Editor Development Environment...
echo.

REM Free port 5110 (backend) if already occupied — targeted kill by port only.
echo [0/4] Freeing port 5110 if occupied...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":5110 "') DO (
  taskkill /F /PID %%P >nul 2>&1
)

REM Free port 5173 (frontend) if already occupied — targeted kill by port only.
echo [0/4] Freeing port 5173 if occupied...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":5173 "') DO (
  taskkill /F /PID %%P >nul 2>&1
)

timeout /t 2 /nobreak >nul

REM Check Node.js version and warn if below dependency engine minimums.
set NODE_VERSION=
FOR /F %%V IN ('node -p "process.versions.node" 2^>nul') DO set NODE_VERSION=%%V
IF NOT DEFINED NODE_VERSION (
  echo [preflight] WARNING: Unable to detect Node.js version. Some frontend dependencies may fail.
) ELSE (
  powershell -NoProfile -Command "$min=[version]'22.22.2'; $cur=[version]'%NODE_VERSION%'; if ($cur -lt $min) { exit 1 } else { exit 0 }" >nul 2>&1
  IF ERRORLEVEL 1 (
    echo [preflight] WARNING: Node.js %NODE_VERSION% detected. Recommended minimum is 22.22.2.
    echo [preflight]          Frontend install can appear stalled while npm resolves engine mismatches.
  )
)

REM Restore backend packages on first run (when obj\ does not exist yet).
IF NOT EXIST "%~dp0server\ParametricMusic.Api\obj" (
  echo [1/4] Restoring backend packages first-time setup...
  pushd "%~dp0server\ParametricMusic.Api"
  dotnet restore
  popd
)

REM Ensure frontend dependencies are up to date to avoid stale local installs.
echo [2/4] Ensuring frontend dependencies are up to date... this can take 15-60s
pushd "%~dp0client"
call npm install --no-audit --no-fund --loglevel=warn
IF ERRORLEVEL 1 (
  echo Frontend dependency install failed. Fix npm errors above, then rerun.
  popd
  pause
  exit /b 1
)
echo [2/4] Frontend dependency check complete.
popd

REM Start the backend server in a new window
echo [3/4] Starting Backend Server (ASP.NET Core)...
start "Backend - ParametricMusic.Api" /D "%~dp0server\ParametricMusic.Api" cmd /k "dotnet run || pause"

REM Wait for the backend to initialize
timeout /t 5 /nobreak >nul

REM Start the frontend dev server in a new window
echo [4/4] Starting Frontend Dev Server (Vite)...
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
