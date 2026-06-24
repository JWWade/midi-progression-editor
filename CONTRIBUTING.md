# Contributing to MIDI Progression Editor

Thank you for your interest in contributing!
This guide will get you from a fresh clone to a running development environment in a few minutes.

---

## Prerequisites

| Tool | Minimum version | Install |
|------|-----------------|---------|
| Node.js | 18 | [nodejs.org](https://nodejs.org) |
| npm | 9 (bundled with Node 18+) | — |
| .NET SDK | 10 | [dotnet.microsoft.com](https://dotnet.microsoft.com/en-us/download/dotnet) |
| Git | any recent | [git-scm.com](https://git-scm.com) |

Verify your environment:

```bash
node --version   # v18+
dotnet --version # 10.x.x
```

---

## Quick Start

### macOS / Linux

```bash
git clone https://github.com/JWWade/midi-progression-editor.git
cd midi-progression-editor
chmod +x run-dev.sh
./run-dev.sh
```

### Windows

```bat
git clone https://github.com/JWWade/midi-progression-editor.git
cd midi-progression-editor
run-dev.bat
```

Both launchers start the backend on **http://localhost:5110** and the frontend on **http://localhost:5173**.  
Press <kbd>Ctrl+C</kbd> (Linux/macOS) or close the terminal windows (Windows) to stop both servers.

### Manual startup (any platform)

```bash
# Terminal 1 — backend
cd server/ParametricMusic.Api
dotnet run

# Terminal 2 — frontend
cd client
cp .env.example .env.local   # only needed once
npm install                  # only needed once
npm run dev
```

---

## Environment Variables

The frontend reads one optional variable:

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:5110` | Backend base URL |

Copy the template and edit as needed:

```bash
cp client/.env.example client/.env.local
```

For local development the default (`http://localhost:5110`) is already correct — you only need to change it if the backend runs on a different host or port.

---

## Running Tests

```bash
# Frontend (Vitest — single pass)
cd client && npm test

# Frontend (watch mode)
cd client && npm run test:watch

# Backend (xUnit)
cd server/ParametricMusic.Tests && dotnet test
```

---

## Linting

The frontend uses ESLint with **zero warnings allowed**:

```bash
cd client && npm run lint
```

TypeScript strict mode is enforced in both compilation and ESLint. Fix all warnings before opening a PR — the CI pipeline will reject any warnings.

---

## Building

```bash
# Frontend
cd client && npm run build

# Backend
cd server && dotnet build --configuration Release
```

The frontend build output lands in `client/dist/`.

---

## Regenerating the API Client

Whenever you change a backend endpoint (add/remove/rename routes or request/response shapes), regenerate the TypeScript client **while the backend is running**:

```bash
cd client && npm run generate:api
```

This hits `http://localhost:5110/swagger/v1/swagger.json` and writes `src/api/generated/index.ts`. **Never edit that file by hand** — any manual edits will be overwritten on the next generation run.

---

## Project Layout

```
midi-progression-editor/
├── client/          # React + TypeScript + Vite frontend
│   └── src/
│       ├── api/     # API client and generated types
│       ├── app/     # Root component, providers, AppHeader
│       ├── features/# Self-contained feature modules
│       └── shared/  # Reusable components, hooks, utils
├── server/
│   ├── ParametricMusic.Api/    # ASP.NET Core Web API (.NET 10)
│   └── ParametricMusic.Tests/  # xUnit test suite
└── docs/            # Architecture decisions, spikes, audits
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for a detailed walkthrough and [docs/feature-module-convention.md](docs/feature-module-convention.md) for frontend module conventions.

---

## Making Changes

1. **Create a branch** off `develop`.
2. **Write or update tests** for your changes (see the existing test files in `__tests__/` subdirectories for examples).
3. **Run lint and tests** locally before pushing (`npm run lint && npm test` for the frontend; `dotnet test` for the backend).
4. **Regenerate the API client** if you changed any backend endpoint (`npm run generate:api` with the backend running).
5. **Update documentation** if your changes affect user-visible behaviour, introduce a new feature, or change an API surface:
   - Update relevant files in `docs/` (reference guides, architecture diagrams)
   - Update `ARCHITECTURE.md` if the system topology changes
   - Update `README.md` if the feature list or quick-start instructions change
   - If no documentation update is needed, tick the **"No documentation changes required"** checkbox in the PR template and explain why
6. **Open a PR** against `develop`. The CI pipeline will lint, test, build, and check documentation drift automatically.

### Required Checks Policy

- CI and Security workflows are expected to run for pull requests targeting `develop` and `main`.
- The **Documentation Check** workflow runs on every PR and fails if source code changes without a corresponding documentation update (unless the PR template's "No documentation changes required" box is checked).
- Configure repository branch protection so required checks block merges when CI, security scans, or the documentation check fails.

---

## Code Style

- **TypeScript**: strict mode is enabled — avoid `any`, use explicit types.
- **React**: functional components with hooks only (no class components).
- **C#**: nullable reference types are enabled; use implicit usings.
- **Imports**: use the `@/` path alias for cross-feature imports (e.g. `@/features/chord`).
- **Responsive CSS**: for component-local responsiveness, prefer container queries first. Reserve media queries for page-shell layout and environment preferences such as reduced motion, hover, pointer, or viewport-wide structural changes.

---

## Ports

| Service | URL |
|---------|-----|
| Frontend dev server | http://localhost:5173 |
| Backend HTTP | http://localhost:5110 |
| Swagger UI | http://localhost:5110/swagger |

If a port is already in use, stop the conflicting process and retry.  
On macOS/Linux: `lsof -ti:5110 | xargs kill -9`  
On Windows: `netstat -ano | findstr :5110`, then `taskkill /PID <pid> /F`

---

## Getting Help

- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design and data-flow details.
- Check the [docs/](docs/) folder for spike investigations and audit reports.
- Open an issue if something is unclear or broken.
