# SPIKE: Synchronized Chromatic Circle Animation During Progression Playback

**Date:** 2026-03-15  
**Status:** Complete  
**Author:** Copilot (investigation)

---

## 1. Executive Summary

**Verdict: Feasible with minimal refactoring of the current architecture.**

The foundational building blocks — a playback sequencer hook (`useProgressionPlayback`), a chord-morphing animation system (`useChordMorphing`), and per-note/per-chord state rendering in `ChromaticCircle` — are already in place. The gap is purely one of **data flow**: `playingIndex` lives inside `ProgressionSidebar` but the `ChromaticCircle` does not yet observe it. Bridging this requires lifting approximately two pieces of state to `App.tsx` and adding one new prop path. No new audio primitives, no new animation engine, and no new feature modules are needed.

---

## 2. Codebase Baseline (as investigated)

### 2.1 Playback

| File | Role |
|------|------|
| `client/src/features/audio/utils/audioUtils.ts` | Web Audio API synthesis (oscillator + ADSR envelope). Scheduling uses `ctx.currentTime`; promise resolution uses `setTimeout(resolve, duration)`. |
| `client/src/features/audio/hooks/useAudioPlayback.ts` | Single-chord playback hook: `{ isPlaying, play(notes, opts), stop }`. |
| `client/src/features/audio/hooks/useProgressionPlayback.ts` | Progression sequencer: iterates `chords[]` with an `async for` loop, `await`s each `playChord`, exposes `{ isPlaying, playingIndex, play, stop }`. `playingIndex` is the index of the chord currently sounding; `null` when stopped. |

### 2.2 Chromatic Circle

| File | Role |
|------|------|
| `client/src/features/chromatic-circle/components/ChromaticCircle.tsx` | SVG rendering. Derives chord notes from internal click/drag state (`useChordState`). Calls `useChordMorphing` to animate polygon transitions. |
| `client/src/features/chromatic-circle/hooks/useChordState.ts` | Manages selected chord name, custom chords, drag interactions. Fires `onCurrentChordChange` callback. |
| `client/src/features/chord-animation/hooks/useChordMorphing.ts` | `requestAnimationFrame`-driven interpolation hook. Accepts `currentPoints: Point[]`; detects changes, animates from previous to new position over 260 ms using `easeInOutCubic`. Already used in `ChromaticCircle`. |

### 2.3 State & Layout

| File | Role |
|------|------|
| `client/src/app/App.tsx` | Root component. Owns `currentChord` (the user-selected chord) and passes it down. Passes `chords[]` to `ProgressionSidebar`. |
| `client/src/features/progression-sidebar/hooks/useProgression.ts` | Manages `entries: ProgressionEntry[]`, exposes `{ chords, addChord, moveChord, deleteChord }`. |
| `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` | Owns `useProgressionPlayback`. Uses `playingIndex` only for per-tile highlighting (`isPlaying` prop on `ChordTile`). |

---

## 3. Current Data Flow (simplified)

```
App
 ├── ChromaticCircle   ←── user click/drag ──→ [internal useChordState]
 │     └─ useChordMorphing (animates polygon)
 │     └─ onCurrentChordChange ──→ App.currentChord
 │
 ├── CurrentChordPanel ←── App.currentChord
 │
 └── ProgressionSidebar ←── App.chords[]
       └─ useProgressionPlayback(chords)
             ├─ isPlaying, playingIndex   (used only for ChordTile highlighting)
             ├─ play()
             └─ stop()
```

**Key gap:** `playingIndex` / the currently-playing chord are not propagated to `ChromaticCircle`.

---

## 4. Proposed Architecture for Synchronized Animation

### 4.1 Data Flow with Synchronized Circle

```
App
 ├── useProgressionPlayback(chords)  ← lifted here
 │     ├─ isPlaying
 │     ├─ playingIndex
 │     ├─ play()
 │     └─ stop()
 │
 ├── playingChord = chords[playingIndex] ?? null   ← derived in App
 │
 ├── ChromaticCircle
 │     └── externalChord?: Chord   ← new prop
 │           (overrides internal state during playback)
 │
 ├── CurrentChordPanel
 │
 └── ProgressionSidebar
       ├── isPlaying, playingIndex, play, stop  ← passed as props
       └── ChordTile isPlaying={playingIndex === i}
```

The single architectural change is:

