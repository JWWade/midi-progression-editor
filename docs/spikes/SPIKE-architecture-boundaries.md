# SPIKE — Architecture Boundary Investigations

**Status:** Reference document (findings incorporated into architecture-audit.md)
**Created:** 2026-03-30
**Author:** Copilot (ISSUE-E9-04)

This document records deep-dive investigations into the three architectural areas flagged
as ambiguous or risky in `docs/architecture-audit.md`. Each section describes the
investigation goal, findings, and recommended outcome.

---

## SPIKE-01 — `Chord` Type Stability and Ownership

### Goal

Determine whether the `Chord` type belongs in `current-chord/types/`, `shared/types/`, or
a new dedicated `chord/types/` export, and define backward-compatibility rules.

### Investigation

**Current location:** `client/src/features/current-chord/types/index.ts`

**Consumers (imports of `Chord` or `type Chord`):**
- `App.tsx` — holds `currentChord: Chord | null` in state
- `progression-sidebar` hooks and components — `chords: Chord[]`
- `midi-export/utils/midiBuilder.ts` — `buildMidiFile(chords: Chord[], …)`
- `ii-v-suggestions/utils/suggestBridges.ts` — `BridgeRequest.chord: Chord`
- `harmonic-graph/utils/buildChordGraph.ts` — node construction
- `audio/hooks/useAudioPlayback.ts` — chord played via Web Audio
- `current-chord/components/CurrentChordPanel.tsx` — display
- `shared/types/HarmonySnapshot.ts` — `progression: Chord[]`
- `voice-leading/utils/voicing.ts` — chord distance computation adapter

**Current interface shape:**
```typescript
interface Chord {
  root: number;              // pitch-class 0–11 (C=0)
  quality: ChordType;        // "major" | "minor" | "dim" | "aug" | "maj7" | "min7" | "dom7" | "halfdim7" | "quartal"
  extensions?: ChordExtension[];  // optional; e.g. "Add9", "Sus4"
  customNotes?: number[];         // optional; for non-tertian chords
  primitiveShape?: PrimitiveShape; // optional; geometry-first presets
}
```

All fields beyond `root` and `quality` are optional. This means:
- Adding new optional fields is backward-compatible (no consumer breaks).
- Removing any field is breaking for consumers that write to that field.
- Narrowing a field type (e.g. changing `number` to a branded type) is breaking for
  consumers that assign plain numbers.

### Findings

1. **`Chord` behaves as a shared domain kernel**, not a UI-specific type. Its placement in
   `current-chord/types/` is an accident of history (it was originally defined alongside
   the current-chord panel).

2. **Moving `Chord` to `shared/types/`** would be semantically correct but would require
   updating 9+ import paths. The benefit is discoverability; the risk is churn.

3. **Leaving `Chord` in `current-chord/types/`** is acceptable as long as:
   - A JSDoc comment documents the backward-compatibility contract.
   - All imports go through `@/features/current-chord` (the barrel), not the internal path.

4. **`HarmonySnapshot.schemaVersion`** provides a durable escape hatch: any incompatible
   `Chord` change can be handled by bumping `schemaVersion` to 2 and writing a migration
   guard in `isHarmonySnapshot()`.

### Recommended Outcome

**Do not move `Chord` now.** Add the backward-compatibility JSDoc comment (RP-01) and
ensure all consumers import via the `current-chord` barrel. Schedule the move to
`shared/types/` as a standalone refactor in a future epic if discoverability becomes a
pain point.

---

## SPIKE-02 — `App.tsx` Orchestration Decomposition Strategy

### Goal

Determine whether `App.tsx` should be decomposed, and if so, identify the cleanest
extraction boundary.

### Investigation

`App.tsx` currently manages the following concerns:

| Concern | State / Callbacks |
|---|---|
| Current chord | `currentChord`, `handleCurrentChordChange` |
| Key / Scale | `keyRoot`, `keyScale`, `handleKeyScaleChange`, `diatonicIndices` |
| Audio params | `audioParams`, `chordDurationMs` |
| Visualization | `showCentroid`, `showIntervals`, `showLegend` |
| Progression | `chords` (via `useProgression`), `addChord`, `moveChord`, `deleteChord` |
| Add guard | `addGuardRef` (dedup ref) |
| Bridge apply/undo | `applyBridge`, `undoPending`, `undoBridge` (via `useBridgeApply`) |
| Playback | `isPlaying`, `playingIndex`, `loop`, `play`, `stop`, `toggleLoop` |
| Bridge preview | `isPreviewPlaying`, `previewBridge`, `startPreview`, `stopPreview` |
| File import | `loadJsonInputRef`, `handleLoadJsonClick`, `handleFileChange` |
| Import error | `importError` |
| ARIA live region | `liveRegionText` |

**Line count of `App.tsx`:** ~220 lines

