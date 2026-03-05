# Parametric MIDI Sequencer  Web Prototype

## About

**MIDI Progression Editor** is a parametric MIDI sequencer for exploring and editing chord progressions. It combines an interactive React/TypeScript web interface with an ASP.NET Core Web API backend, enabling musicians to:

- Visualize musical scales and chord progressions
- Generate scales from any root note
- Explore different scale modes
- Export MIDI data for use in DAWs

## Prerequisites

- **Node.js** 18 or higher (for frontend)
- **.NET 10 SDK** (for backend)
- **npm** (comes with Node.js)

## Quick Start

### Option 1: Automated (Windows)

```bash
./run-dev.bat
```

This script orchestrates everything:
- Kills any existing processes on ports
- Starts backend on http://localhost:5110
- Starts frontend on http://localhost:5173
- Opens both in separate terminal windows

### Option 2: Manual Setup

**Terminal 1  Backend**

```bash
cd server/ParametricMusic.Api
dotnet restore  # First time only
dotnet run
```

- API listens on: http://localhost:5110
- Swagger UI: http://localhost:5110/swagger
- Health check: GET http://localhost:5110/health

**Terminal 2  Frontend**

```bash
cd client
npm install     # First time only
npm run dev
```

- App: http://localhost:5173

## Environment Variables

### Frontend

Create client/.env.local to override defaults:

```bash
VITE_API_BASE_URL=http://localhost:5110
```

**Default**: http://localhost:5110 (if not set)

See [client/.env.example](client/.env.example) for all available variables.

## API Client Type Generation

When you modify backend API endpoints, regenerate the TypeScript types **and client functions**:

```bash
cd client
npm run generate:api
```

This fetches the OpenAPI spec from your running backend and regenerates `src/api/generated/index.ts` with complete type-safe client functions.

**Requirements**:
- Backend must be running on port 5110
- Connected to localhost network

**When to regenerate**:
- After changing controller endpoints
- After modifying DTOs or response types
- After adding/removing API parameters
- After adding new controllers

**Usage**:
```typescript
import { client } from '@/api/client';

// Fully typed, all operations auto-generated from spec
const result = await client.post('/Scale/from-root', {
  query: { note: 'C' },
  body: { scaleType: 'major' }
});
```

## Testing

### Backend Tests

```bash
cd server/ParametricMusic.Tests
dotnet test
```

Runs xUnit test suite for business logic.

### Frontend Tests

Not yet implemented (planned for Phase 2).

## Lint & Code Quality

### Frontend

```bash
cd client
npm run lint
```

ESLint enforces zero-warnings (strict mode). All TypeScript files must pass.

### Backend

C# code follows:
- Nullable reference types enabled
- Implicit usings (no using statements at top)
- RESTful conventions

## Project Structure

### High-Level

```
midi-progression-editor/
 client/              # React + TypeScript + Vite (frontend)
    src/
       api/         # API client & generated types
       features/    # Feature modules
       shared/      # Shared components & utilities
       App.tsx
    .env.example     # Environment variable template
    package.json

 server/              # ASP.NET Core .NET 10 (backend)
     ParametricMusic.Api/
         Controllers/
         Models/
         Program.cs
         ParametricMusic.Api.csproj
```

For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Build

### Frontend

```bash
cd client
npm run build
# Output: client/dist/ (ready for deployment)
```

### Backend

```bash
cd server/ParametricMusic.Api
dotnet build
# Output: bin/Debug/net10.0/
```

For production:
```bash
dotnet publish -c Release -o ./publish
```

## Troubleshooting

### Port Already In Use

```bash
# Windows
netstat -ano | findstr :5110
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5110
kill -9 <PID>
```

### Swagger Returns 404

- Check backend is running on port 5110: http://localhost:5110/swagger
- Verify Program.cs has AddSwaggerGen() and Swagger middleware configured

### Generated Types Out of Sync

```bash
# Regenerate from running backend
cd client
npm run generate:api
```

## Technologies

- **Frontend**: React 19, TypeScript 5.9, Vite 7, ESLint 9
- **Backend**: ASP.NET Core .NET 10, Swashbuckle 10.1.4, xUnit 2.9
- **API**: OpenAPI/Swagger specification with code generation
- **Build**: npm + dotnet CLI
