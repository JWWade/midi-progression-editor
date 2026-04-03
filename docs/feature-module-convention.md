# Feature Module Convention

This document defines the canonical folder structure for every feature module under `client/src/features/`.

## Allowed Sub-Folders

A feature module **should only include sub-folders it actually uses**. The complete list of allowed sub-folders and their purpose is:

| Sub-folder | Purpose |
|---|---|
| `components/` | React components specific to this feature |
| `hooks/` | React hooks specific to this feature |
| `utils/` | Pure functions and helpers |
| `types/` | TypeScript type and interface definitions |
| `constants/` | Named constants and enumerations |
| `api/` | API call functions (wrapping the generated client) |
| `data/` | Static data fixtures or lookup tables |

Do **not** create a sub-folder speculatively. Only add a sub-folder when you have at least one real file to place in it.

## Required: Top-Level `index.ts`

Every feature module **must** have a top-level `index.ts` that explicitly re-exports its public surface:

```
features/
  my-feature/
    components/
      MyComponent.tsx
    hooks/
      useMyHook.ts
    utils/
      helpers.ts
    index.ts          ← required
```

The `index.ts` must use named `export` (or `export type`) statements — no wildcard `export *`. This makes the public API of each feature explicit and discoverable.

**Example:**

```ts
// features/my-feature/index.ts
export { MyComponent } from './components/MyComponent';
export { useMyHook } from './hooks/useMyHook';
export { helperFn } from './utils/helpers';
export type { MyType } from './types';
```

## Feature Overview

| Module | Purpose |
|---|---|
| `audio` | In-browser chord audio playback |
| `chord` | Core chord data, types (`ChordType`), and utilities |
| `chord-animation` | Animated polygon morphing hook (`useChordMorphing`) |
| `chord-geometry` | Polygon vertex calculations (`CHORD_SHAPES`) |
| `chord-inspection` | Tone detail inspection panel (`ToneInfoPanel`) |
| `chord-intervals` | Interval pattern visualisation |
| `chord-morphing` | Low-level smooth polygon morphing utilities |
| `chromatic-circle` | Main 12-note SVG circle visualisation |
| `color-language` | Quality-based color system (chord colors, harmony opacity) |
| `current-chord` | Current-chord info panel |
| `harmonic-graph` | Harmonic relationship graph; shortest voice-leading path via Dijkstra on 19-node T-canonical chord graph |
| `ii-v-suggestions` | Harmonic bridge suggestions (ii–V, tritone substitutions, backchains) |
| `legend` | Visual legend component |
| `midi-export` | MIDI file export (BPM, beats/chord) |
| `negative-harmony` | Negative harmony pitch-class reflection transform (`reflectPitchClass`, `applyNegativeHarmony`) |
| `progression-sidebar` | Chord progression sidebar (max 8 chords, session-only) |
| `scale` | Scale generation and display |
| `tutorial` | Interactive first-use tutorial — tooltip and modal UI, trigger manager, localStorage persistence |
| `voice-leading` | Voice-leading path utilities |

### `chord-animation` vs `chord-morphing`

These two modules have related but distinct responsibilities:

- **`chord-animation`** is a *high-level consumer*: it owns the `useChordMorphing` hook, which drives an animation loop (easeInOutCubic, 260 ms) that automatically transitions the displayed polygon whenever the active chord changes.
- **`chord-morphing`** is a *low-level library*: it owns the pure `morphPoints` and `interpolateColor` functions used by the animation loop, as well as the lower-level `useChordMorph` hook that exposes the raw interpolated state without opinionated timing.

## Linting and Building

All modules must pass:

```bash
cd client
npm run lint   # zero warnings allowed
npm run build  # no TypeScript errors
```

## Hardening Ownership Map (E11-01)

For geometry and custom-chord identity, ownership is fixed to avoid cross-feature drift.

### Canonical Module Ownership

| Responsibility | Canonical Module |
|---|---|
| Low-level pitch-class normalization and deduplication | `features/chord/utils/` |
| Polygon ordering and geometry derivation for rendering | `features/chromatic-circle/utils/` |
| Custom-chord identity scoring and policy | `features/current-chord/utils/` |
| Display naming and formatting after identity resolution | `features/current-chord/utils/` |

### Contract Guardrails for Reviews

Reviewers should reject changes that:

- Reimplement pitch-class normalization or ordering inside component files.
- Introduce separate identity heuristics in non-canonical modules.
- Apply display formatting before identity policy resolution.

### Geometry Derivation Contract

Every polygon render path must use inputs that are:

1. Normalized to pitch classes in 0..11.
2. Deduplicated.
3. Circularly ordered.
4. Root-rotated when root context is known.

### Identity Resolution Contract

Custom note-set resolution must follow:

1. Exact-match path.
2. Deterministic non-exact fallback path.
3. Display formatting path.

### Non-Goals

- No new chord taxonomy in this hardening pass.
- No backend API model expansion in this hardening pass.
- No visual redesign scoped under geometry/identity hardening issues.