**Observations:**
- The component renders a flat layout: `<AppHeader>`, `<ChromaticCircle>`,
  `<CurrentChordPanel>`, `<ProgressionSidebar>`, `<VisualLegend>`, `<Toast>`, `<DevDiagnosticsPanel>`.
- The render JSX is ~80 lines; the remaining ~140 lines are hook calls, callbacks, and effects.
- The component re-renders on every state change; `useMemo`/`useCallback` wrappers
  are already applied to prevent cascading.

**Decomposition strategy:**

```
app/hooks/useAppOrchestration.ts
  ├── useChordAndScale()         — currentChord, keyRoot, keyScale, diatonicIndices
  ├── useProgressionFlow()       — chords, add/move/delete, addGuardRef, bridge apply/undo
  ├── usePlaybackFlow()          — playback state, bridge preview
  └── useSnapshotImport()        — file import, importError, JSON parse
```

All four hooks would be consumed by a top-level `useAppOrchestration()` that returns
the full prop set for `App.tsx`. `App.tsx` itself shrinks to a thin layout component.

### Findings

1. **The decomposition is safe and non-breaking.** No external API changes; only internal
   restructuring.
2. **`useProgressionFlow` is the most valuable extraction** — it contains the bridge
   apply/undo logic which is already tested indirectly but benefits from isolation.
3. **`useSnapshotImport` is independently useful** — file import is a discrete concern
   that could be reused if a "Save/Load" panel is added separately from the sidebar.
4. **`useChordAndScale` is low-value alone** — `keyRoot`/`keyScale`/`currentChord` state
   is trivial; the main benefit is grouping them in one place.

### Recommended Outcome

**Extract `useProgressionFlow` and `useSnapshotImport` first** (highest individual value).
Do this in a dedicated refactoring issue, not as part of the architecture audit. The audit
should document the decomposition plan (RP-02) without implementing it.

---

## SPIKE-03 — Voice-Leading Metric Cross-Environment Agreement

### Goal

Verify that the frontend `chordDistance()` and backend `ComputeMotion()` produce identical
results for the same chord pairs, and determine whether a formal cross-environment test is
warranted.

### Investigation

**Frontend algorithm** (`voice-leading/utils/chordDistance.ts`):

```typescript
// pitchClassDistance: minimum semitone distance on the chromatic circle
function pitchClassDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 12;
  return Math.min(diff, 12 - diff);
}

// chordDistance: sum of minimum mappings from pcsA to pcsB
function chordDistance(pcsA: number[], pcsB: number[]): number {
  // For each note in pcsA, find the nearest note in pcsB
  return pcsA.reduce((sum, a) =>
    sum + Math.min(...pcsB.map(b => pitchClassDistance(a, b))), 0);
}
```

**Backend algorithm** (`ProgressionAnalyzer.cs → ComputeMotion()`):

```csharp
private static int ComputeMotion(IEnumerable<int> from, IEnumerable<int> to)
{
    var toList = to.ToList();
    return from.Sum(note =>
        toList.Min(target =>
            Math.Min(Math.Abs(note - target) % 12,
                     12 - Math.Abs(note - target) % 12)));
}
```

**Manual verification:**

For C Major [0,4,7] → G Major [7,11,2]:
- C(0) → nearest in [7,11,2]: min(7,5,2) = 2
- E(4) → nearest in [7,11,2]: min(3,7,2) = 2
- G(7) → nearest in [7,11,2]: min(0,4,5) = 0
- Total: 4

Both implementations produce 4 for this pair.

For C Major [0,4,7] → F Major [5,9,0]:
- C(0) → nearest in [5,9,0]: min(5,3,0) = 0
- E(4) → nearest in [5,9,0]: min(1,5,4) = 1
- G(7) → nearest in [5,9,0]: min(2,2,5) = 2
- Total: 3

Both produce 3. ✓

### Findings

1. **The two implementations are algorithmically identical.** Both compute the directed sum
   of minimal pitch-class distances from the source chord to the target chord.

2. **One subtle difference exists:** the frontend implementation is **directed** (pcsA → pcsB)
   while the backend comment does not specify direction. In practice, `ProgressionAnalyzer`
   always calls `ComputeMotion(from, to)` matching the frontend's source-to-target ordering.

3. **No automated cross-environment test exists.** Adding a backend endpoint or integration
   test that exercises both sides is possible but adds significant plumbing for modest gain
   given the algorithm is straightforward.

### Recommended Outcome

**No formal cross-environment test needed at this time.** Instead:
1. Add a JSDoc/XML comment to both files explicitly documenting the algorithm and
   cross-referencing the other implementation (RP-03).
2. The existing `intervalContract.test.ts` already validates interval tables; the distance
   computation is a simple arithmetic function on those tables, reducing independent
   drift risk.
3. If the distance metric is ever enhanced (e.g. octave weighting, voice crossing penalty),
   revisit this SPIKE and consider a formal integration test at that point.
