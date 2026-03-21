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

# Kill any process already holding port 5110 so dotnet run succeeds.
if lsof -ti:5110 >/dev/null 2>&1; then
  echo "[0/2] Freeing port 5110..."
  lsof -ti:5110 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "[1/2] Starting Backend (ASP.NET Core → http://localhost:5110)..."
(cd "$ROOT/server/ParametricMusic.Api" && dotnet run) &
BACKEND_PID=$!

echo "[2/2] Starting Frontend  (Vite        → http://localhost:5173)..."
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
