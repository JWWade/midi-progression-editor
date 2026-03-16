# MIDI Progression Editor — Frontend

This is the React/TypeScript frontend for the **MIDI Progression Editor**, a parametric MIDI sequencer for exploring and editing chord progressions.

## Tech Stack

- **React 19** — UI framework
- **TypeScript 5.9** — Type-safe JavaScript (strict mode)
- **Vite 7** — Development server and build tooling
- **openapi-typescript** — Auto-generated type-safe API client from the backend's OpenAPI spec
- **Vitest** — Unit test runner
- **ESLint 9** — Linting (zero-warnings policy)

## Getting Started

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

App is available at `http://localhost:5173`. The backend must be running at `http://localhost:5110` for API features to work.

### Environment variables

Create `client/.env.local` to override the default API base URL:

```bash
VITE_API_BASE_URL=http://localhost:5110
```

See `.env.example` for all available variables.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint (zero-warnings, strict mode) |
| `npm test` | Run Vitest test suite |
| `npm run generate:api` | Regenerate TypeScript API client from the running backend's OpenAPI spec |

## Project Structure

```
src/
├── api/                    # API integration layer
│   ├── client/             # Pre-configured openapi-fetch client instance
│   ├── generated/          # Auto-generated types + client functions (DO NOT EDIT)
│   └── index.ts            # Public exports
│
├── app/                    # Application bootstrap
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   ├── components/         # AppHeader (toggles, scale selector, cursor modes, theme)
│   ├── providers/          # ThemeProvider, EnharmonicProvider and their hooks/contexts
│   ├── routes/             # Client-side routing (placeholder)
│   └── store/              # Global state management (placeholder)
│
└── features/               # Feature modules (feature-based architecture)
    ├── audio/              # In-browser chord playback (Web Audio API)
    ├── chord/              # Core chord data, types, and utilities
    ├── chord-animation/    # Animated chord shape transitions (easeInOutQuad, 350 ms)
    ├── chord-geometry/     # Polygon vertex and centroid calculations
    ├── chord-inspection/   # Tone detail panel (ToneInfoPanel)
    ├── chord-intervals/    # Interval pattern visualisation (IntervalLabel)
    ├── chord-morphing/     # Smooth polygon morphing hooks
    ├── chromatic-circle/   # Main 12-note SVG circle visualisation
    ├── color-language/     # Quality-based color grammar and opacity system
    ├── current-chord/      # Current-chord info panel (CurrentChordPanel)
    ├── midi-export/        # MIDI file export (configurable BPM, beats/chord)
    ├── progression-sidebar/# Chord progression sidebar (up to 8 chords, session-only)
    ├── scale/              # Scale generation and diatonic highlighting (8 modes)
    └── voice-leading/      # Voice-leading path utilities
```

Each feature module follows the same internal structure:

```
feature/
├── api/         # Feature-specific API calls (optional)
├── components/  # Feature React components
├── constants/   # Feature-level constants
├── hooks/       # Feature-specific custom hooks
├── types/       # Feature TypeScript types
└── utils/       # Feature helper functions
```

## API Client

The API client is auto-generated from the backend's OpenAPI specification. **Never edit `src/api/generated/index.ts` manually.**

To regenerate after changing backend endpoints or DTOs:

1. Start the backend: `cd ../server/ParametricMusic.Api && dotnet run`
2. Run: `npm run generate:api`
3. Commit both backend changes and the regenerated `src/api/generated/index.ts`

Usage:
```typescript
import { client } from '@/api/client';

const chord = await client.post('/Chord/from-root', {
  query: { note: 'C' },
  body: { quality: 'Major' }
});

const scale = await client.post('/Scale/from-root', {
  query: { note: 'C' },
  body: { scaleType: 'Major' }
});
```

## Testing

```bash
npm test
```

Runs Vitest in single-pass mode. Current test coverage:
- `midi-export/utils/midiBuilder.test.ts` — MIDI binary construction

## Linting

```bash
npm run lint
```

ESLint is configured with zero warnings allowed. All TypeScript files under `src/` must pass.

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. The build runs TypeScript type-checking (`tsc -b`) before the Vite bundle step.
