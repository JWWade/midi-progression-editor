# MIDI Progression Editor — Frontend

This is the React/TypeScript frontend for the **MIDI Progression Editor**, a parametric MIDI sequencer for exploring and editing chord progressions.

## Tech Stack

- **React 19** — UI framework
- **TypeScript 6.0** — Type-safe JavaScript (strict mode)
- **Vite 8** — Development server and build tooling
- **openapi-typescript** — Auto-generated type-safe API client from the backend's OpenAPI spec
- **Vitest** — Unit test runner
- **ESLint 10** — Linting (zero-warnings policy)

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
    ├── audio/              # In-browser chord playback (Web Audio API, chord and arpeggio mode)
    ├── chord/              # Core chord data, types, and utilities
    ├── chord-animation/    # Animated chord shape transitions (easeInOutCubic, 260 ms)
    ├── chord-geometry/     # Polygon vertex and centroid calculations
    ├── chord-inspection/   # Tone detail panel (ToneInfoPanel)
    ├── chord-intervals/    # Interval pattern visualisation (IntervalLabel)
    ├── chord-morphing/     # Smooth polygon morphing hooks
    ├── chromatic-circle/   # Main 12-note SVG circle visualisation
    ├── color-language/     # Quality-based color grammar and opacity system
    ├── current-chord/      # Current-chord info panel (CurrentChordPanel)
    ├── harmonic-graph/     # Harmonic relationship graph; shortest voice-leading path (Dijkstra)
    ├── ii-v-suggestions/   # Harmonic bridge suggestions (ii–V, tritone substitutions, backchains)
    ├── legend/             # Visual legend (chord quality colors, note opacity levels)
    ├── midi-export/        # MIDI file export (configurable BPM, beats/chord)
    ├── negative-harmony/   # Negative harmony pitch-class reflection transform
    ├── progression-sidebar/# Chord progression sidebar (up to 8 chords, session-only)
    ├── scale/              # Scale generation and diatonic highlighting (8 modes)
    ├── tutorial/           # Interactive first-use tutorial (tooltips & modals, localStorage persistence)
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

Runs Vitest in single-pass mode across the frontend test suite (`src/**/*.test.ts` and `src/**/*.test.tsx`).

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

## Geometry/Identity Hardening Checklist

When changing chord rendering or custom-chord labeling, use this checklist before opening a PR:

1. Keep pitch-class normalization and dedupe logic in `src/features/chord/utils/pitchClass.ts`.
2. Keep polygon ordering logic in `src/features/chromatic-circle/utils/geometry.ts` (`orderPolygonNoteIndices`).
3. Keep chord identity scoring/policy in `src/features/chord/utils/chordIdentity.ts` and `src/features/current-chord/utils/chordName.ts`.
4. Ensure both circle and panel rendering paths consume canonical ordering utilities (no inline note ordering in components).
5. Add or update parity tests for geometry and identity when behavior changes.

## Guardrail Recommendations

- Prefer utility imports over inline modulo formulas for pitch-class wrapping.
- During review, flag direct usage of ad hoc normalization patterns like `((x % 12) + 12) % 12` in feature components.
- Consider adding a CI grep guard that fails when component files introduce inline pitch-class normalization formulas.
