# Copilot Instructions

## Project Overview

This is a **Parametric MIDI Sequencer** — a standalone React/TypeScript application for editing MIDI chord progressions. Music theory, audio, and MIDI export logic run in the browser.

## Repository Structure

```
midi-progression-editor/
├── client/                        # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── app/                   # Root component, AppHeader, context providers
│   │   ├── features/              # Feature modules (see Feature Modules section)
│   │   └── shared/                # Shared components, hooks, types, utils
│   ├── public/
│   └── package.json
```

## Tech Stack

- **Frontend**: React 19, TypeScript 5.9 (strict), Vite 8, ESLint 10
- **Testing**: Vitest

## Local Development

### Frontend

```bash
cd client
npm install
npm run dev
```

- App: `http://localhost:5173`

## Build

### Frontend

```bash
cd client
npm run build
```

## Test

### Frontend

```bash
cd client
npm test
```

Runs Vitest in single-pass mode. Currently covers MIDI file construction utilities.

## Lint

### Frontend

```bash
cd client
npm run lint
```

ESLint is configured with zero warnings allowed (`--max-warnings=0`). All TypeScript files under `client/src/` must pass the lint check.

## Coding Conventions

- **TypeScript**: Strict mode is enabled. Use explicit types and avoid `any`.
- **React**: Use functional components with hooks. No class components.
- **Path alias**: `@` maps to `client/src/`. Prefer `@/features/...` over relative imports across feature boundaries.
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