1. **Lift `useProgressionPlayback`** from `ProgressionSidebar` to `App.tsx`.
2. **Derive `playingChord`** in `App.tsx`: `playingIndex !== null ? (chords[playingIndex] ?? null) : null`.
3. **Add `externalChord` prop to `ChromaticCircle`**: when non-null, bypass `useChordState` and render the externally-supplied chord instead.
4. **Pass `{ isPlaying, playingIndex, play, stop }` as props to `ProgressionSidebar`** so tile highlighting continues to work.

No pub/sub, no event emitter, and no new context provider are needed for the baseline implementation.

### 4.2 How `ChromaticCircle` Uses `externalChord`

Inside `ChromaticCircle.tsx`, the effective chord is currently sourced entirely from `useChordState`. With an `externalChord` prop:

```tsx
// Existing internal chord from user interaction
const {
  effectiveRoot: internalRoot,
  effectiveQuality: internalQuality,
  ...
} = useChordState({ ... });

// Prefer external chord during playback
const rootIndex = externalChord?.root ?? internalRoot;
const chordType  = externalChord?.quality ?? internalQuality;
```

The `fromPoints` calculation and `useChordMorphing` call are already downstream of `rootIndex`/`chordType`, so every time `externalChord` changes (i.e., each time `playingIndex` advances), the existing morphing hook detects the new polygon points, starts a new interpolation, and renders the transition via `requestAnimationFrame`. **No new animation code is required.**

When `externalChord` returns to `null` (playback stops), the circle naturally reverts to the user-selected chord — again triggering a single morph transition via the existing hook.

---

## 5. Event Model

Rather than a pub/sub pattern, the recommended model is **React prop-driven callback**. The necessary "events" are already expressed as state changes:

| Event | Mechanism |
|-------|-----------|
| Playback started | `isPlaying` becomes `true`; `playingIndex` becomes `0` |
| Chord changed | `playingIndex` increments (state update in `useProgressionPlayback`) |
| Playback stopped | `isPlaying` becomes `false`; `playingIndex` becomes `null` |
| Circle update triggered | `externalChord` prop derived in `App` re-renders `ChromaticCircle` |
| Morph animation starts | `useChordMorphing` detects `currentPoints` changed; starts `rAF` loop |

If a pub/sub pattern were added in the future (e.g., for a standalone playback toolbar or plugin architecture), a React Context for playback state would be the appropriate escalation path — not a global event emitter.

---

## 6. Animation Strategy

### 6.1 Reuse Existing Morphing

`useChordMorphing` already handles everything needed for chord-to-chord transitions:

- Detects polygon point changes on each render.
- Runs a `requestAnimationFrame` loop interpolating between old and new points.
- Uses `easeInOutCubic` over 260 ms by default (configurable via `durationMs` argument).
- Handles rapid chord changes via Option A (cancel previous animation, start fresh from last position).

**No new animation logic is needed for the basic synchronized playback case.**

### 6.2 Optional Enhancements (follow-up scope)

| Enhancement | Approach |
|-------------|----------|
| **Pulse/glow on chord entry** | CSS keyframe animation on the polygon `<polygon>` element triggered by `playingIndex` changing. Add a CSS class for one animation cycle (300–500 ms). |
| **Sustained highlight during chord duration** | `polygonOpacity` (already a computed value) could be elevated while `isPlaying && externalChord !== null`. |
| **Beat-subdivided animation** | Out of scope without a beat-clock; would require a `BPM` input and a scheduler. |
| **Node ring highlights** | The `getNoteStyle()` function already uses chord-tone status; it would automatically reflect the externally-supplied chord with no additional changes. |

### 6.3 Morph Duration During Playback

The current chord duration is hardcoded to 1200 ms. The default morph duration is 260 ms. This leaves ~940 ms of steady-state display before the next chord fires, which is comfortable. No timing adjustment is required for a 1200 ms chord duration.

If the chord duration is made configurable in the future, a recommended constraint is:

```
morphDuration ≤ chordDuration * 0.25
```

---

## 7. Timing Strategy

### 7.1 Current Implementation

`playChord` in `audioUtils.ts` uses the Web Audio API for audio scheduling (`ctx.currentTime`) but uses `setTimeout(resolve, duration)` for the promise that drives sequencer advancement. This means:

- Audio oscillators start and stop with sample-accurate Web Audio scheduling.
- The sequencer advances to the next chord after `setTimeout(duration)` fires.
- `setTimeout` is subject to JS event-loop jitter (typically 0–16 ms, worst-case up to ~50 ms under heavy load).

