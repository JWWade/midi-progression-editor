# Copilot Instructions

## Project Overview

This is a **Parametric MIDI Sequencer** — a web-based prototype for editing MIDI chord progressions. It consists of a React/TypeScript frontend and an ASP.NET Core backend.

## Repository Structure

```
midi-progression-editor/
├── client/                        # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── api/                   # API client & auto-generated types
│   │   │   └── generated/index.ts # DO NOT EDIT — regenerate with `npm run generate:api`
│   │   ├── app/                   # Root component, AppHeader, context providers
│   │   ├── features/              # Feature modules (see Feature Modules section)
│   │   └── shared/                # Shared components, hooks, types, utils
│   ├── public/
│   └── package.json
└── server/
    ├── ParametricMusic.Api/       # ASP.NET Core (.NET 10) Web API
    │   ├── Controllers/           # HealthController, ChordController, ScaleController, ProgressionController
    │   ├── Models/                # DTOs and enums
    │   ├── Services/              # ChordGenerator, ScaleGenerator, ProgressionAnalyzer, QuartalChordGenerator
    │   └── Program.cs
    └── ParametricMusic.Tests/     # xUnit test suite
```

## Tech Stack

- **Frontend**: React 19, TypeScript (strict), Vite 7, ESLint 9
- **Backend**: ASP.NET Core Web API, .NET 10, Swashbuckle (Swagger)
- **Testing**: Vitest (frontend), xUnit (backend)

## Local Development

### Backend

```bash
cd server/ParametricMusic.Api
dotnet run
```

- API: `http://localhost:5110`
- Swagger UI: `http://localhost:5110/swagger`
- Health check: `GET http://localhost:5110/health`

### Frontend

```bash
cd client
npm install
npm run dev
```

- App: `http://localhost:5173`
- Set `VITE_API_BASE_URL=http://localhost:5110` in `client/.env.local` (see `client/.env.example`)

## Build

### Frontend

```bash
cd client
npm run build
```

### Backend

```bash
cd server/ParametricMusic.Api
dotnet build
```

## Test

### Frontend

```bash
cd client
npm test
```

Runs Vitest in single-pass mode. Currently covers MIDI file construction utilities.

### Backend

```bash
cd server/ParametricMusic.Tests
dotnet test
```

Runs xUnit tests covering business logic (ChordGenerator, ScaleGenerator, ProgressionAnalyzer) and HTTP controller contracts.

## Lint

### Frontend

```bash
cd client
npm run lint
```

ESLint is configured with zero warnings allowed (`--max-warnings=0`). All TypeScript files under `client/src/` must pass the lint check.

## API Client Code Generation

When backend API endpoints are modified, regenerate the TypeScript client:

```bash
cd client
npm run generate:api
```

This fetches the OpenAPI spec from the running backend (`http://localhost:5110`) and regenerates `src/api/generated/index.ts`. **Never edit `src/api/generated/index.ts` manually.**

Usage in components:

```typescript
import { client } from '@/api/client';

const scale = await client.post('/Scale/from-root', {
  query: { note: 'C' },
  body: { scaleType: 'major' }
});
```

## Coding Conventions

- **TypeScript**: Strict mode is enabled. Use explicit types and avoid `any`.
- **React**: Use functional components with hooks. No class components.
- **C#**: Nullable reference types are enabled (`<Nullable>enable</Nullable>`). Use implicit usings (no `using` statements at file top).
- **API**: Follow RESTful conventions. Add new endpoints as controllers under `server/ParametricMusic.Api/Controllers/`.
- **CORS**: The backend allows requests from `http://localhost:5173` during local development.
- **Path alias**: `@` maps to `client/src/`. Prefer `@/features/...` over relative imports across feature boundaries.
- **Generated files**: Never manually edit `client/src/api/generated/index.ts`; always regenerate with `npm run generate:api`.
- **Responsive CSS**: For all net-new component-level responsive work, prefer container queries first. Use media queries for page-shell layout and environment preferences such as reduced motion, hover, pointer, or viewport-wide structural changes.

## Feature Modules

The frontend follows a **feature-based architecture**. Each module under `client/src/features/` is self-contained with `api/`, `components/`, `hooks/`, `types/`, and `utils/` sub-folders as needed.

| Module | Purpose |
|--------|---------|
| `audio` | In-browser chord audio playback |
| `chord` | Core chord data, types (`ChordType`), and utilities |
| `chord-animation` | Animated 350 ms easeInOutQuad polygon morphing (`useChordMorphing`) |
| `chord-geometry` | Polygon vertex calculations (`CHORD_SHAPES`) |
| `chord-inspection` | Tone detail inspection panel (`ToneInfoPanel`) |
| `chord-intervals` | Interval pattern visualisation |
| `chord-morphing` | Smooth polygon morphing hooks |
| `chromatic-circle` | Main 12-note SVG circle visualisation |
| `color-language` | Quality-based color system (chord colors, harmony opacity) |
| `current-chord` | Current-chord info panel |
| `legend` | Visual legend (chord quality colour bands with polygon glyphs, note opacity levels) |
| `midi-export` | MIDI file export (BPM, beats/chord) |
| `progression-sidebar` | Chord progression sidebar (max 8 chords, session-only) |
| `scale` | Scale generation & display (8 modes) |
| `voice-leading` | Voice-leading path utilities |

## Domain Knowledge

- **Chord types** (`ChordType`): `"major" | "minor" | "dim" | "aug" | "maj7" | "min7" | "dom7" | "halfdim7" | "quartal"`.
- **Pitch classes**: Integers 0–11 (C=0 … B=11). The chromatic circle has 12 nodes at 30° intervals.
- **Scale modes** (8 supported): Major, Natural Minor, Harmonic Minor, Melodic Minor, Dorian, Phrygian, Lydian, Mixolydian.
- **Chord shapes**: Triads → triangle, seventh chords → quadrilateral (see `CHORD_SHAPES` in `chord-geometry/utils/`).
- **Cursor modes**: `"info"` (click a note to inspect it) | `"select"` (click notes to build a custom selection); keyboard shortcuts `I` / `S`.
- **Backend enums** use `ChordQuality` (e.g., `Major`, `Minor`, `Diminished`, `Dominant7`) and `Note` (e.g., `C`, `CSharp`)—distinct from the frontend `ChordType` strings.
