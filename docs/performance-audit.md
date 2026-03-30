# Performance Audit — Parametric MIDI Sequencer

**Audit date:** 2026-03-30
**Auditor:** Copilot (automated audit via ISSUE-E9-05)
**Scope:** Full codebase — `client/` (React/TypeScript) and `server/` (ASP.NET Core C#)

---

## 1. Executive Summary

The Parametric MIDI Sequencer is an early-stage prototype with a strong foundation for future
performance. Most critical paths — chord audio playback, MIDI export, voice-leading, and the
chromatic-circle SVG — are efficiently implemented. No freezes, hard memory leaks, or runaway
listeners were detected during review.

Four medium-priority issues were identified and addressed in this epic. Several lower-priority
opportunities are catalogued below as remediation candidates for future sprints.

| Severity | Count | Status |
|---|---|---|
| 🔴 Critical | 0 | — |
| 🟡 Medium | 4 | ✅ Resolved in ISSUE-E9-05 |
| 🟢 Low | 5 | Open — tracked below |

---

## 2. Profiling Methodology

Due to the prototype nature of the project (no live server, no telemetry), profiling was
conducted via static code analysis, React component tree inspection, and algorithm complexity
review. The following techniques were applied:

- **React component audit** — all `*.tsx` files reviewed for memoization, hook dependency
  arrays, and event-listener cleanup.
- **Algorithm complexity review** — data-structure traversal and computation cost estimated
  from source code.
- **Audio graph inspection** — `audioUtils.ts` reviewed for node lifecycle and cleanup.
- **MIDI builder inspection** — `midiBuilder.ts` reviewed for memory allocation patterns.
- **Backend service review** — all ASP.NET Core services reviewed for algorithmic cost.

---

## 3. Frontend — React Rendering

### 3.1 Identified Issues

#### PERF-01 — `ChordTile` re-rendered on every parent update (🟡 Medium — **Resolved**)

**Location:** `client/src/features/progression-sidebar/components/ChordTile.tsx`

**Root cause:** `ChordTile` used `forwardRef` without `memo`. During progression playback,
`playingIndex` changes on every chord step, causing `ProgressionSidebar` to re-render, which
in turn caused **all** chord tiles to re-render — even those whose visual output had not
changed.

**Impact:** Up to 8 unnecessary React reconciliations per playback step. Each tile
re-executes `getChordPitchClasses`, `getChordComplexity`, `getChordColor`, and
`getChordName` — all pure but non-trivial computations.

**Fix:** Wrapped the `forwardRef` inner function with `memo` and a custom comparator that
only compares the data props that affect visual output (`chord`, `index`, `isFirst`,
`isLast`, `isNew`, `isPlaying`, `isGhost`). Inline callback wrappers created by the parent's
`Array.map` loop produce new function references on every render; excluding them from the
comparator is safe because their behaviour is fully determined by stable outer callbacks
and the per-tile index value.

```tsx
export const ChordTile = memo(
  forwardRef<HTMLLIElement, ChordTileProps>(function ChordTile(...) { ... }),
  (prev, next) =>
    prev.chord === next.chord &&
    prev.index === next.index &&
    prev.isFirst === next.isFirst &&
    prev.isLast === next.isLast &&
    prev.isNew === next.isNew &&
    prev.isPlaying === next.isPlaying &&
    prev.isGhost === next.isGhost,
);
```

---

#### PERF-02 — `BridgeGapRow` not memoized (🟡 Medium — **Resolved**)

**Location:** `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`

**Root cause:** `BridgeGapRow` was defined at module scope (preventing function recreation)
but not wrapped in `memo`. It always re-rendered when `ProgressionSidebar` re-rendered,
triggering `useBridgeSuggestions` to re-run its Dijkstra graph walk via the harmonic-graph
feature.

**Fix:** Wrapped with `React.memo`.

---

#### PERF-03 — `PairMetricBadge` re-renders on unrelated parent changes (🟡 Medium — **Resolved**)

**Location:** `client/src/features/progression-sidebar/components/PairMetricBadge.tsx`

**Root cause:** Pure presentational component with no internal state re-rendered on every
`ProgressionSidebar` render. Rendered `n − 1` times for `n` chords; with the maximum
8-chord progression, up to 7 unnecessary re-renders per playback step.

**Fix:** Wrapped with `React.memo`.

---

#### PERF-04 — `CurrentChordPanel` not memoized (🟡 Medium — **Resolved**)

**Location:** `client/src/features/current-chord/components/CurrentChordPanel.tsx`

**Root cause:** `CurrentChordPanel` re-renders on every parent update regardless of whether
its chord, theme, or audio state has changed. It performs several non-trivial inline
computations: `getChordPitchClasses`, `getCircleColorForTheme`, `getChordComplexity`,
`getChordColor`, and `getAccessibleTextColor`.

**Fix:** Wrapped with `React.memo`.

---

### 3.2 Existing Good Patterns

The following memoization and stability patterns were already in place and require no changes:

| Component / Hook | Pattern | Notes |
|---|---|---|
| `NoteNode` | `React.memo` | Prevents SVG node re-renders during drag |
| `ChordVertex` | `React.memo` | Polygon vertex stability |
| `ChordPolygon` | `React.memo` | Polygon body stability |
| `CircleControls` | `React.memo` + `useCallback` | Control toolbar stability |
| `ChromaticCircle` | `notePointerDownHandlers` via `useMemo` | 12 stable per-note handlers |
| `ChromaticCircle` | `noteHandlerStateRef` + `useLayoutEffect` | Avoids stale closures without deps churn |
| `ChromaticCircle` | `fireToneInfoFromElement` via `useCallback` | Empty-dep stable handler |
| `useMidiExport` | `exportMidi` via `useCallback` | Stable export callback |
| `ProgressionSidebar` | `pairMetrics` via `useMemo` | Recomputes only when `chords` changes |
| `ChromaticCircle` | `circleColor` + `diatonicIndices` via `useMemo` | Theme-dependent colour memoized |

---

### 3.3 Event Listener and Subscription Cleanup

All reviewed `useEffect` hooks that register listeners include proper cleanup:

| Component | Listener | Cleanup |
|---|---|---|
| `ChromaticCircle` | `keydown` (window) | ✅ `removeEventListener` in return |
| `ChromaticCircle` | `matchMedia` change | ✅ `removeEventListener` in return |
| `ChordGrid` | `pointerdown` | ✅ `removeEventListener` in return |
| `ChordGrid` | `keydown` | ✅ `removeEventListener` in return |
| `BridgeSuggestionPopover` | `keydown` | ✅ `removeEventListener` in return |
| `BridgeSuggestionPopover` | `pointerdown` | ✅ `removeEventListener` in return |
| `CurrentChordPanel` | `setTimeout` (copy feedback) | ✅ `clearTimeout` in return |
| `ProgressionSidebar` | `setTimeout` (focus after add) | ✅ `clearTimeout` in return |
| `ChromaticCircle` | `requestAnimationFrame` (pulse) | ✅ `cancelAnimationFrame` in return |

No memory leaks from unregistered listeners were found.

---

### 3.4 Low-Priority Opportunities (Open)

#### PERF-05 — `ChromaticCircle` is not memoized (🟢 Low)

`ChromaticCircle` is a large component (~300 LOC) that is not wrapped in `memo`. Wrapping it
would only help when parent state changes don't affect any of its props. In practice, most
parent re-renders coincide with chord changes that do reach `ChromaticCircle` via
`externalChord`, so the incremental benefit is low. Recommended to address only if profiling
with React DevTools shows measurable frame-time improvement.

#### PERF-06 — `ChordVertex` `onActivate` handler creates new closure per render (🟢 Low)

In `ChromaticCircle.tsx`, the `onActivate` prop passed to each `ChordVertex` is an arrow
function defined inline inside the `.map()` loop. Despite `ChordVertex` being wrapped in
`memo`, these new function references cause re-renders on every `ChromaticCircle` render.
Mitigation: extract into a `useCallback`-wrapped handler that reads note data from the event,
similar to the `stableNoteClick` pattern used for `NoteNode`.

#### PERF-07 — No virtualization for large progression lists (🟢 Low)

`ProgressionSidebar` renders the full chord list without virtualization. At the current
maximum of 8 chords the cost is negligible, but if the maximum is raised (e.g. to 32+),
consider `react-window` or CSS `content-visibility: auto` for the chord list.

#### PERF-08 — `useBridgeSuggestions` repeats graph construction per call (🟢 Low)

`useBridgeSuggestions` calls `findShortestVoiceLeading` which internally calls
`buildChordGraph()` on every invocation. The 19-node triad graph is static and could be
constructed once at module load and shared across all calls, avoiding repeated heap
allocation and adjacency-list construction.

#### PERF-09 — `ProgressionAnalyzer` motion metrics computed per request (🟢 Low)

`ProgressionAnalyzer.cs` recalculates all motion metrics on every `POST /progression/analyze`
call. Because the progression is small (≤ 8 chords), the cost is negligible today. If
progression size grows, consider caching analysis results keyed by a hash of the request
body. This is also tracked as **TD-02** in `docs/tech-debt-audit.md`.

---

## 4. Audio Playback — `audioUtils.ts`

### 4.1 Assessment

`client/src/features/audio/utils/audioUtils.ts` implements a single-chord audio engine using
the Web Audio API.

**Strengths:**
- Singleton `AudioContext` is reused across calls; no repeated construction cost.
- `stopChord()` disconnects all active nodes before each new `playChord`, preventing node
  accumulation.
- Oscillator snapshot pattern (`oscillatorsForThisCall = activeOscillators.slice()`) prevents
  the deferred `setTimeout` cleanup from disconnecting nodes belonging to a subsequent chord.
- Compressor guard (`DynamicsCompressorNode`) prevents audio clipping regardless of chord
  size.
- Module-level refs for active nodes (`activeEnvelopeGain`, `activeMasterGain`,
  `activeCompressor`) are nulled correctly after cleanup, preventing dangling references.

**No issues found.** The implementation is correct and efficient for the current single-chord
playback use case.

### 4.2 Scalability Note

The current engine creates a new oscillator per note per chord per `playChord` call. For
large chords (e.g. stacked quartal or extended voicings with 5+ notes) the number of
oscillators grows linearly. Web Audio's node limit is browser-dependent; with a maximum of
~5 notes per chord this is not a concern in practice. If the note count grows significantly,
consider switching to a single AudioBuffer source per chord.

---

## 5. MIDI Export — `midiBuilder.ts`

### 5.1 Assessment

`client/src/features/midi-export/utils/midiBuilder.ts` converts a chord progression to a
MIDI `Uint8Array` using `@tonejs/midi`.

**Strengths:**
- Voice-leading (`closeVoiceChord` + `minimalMotionVoicing`) is applied in a single linear
  pass over the progression. Cost is O(n × k) where n = chord count and k = notes per chord
  (constant ≤ 5). No performance concerns at any realistic progression size.
- `URL.revokeObjectURL` is called in the `useMidiExport` hook's `exportMidi` callback to
  free the blob URL immediately after the download anchor fires.
- Input validation (BPM range, beats-per-chord, octave range) is done with early `throw`
  before any allocation, preventing wasted work.

**No issues found.**

---

## 6. Backend — ASP.NET Core Services

### 6.1 Assessment

All backend services (`ChordGenerator`, `ScaleGenerator`, `QuartalChordGenerator`,
`ProgressionAnalyzer`) are registered as **singletons** in `Program.cs`, meaning service
instances are created once and reused. This is correct and avoids repeated allocation.

| Service | Algorithm | Complexity | Assessment |
|---|---|---|---|
| `ChordGenerator` | Dictionary lookup | O(1) | ✅ No issues |
| `ScaleGenerator` | Array indexing | O(k) | ✅ No issues |
| `QuartalChordGenerator` | Array iteration | O(k) | ✅ No issues |
| `ProgressionAnalyzer` | Pairwise iteration | O(n × k²) | ✅ Adequate for n ≤ 8 |

### 6.2 `ProgressionAnalyzer` — Motion Metrics

`ProgressionAnalyzer.ComputeMotion()` iterates over all chord pairs and computes set-intersection
metrics. For `n` chords each with `k` notes, cost is O(n × k²). With the current maximum of
8 chords and 4 notes per chord, worst-case cost is 8 × 16 = 128 operations — negligible.

If `maxChords` is raised to 32+, consider caching the result keyed by a deterministic
progression hash. This is tracked as **TD-02**.

---

## 7. Summary of Changes in ISSUE-E9-05

| ID | File | Change | Status |
|---|---|---|---|
| PERF-01 | `ChordTile.tsx` | `memo(forwardRef(...))` with data-only custom comparator | ✅ Done |
| PERF-02 | `ProgressionSidebar.tsx` | `BridgeGapRow` wrapped with `memo` | ✅ Done |
| PERF-03 | `PairMetricBadge.tsx` | Wrapped with `memo` | ✅ Done |
| PERF-04 | `CurrentChordPanel.tsx` | Wrapped with `memo` | ✅ Done |

---

## 8. Verification Commands

```bash
# Frontend
cd client
npm run lint
npm run build
npm test

# Backend
cd server/ParametricMusic.Tests
dotnet test
```