### 7.2 Impact on Visual Sync

For a visual circle animation (morphing duration ~260 ms, chord duration ~1200 ms), **`setTimeout`-based sequencing is sufficient**. The human eye would not notice a 16 ms visual sync offset in this use case.

If sub-frame accuracy were required (e.g., beat-synchronized LEDs or studio-grade DAW UI), `AudioContext.currentTime`-driven scheduling would be needed — but this is out of scope here.

### 7.3 Recommended Timing Approach

**Keep `setTimeout`-based sequencing.** It is already in place, requires no changes, and is precise enough for smooth visual transitions. If the product later requires a configurable BPM with sub-frame sync, the sequencer can be refactored to use `AudioContext.currentTime` as the source of truth.

---

## 8. Required Refactors

| # | Change | Scope | Effort |
|---|--------|-------|--------|
| R1 | Lift `useProgressionPlayback` call from `ProgressionSidebar` to `App.tsx` | `App.tsx`, `ProgressionSidebar.tsx` | XS |
| R2 | Pass `{ isPlaying, playingIndex, play, stop }` as props to `ProgressionSidebar` | `ProgressionSidebar.tsx` (props interface update) | XS |
| R3 | Add `externalChord?: Chord` prop to `ChromaticCircle` | `ChromaticCircle.tsx` | XS |
| R4 | Derive `playingChord` in `App.tsx` and pass to `ChromaticCircle` | `App.tsx` | XS |
| R5 | Inside `ChromaticCircle`, prefer `externalChord` over internal state for `rootIndex`/`chordType` | `ChromaticCircle.tsx` | S |

Total estimated refactor effort: **~2–3 hours** across 5 files.

---

## 9. Risks and Performance Considerations

### 9.1 Performance

| Concern | Assessment |
|---------|------------|
| 60 fps morphing | `useChordMorphing` already runs at 60 fps via `requestAnimationFrame`. Each frame computes a simple linear interpolation over 3–4 points. Cost is negligible. |
| SVG re-renders per frame | `ChromaticCircle` re-renders on each `rAF` tick during morphing. With React's reconciler and SVG (no DOM layout recalc), this is well within budget on modern hardware. |
| Long progressions | `useProgressionPlayback` iterates linearly; performance is O(n) in total duration (not per-frame). No performance concern up to `MAX_PROGRESSION_LENGTH = 8` (defined in `features/progression-sidebar/constants/progressionConfig.ts`). |
| Concurrent user interaction during playback | If the user clicks a note on the circle during playback, the internal `useChordState` selection will change, but `externalChord` still overrides the rendered chord. When playback stops, the circle will morph to the current user selection. This is the expected UX behaviour. |

### 9.2 Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `externalChord` override confuses the user (circle moves without their input) | Medium | Indicate playback is active (e.g., pulsing outline or disabled click-to-select during playback). |
| Morph animation starts too late relative to audio | Low | `setTimeout` jitter is typically ≤16 ms; imperceptible for 260 ms morph + 1200 ms chord. |
| Rapid stop/start causes stale `playingIndex` reference | Low | `cancelledRef` in `useProgressionPlayback` already handles this. |
| User adds/removes chords during playback | Medium | `useProgressionPlayback` receives the `chords` array at call time; mid-playback mutations are not reflected in the running loop. Add a guard or stop playback on mutation. |

### 9.3 Out-of-Scope Concerns

- **Undo/redo during playback** — not applicable to current feature set.
- **MIDI export timing** — independent of visual sync.
- **Mobile/touch performance** — SVG at 60 fps is well-supported on modern mobile browsers; no special handling needed.

---

## 10. Pseudocode

### 10.1 App.tsx with Lifted Playback State

```tsx
// App.tsx (simplified)
export default function App() {
  const { chords, addChord, moveChord, deleteChord } = useProgression();

  // Lifted from ProgressionSidebar
  const { isPlaying, playingIndex, play, stop } = useProgressionPlayback(chords);

  // Derive the currently-playing chord (null when stopped)
  const playingChord: Chord | null =
    playingIndex !== null ? (chords[playingIndex] ?? null) : null;

  return (
    <>
      <ChromaticCircle
        externalChord={playingChord}  // new prop — overrides internal selection
        onCurrentChordChange={...}
        ...
      />

      <ProgressionSidebar
        chords={chords}
        isPlaying={isPlaying}        // passed down as props
        playingIndex={playingIndex}
        onPlay={play}
        onStop={stop}
        ...
      />
    </>
  );
}
```

