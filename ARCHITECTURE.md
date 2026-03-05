# MIDI Progression Editor - Architecture Guide

## Overview

**MIDI Progression Editor** is a parametric MIDI sequencer designed for editing and exploring chord progressions. It combines a React/TypeScript frontend with an ASP.NET Core Web API backend, enabling musical exploration through an interactive web interface.

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19 | UI framework |
| **Frontend Build** | Vite | 7 | Fast build tooling and dev server |
| **Frontend Language** | TypeScript | 5.9 | Type-safe JavaScript |
| **API Client** | openapi-typescript | 7.13 | Type generation from OpenAPI spec |
| **Backend** | ASP.NET Core Web API | .NET 10 | REST API server |
| **Backend Language** | C# | Latest (implicit usings) | Type-safe backend logic |
| **API Documentation** | Swagger/Swashbuckle | 10.1.4 | OpenAPI specification generation |
| **Testing** | xUnit | 2.9.3 | Backend unit tests |

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Application (http://localhost:5173)            │  │
│  │  - Feature-based folder structure                     │  │
│  │  - Auto-generated API types (openapi-typescript)      │  │
│  │  - Handwritten API client (fetch-based)               │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST
                   │ (localhost:5110)
┌──────────────────▼──────────────────────────────────────────┐
│              ASP.NET CORE WEB API                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Controllers (Health, Scale)                          │  │
│  │  ↓                                                     │  │
│  │  Business Logic (ScaleGenerator)                      │  │
│  │  ↓                                                     │  │
│  │  DTOs & Models (Note enum, NoteInfo, etc.)           │  │
│  │  ↓                                                     │  │
│  │  Swagger (OpenAPI specification)                      │  │
│  └───────────────────────────────────────────────────────┘  │
│  Port: 5110 (HTTP), 7088 (HTTPS)                           │
└─────────────────────────────────────────────────────────────┘
```

### Key Communication Flow

1. **Frontend** imports auto-generated types from `src/api/generated/`
2. **Frontend** uses handwritten client functions in `src/api/client/`
3. **Client functions** make HTTP requests to backend API
4. **Backend** processes requests via Controllers and returns JSON
5. **Frontend** renders responses using React components

---

## Frontend Architecture

### Project Structure

```
client/
├── src/
│   ├── api/                              # API integration layer
│   │   ├── client/
│   │   │   └── index.ts                 # Handwritten fetch-based API client
│   │   ├── generated/
│   │   │   └── index.ts                 # Auto-generated types (DO NOT EDIT)
│   │   └── index.ts                      # Public exports
│   │
│   ├── app/                              # Application bootstrap
│   │   ├── App.tsx                      # Root component
│   │   ├── main.tsx                     # Entry point
│   │   ├── providers/                   # Context providers (future)
│   │   ├── routes/                      # Routing configuration (future)
│   │   └── store/                       # Global state (future)
│   │
│   ├── features/                         # Feature modules (feature-based architecture)
│   │   ├── chromatic-circle/
│   │   │   ├── api/                     # Feature-specific API calls
│   │   │   ├── components/              # Feature components (stubs)
│   │   │   ├── hooks/                   # Feature-specific hooks
│   │   │   ├── types/                   # Feature types
│   │   │   └── utils/                   # Feature utilities
│   │   │
│   │   └── scale/
│   │       ├── api/                     # Scale API integration
│   │       ├── components/              # Scale components
│   │       ├── hooks/                   # Scale hooks
│   │       ├── types/                   # Scale types
│   │       └── utils/                   # Scale utilities
│   │
│   ├── shared/                           # Shared across features
│   │   ├── components/                  # Reusable components
│   │   ├── hooks/                       # Reusable hooks
│   │   ├── types/                       # Global types
│   │   └── utils/                       # Helper functions
│   │
│   ├── assets/                           # Static assets (images, etc.)
│   ├── styles/                           # Global styles
│   └── index.css                         # Global CSS
│
├── public/                                # Static files (served as-is)
├── .env.example                           # Environment variable template
├── eslint.config.js                       # ESLint configuration (flat config)
├── tsconfig.json                          # TypeScript root configuration
├── tsconfig.app.json                      # App TypeScript configuration
├── tsconfig.node.json                     # Build tools TypeScript configuration
├── vite.config.ts                         # Vite configuration
├── package.json                           # Dependencies and scripts
└── README.md                              # Frontend-specific documentation
```

### Architecture Patterns

#### Feature-Based Structure

Each feature module is self-contained with:
- **api/**: Feature-specific API calls (wrapping shared client)
- **components/**: Feature React components
- **hooks/**: Feature-specific custom hooks
- **types/**: Feature TypeScript types
- **utils/**: Feature helper functions

#### API Client Pattern

**Two-layer approach**:

1. **Generated Layer** (`src/api/generated/`):
   - Auto-generated TypeScript types from OpenAPI spec
   - Includes `operations`, `components` type definitions
   - Regenerated via `npm run generate:api`
   - **Never edit manually**

2. **Handwritten Client** (`src/api/client/`):
   - Fetch-based HTTP client
   - Wraps generated types for type safety
   - Handles errors, base URL configuration
   - Example:
     ```typescript
     export async function getScaleFromRoot(note: Note): Promise<NoteInfo[]> {
       const res = await fetch(`${API_BASE}/Scale/from-root?note=${note}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ scaleType: 'major' })
       });
       if (!res.ok) throw new Error(`Failed: ${res.status}`);
       return res.json();
     }
     ```

#### Path Alias

Configured in `vite.config.ts`:
```typescript
alias: {
  '@': '/src'
}
```

Use in imports:
```typescript
import { SomeComponent } from '@/shared/components';  // instead of ../../../shared/...
```

### Current Implementation Status

- ✅ **Chromatic Circle**: Functional visualization component
- ✅ **Structure**: Feature-based architecture in place
- ⏳ **Scale Editor**: Stub component (implementation pending)
- ⏳ **Routing**: Not yet implemented
- ⏳ **State Management**: Not yet implemented
- ⏳ **Tests**: Not yet implemented

---

## Backend Architecture

### Project Structure

```
server/ParametricMusic.Api/
├── Controllers/
│   ├── HealthController.cs               # GET /Health
│   └── ScaleController.cs                # POST /Scale/from-root
│
├── Models & DTOs/
│   ├── Note.cs                           # Enum (C=0...B=11) + extensions
│   ├── ScaleType.cs                      # Enum (Major, Minor)
│   ├── NoteInfo.cs                       # DTO (Index: int, Name: string)
│   └── ScaleOptionsDto.cs                # DTO (ScaleType field)
│
├── Business Logic/
│   └── ScaleGenerator.cs                 # Scale generation logic
│
├── Configuration/
│   ├── Program.cs                        # App configuration, middleware setup
│   ├── Properties/
│   │   └── launchSettings.json          # Launch profiles & ports
│   ├── appsettings.json                  # Configuration
│   └── appsettings.Development.json      # Development overrides
│
├── Tools/
│   ├── ParametricMusic.Api.csproj        # Project file
│   └── ParametricMusic.Api.http          # HTTP requests for testing
│
└── Tests/
    └── ../ParametricMusic.Tests/
        ├── ScaleGeneratorTests.cs        # xUnit tests for scale generation
        └── ParametricMusic.Tests.csproj
```

### Architecture Pattern

**Layered Architecture**:

```
Controller Layer
    ↓
Business Logic Layer (ScaleGenerator)
    ↓
DTOs & Models Layer (Note enum, NoteInfo, etc.)
```

### Key Components

#### Controllers

**HealthController**
```csharp
[HttpGet]
public IActionResult Get() => Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
```
- Endpoint: `GET /Health`
- Purpose: Simple health check
- Response: Anonymous object with status and timestamp

**ScaleController**
```csharp
[HttpPost("from-root")]
public IActionResult BuildScale([FromQuery] Note note, [FromBody] ScaleOptionsDto options)
```
- Endpoint: `POST /Scale/from-root`
- Query: `note` (enum: C, CSharp, D, DSharp, E, F, FSharp, G, GSharp, A, ASharp, B)
- Body:
  ```json
  { "scaleType": "major" | "minor" }
  ```
- Response: `NoteInfo[]` array with index and name for each note in scale

#### Models & Enums

**Note Enum**
```csharp
public enum Note { C=0, CSharp, D, DSharp, E, F, FSharp, G, GSharp, A, ASharp, B }
```
- Pitch class values (0-11)
- Display attributes: `[Display(Name = "C#")]` etc.
- Extensions: `GetDisplayName()`, `TryParse(string)`

**ScaleType Enum**
```csharp
[Display(Name = "Major", Description = "Major scale (Ionian mode)")]
public enum ScaleType { Major, Minor }
```
- Currently only Major is implemented

**NoteInfo DTO**
```csharp
public class NoteInfo {
    public int Index { get; init; }      // MIDI pitch class (0-11)
    public string Name { get; init; }     // Display name (e.g., "C#")
}
```

**ScaleOptionsDto**
```csharp
public class ScaleOptionsDto {
    [JsonPropertyName("scaleType")]
    public ScaleType ScaleType { get; set; } = ScaleType.Major;
}
```

#### Business Logic

**ScaleGenerator**
```csharp
public static class ScaleGenerator {
    private static readonly int[] MajorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];
    
    public static NoteInfo[] BuildMajorScale(int root) {
        return MajorScaleIntervals
            .Select(interval => {
                var noteIndex = (root + interval) % 12;
                var note = (Note)noteIndex;
                return new NoteInfo(noteIndex, note.GetDisplayName());
            })
            .ToArray();
    }
}
```
- Static utility class with music theory calculations
- Returns rich DTO objects (not raw numbers)
- Supports scale building from any root note

### Configuration

#### Program.cs Setup

```csharp
// CORS: Allow frontend dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalDev", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Swagger: OpenAPI spec generation & UI
builder.Services.AddSwaggerGen();

// JSON: Enum serialization as strings
builder.Services.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(allowIntegerValues: false));
});
```

#### Launch Settings

Port configuration in `launchSettings.json`:
- **HTTP**: `http://localhost:5110` (primary)
- **HTTPS**: `https://localhost:7088` (secondary)
- Environment: `Development`

### Testing

**xUnit Tests** in `ParametricMusic.Tests/`:

```csharp
[Theory]
[InlineData(0)]      // C major
[InlineData(5)]      // F major (with wraparound)
public void BuildMajorScale_ReturnsSevenNotes(int root) {
    var result = ScaleGenerator.BuildMajorScale(root);
    Assert.Equal(7, result.Length);
}
```

Tests cover:
- Correct number of notes returned (always 7)
- Proper handling of note wraparound (e.g., B major)
- Specific note sequences for known roots

---

## API Contract

### OpenAPI/Swagger Integration

The backend automatically generates an OpenAPI specification that describes all endpoints, request/response types, and parameters. This specification enables **type-safe API client generation**.

### Type Generation Workflow

```
┌─────────────────────────────────────┐
│  Backend Running (http://localhost:  │
│  5110/swagger/v1/swagger.json)       │
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  Developer Runs:                      │
│  npm run generate:api                │
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  openapi-typescript Fetches Spec     │
│  and Generates TypeScript Types      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  client/src/api/generated/index.ts   │
│  Created with full type definitions  │
└──────────────────────────────────────┘
```

### Synchronization Strategy

**Keep frontend and backend in sync:**

1. **Backend changes** → Update controllers/DTOs → Start backend
2. **Run** `npm run generate:api` → Regenerates types
3. **Frontend changes** → Import fresh types → No type errors
4. **Commit** both backend and generated types to git

⚠️ **Critical**: Never edit `src/api/generated/index.ts` manually. Always regenerate.

### Current API Endpoints

| Method | Endpoint | Parameters | Response |
|--------|----------|-----------|----------|
| `GET` | `/Health` | None | `{ status: string, timestamp: string }` |
| `POST` | `/Scale/from-root` | `note` (query), `{ scaleType: "major" \| "minor" }` (body) | `NoteInfo[]` |

**Example Request**:
```bash
curl -X POST "http://localhost:5110/Scale/from-root?note=C" \
  -H "Content-Type: application/json" \
  -d '{"scaleType":"major"}'
```

**Example Response**:
```json
[
  { "index": 0, "name": "C" },
  { "index": 2, "name": "D" },
  { "index": 4, "name": "E" },
  { "index": 5, "name": "F" },
  { "index": 7, "name": "G" },
  { "index": 9, "name": "A" },
  { "index": 11, "name": "B" }
]
```

---

## Development Workflow

### Prerequisites

- **Node.js** 18+ (for frontend)
- **.NET 10 SDK** (for backend)
- **npm** (comes with Node.js)

### Setup

#### First-Time Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd midi-progression-editor
   ```

2. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Restore backend packages**
   ```bash
   cd server/ParametricMusic.Api
   dotnet restore
   cd ../..
   ```

#### Local Development

**Option 1: Automated (Windows)**
```bash
./run-dev.bat
```
- Kills any existing processes
- Starts backend on `http://localhost:5110`
- Starts frontend on `http://localhost:5173`
- Opens separate terminal windows for each

**Option 2: Manual**

Terminal 1 - Backend:
```bash
cd server/ParametricMusic.Api
dotnet run
# Listens on http://localhost:5110
# Swagger UI at http://localhost:5110/swagger
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
# Listens on http://localhost:5173
```

### Environment Variables

**Frontend** (`client/.env`):
```
VITE_API_BASE_URL=http://localhost:5110
```

Default (if not set): `http://localhost:5110`

Create `client/.env.local` to override for local development:
```bash
cd client
echo 'VITE_API_BASE_URL=http://localhost:5110' > .env.local
```

### Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Backend HTTP | 5110 | `http://localhost:5110` |
| Backend HTTPS | 7088 | `https://localhost:7088` |
| Frontend Dev | 5173 | `http://localhost:5173` |
| Swagger UI | 5110 | `http://localhost:5110/swagger` |

⚠️ **Important**: API_BASE_URL must match backend port (5110). The default was historically 5000 but has been updated.

---

## Code Generation

### API Client Type Generation

Generate TypeScript types from OpenAPI spec:

```bash
cd client
npm run generate:api
```

This command:
1. Fetches OpenAPI spec from `http://localhost:5110/swagger/v1/swagger.json`
2. Generates TypeScript types into `src/api/generated/index.ts`
3. Overwrites the previous generated file

**Requirements**:
- Backend must be running on port 5110
- Network access to localhost (usually allowed locally)

**When to regenerate**:
- After changing any API endpoint in backend
- After changing request/response DTOs
- After changing enum values
- After adding new controllers

**Workflow**:
1. Modify backend code (add controller, change DTO, etc.)
2. Run backend: `dotnet run`
3. Generate types: `npm run generate:api`
4. Update frontend to use new types
5. Commit both generated types and backend changes

---

## Build & Deployment

### Frontend Build

```bash
cd client
npm run build
```

Outputs optimized files to `client/dist/`:
- TypeScript compiled to JavaScript
- Assets bundled and minified
- Vite handles code-splitting and tree-shaking

**Build process**:
1. TypeScript compilation (`tsc -b`)
2. Vite production build (rollup bundling)
3. Outputs ready-to-serve static files

### Backend Build

```bash
cd server/ParametricMusic.Api
dotnet build
```

Outputs to `bin/Debug/net10.0/`:
- Compiled assemblies
- Dependencies resolved
- Ready to run via `dotnet run`

**For production publish**:
```bash
dotnet publish -c Release -o ./publish
```

### Running Tests

**Backend tests**:
```bash
cd server/ParametricMusic.Tests
dotnet test
```

**Frontend tests**: Not yet implemented (for future development)

---

## Known Issues & Future Improvements

### ⚠️ Known Issues

1. **API Contract Mismatch** (Planned Fix)
   - Frontend expects certain parameter names/types
   - Backend implementation differs
   - Resolution: Align backend with contracted API during next sprint

2. **Windows-Only Dev Script**
   - `run-dev.bat` only works on Windows
   - Plan: Create shell script for Linux/Mac

3. **Minimal Frontend Implementation**
   - State management not yet integrated
   - Routing not yet implemented
   - Only basic components work

### 🚀 Future Improvements

- [ ] Implement scale editor UI
- [ ] Add state management (Zustand or Redux)
- [ ] Implement client-side routing
- [ ] Add frontend unit tests (Vitest)
- [ ] Support for minor scales (backend ready, UI pending)
- [ ] MIDI export functionality
- [ ] Audio playback integration
- [ ] Cross-platform dev script (shell version)
- [ ] Docker configuration
- [ ] Performance monitoring

---

## References

- **Frontend**: [React 19 Docs](https://react.dev), [Vite Docs](https://vitejs.dev)
- **Backend**: [ASP.NET Core Docs](https://learn.microsoft.com/en-us/aspnet/core/), [Swashbuckle Docs](https://github.com/domaindrivendev/Swashbuckle.AspNetCore)
- **API Generation**: [openapi-typescript](https://openapi-ts.dev/)
- **Testing**: [xUnit Docs](https://xunit.net/)

---

**Last Updated**: March 4, 2026
