#!/usr/bin/env bash
# MIDI Progression Editor — Development Environment Launcher
# Starts both the ASP.NET Core backend and the Vite frontend in the background,
# then waits. Press Ctrl+C to stop both servers.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down servers..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting MIDI Progression Editor Development Environment..."
echo ""

# Free port 5110 (backend) if already occupied.
if lsof -ti:5110 >/dev/null 2>&1; then
  echo "[0/4] Freeing port 5110..."
  lsof -ti:5110 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# Free port 5173 (frontend) if already occupied.
if lsof -ti:5173 >/dev/null 2>&1; then
  echo "[0/4] Freeing port 5173..."
  lsof -ti:5173 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# Restore backend packages on first run (when obj/ does not exist yet).
if [ ! -d "$ROOT/server/ParametricMusic.Api/obj" ]; then
  echo "[1/4] Restoring backend packages (first-time setup)..."
  (cd "$ROOT/server/ParametricMusic.Api" && dotnet restore)
fi

# Install frontend dependencies on first run (when node_modules/ does not exist yet).
if [ ! -d "$ROOT/client/node_modules" ]; then
  echo "[2/4] Installing frontend dependencies (first-time setup)..."
  (cd "$ROOT/client" && npm install)
fi

echo "[3/4] Starting Backend (ASP.NET Core → http://localhost:5110)..."
(cd "$ROOT/server/ParametricMusic.Api" && dotnet run) &
BACKEND_PID=$!

echo "[4/4] Starting Frontend  (Vite        → http://localhost:5173)..."
(cd "$ROOT/client" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "==================================================================="
echo "  Backend:  http://localhost:5110"
echo "  Frontend: http://localhost:5173"
echo "  Swagger:  http://localhost:5110/swagger"
echo "==================================================================="
echo "Press Ctrl+C to stop both servers."
echo ""

wait