### 10.2 ChromaticCircle Prop Handling

```tsx
// ChromaticCircle.tsx (simplified addition)
interface ChromaticCircleProps {
  externalChord?: Chord | null;  // new optional prop
  // ...existing props
}

export function ChromaticCircle({ externalChord, ...rest }) {
  const {
    effectiveRoot: internalRoot,
    effectiveQuality: internalQuality,
    ...
  } = useChordState({ ... });

  // During playback, show the playing chord; otherwise show user selection
  const rootIndex = externalChord?.root ?? internalRoot;
  const chordType  = externalChord?.quality ?? internalQuality;

  // The rest of the component is UNCHANGED.
  // fromPoints is already computed from rootIndex + chordType.
  // useChordMorphing(fromPoints) already animates on every change.
  const fromPoints = calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, chordIndices);
  const { morphedPoints } = useChordMorphing(fromPoints);

  return ( /* existing SVG rendering — no changes */ );
}
```

### 10.3 Animation Transition (already in place)

```typescript
// useChordMorphing.ts — existing logic, shown for reference
export function useChordMorphing(currentPoints: Point[], durationMs = 260) {
  // On each render, detect if currentPoints key changed
  // If changed: cancel previous rAF, start new interpolation from last position
  // Each rAF tick: compute easeInOutCubic(elapsed / durationMs), lerp points
  // When progress = 1: stop rAF, hold final position
  return { morphedPoints, morphProgress };
}
// No changes needed.
```

---

## 11. Feasibility Recommendation

**✅ Feasible with the current architecture — minimal refactoring required.**

The required changes are:

1. Lift `useProgressionPlayback` to `App.tsx` (~5 lines moved).
2. Pass `playingChord` to `ChromaticCircle` as a new optional prop.
3. Add ~3 lines inside `ChromaticCircle` to prefer `externalChord` over internal state.
4. Update `ProgressionSidebar` to accept playback controls as props instead of owning them.

The existing `useChordMorphing` hook handles all animation automatically. No new audio scheduling, no new animation engine, and no global event system are needed.

---

## 12. Follow-up Implementation Issues

The following issues should be created for the next epic:

| # | Title | Depends On | Estimated Effort |
|---|-------|-----------|-----------------|
| FU-1 | Lift `useProgressionPlayback` to `App.tsx` and pass playback props to `ProgressionSidebar` | — | XS (1–2h) |
| FU-2 | Add `externalChord` prop to `ChromaticCircle` and wire to playing chord | FU-1 | S (2–3h) |
| FU-3 | Visual indicator on `ChromaticCircle` that playback is active (e.g., subtle pulsing ring or outline) | FU-2 | S (2–4h) |
| FU-4 | Guard against mid-playback progression mutations (stop playback on add/delete/reorder) | FU-1 | XS (1h) |
| FU-5 | Configurable chord duration (BPM or ms per chord) in `useProgressionPlayback` | FU-1 | S (2–4h) |
| FU-6 | Investigate `AudioContext.currentTime`-driven sequencing for sub-frame visual sync (if needed) | FU-1 | M (4–8h) |
| FU-7 | Pulse/glow effect on polygon entry during playback | FU-2 | S (2–4h) |
| FU-8 | Accessibility: announce current chord via ARIA live region during playback | FU-2 | S (2–4h) |

---

## Appendix A: Files Relevant to This Investigation

```
client/src/
├── app/
│   └── App.tsx                                          # root; owns progression + chord state
├── features/
│   ├── audio/
│   │   ├── hooks/
│   │   │   ├── useAudioPlayback.ts                      # single-chord playback
│   │   │   └── useProgressionPlayback.ts                # progression sequencer
│   │   └── utils/audioUtils.ts                         # Web Audio API synthesis
│   ├── chord-animation/
│   │   └── hooks/useChordMorphing.ts                    # rAF-based polygon morphing
│   ├── chromatic-circle/
│   │   ├── components/
│   │   │   ├── ChromaticCircle.tsx                      # SVG, uses useChordMorphing
│   │   │   └── ChordPolygon.tsx                         # polygon rendering
│   │   └── hooks/useChordState.ts                       # click/drag state
│   └── progression-sidebar/
│       ├── components/ProgressionSidebar.tsx            # currently owns useProgressionPlayback
│       └── hooks/useProgression.ts                      # chords[], add/move/delete
```
