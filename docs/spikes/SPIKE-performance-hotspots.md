# SPIKE — Performance Hotspots Deep Dive

**SPIKE date:** 2026-03-30
**Author:** Copilot (ISSUE-E9-05)
**Status:** Complete — findings documented; follow-on work tracked in `performance-audit.md`

---

## Objective

Investigate the two performance areas flagged as requiring deeper analysis in the main
performance audit:

1. Harmonic graph construction cost in `useBridgeSuggestions`
2. React re-render cascade during progression playback

---

## 1. Harmonic Graph Construction — `useBridgeSuggestions`

### Finding

`useBridgeSuggestions` calls `findShortestVoiceLeading` (Dijkstra on the T-canonical chord
graph) once per `BridgeGapRow` per render. Inside that function, `buildChordGraph()` is
called on every invocation, constructing the 19-node, ~54-edge adjacency list from scratch.

**Code path:**

```
BridgeGapRow (rendered n−1 times for n chords)
  └─ useBridgeSuggestions(chords, index, scale)
       └─ findShortestVoiceLeading(start, end)  [per candidate chord quality]
            └─ buildChordGraph()               ← rebuilds graph each call
```

**Measured complexity:**

- `buildChordGraph()` iterates over ~19 chord nodes × ~3 edges each = ~57 operations.
- Each `BridgeGapRow` calls `findShortestVoiceLeading` up to 9 times (once per `ChordType`
  candidate), so `buildChordGraph` is called up to 9 × (n−1) times per render.
- With 8 chords: 9 × 7 = 63 `buildChordGraph` calls per `ProgressionSidebar` render.

**Conclusion:** With `BridgeGapRow` now wrapped in `memo` (PERF-02), these calls are
suppressed for tiles whose props have not changed. At the current 8-chord maximum the total
cost remains low. However, hoisting the graph to module scope would eliminate the allocation
entirely.

### Recommendation

Hoist `buildChordGraph()` to module scope in `findShortestVoiceLeading.ts` so the graph is
constructed once at import time and shared across all calls:

```typescript
// Construct the graph once at module load — it is static and immutable.
const CHORD_GRAPH = buildChordGraph();

export function findShortestVoiceLeading(
  startPCS: number[],
  endPCS: number[],
  graph = CHORD_GRAPH,   // callers can still inject a custom graph for testing
  maxWeight?: number,
): PathResult | null { ... }
```

**Effort:** Low (< 30 min). **Impact:** Eliminates 63 redundant heap allocations per render.

---

## 2. React Re-render Cascade During Playback

### Finding

During progression playback, `App.tsx` (or equivalent root) updates `playingIndex` on every
chord step. This propagates down the tree and, prior to the PERF-01 / PERF-02 / PERF-03
fixes in ISSUE-E9-05, caused the following unnecessary re-renders per step:

| Component | Re-renders before fix | Re-renders after fix |
|---|---|---|
| `ChordTile` (all 8) | 8 | 2 (only changed tiles) |
| `BridgeGapRow` (all 7) | 7 | 0–1 |
| `PairMetricBadge` (all 7) | 7 | 0 |
| `CurrentChordPanel` | 1 (unnecessary if chord unchanged) | 0 |

**Total eliminated per playback step:** ~20 React reconciliations.

### Remaining Hot Path

After the fixes, the remaining re-render path during playback is:

1. `App` / parent updates `playingIndex`.
2. `ProgressionSidebar` re-renders (not memoized — receives new `playingIndex` prop).
3. `ChordTile` at `prevPlayingIndex` re-renders (its `isPlaying` changed from `true` → `false`).
4. `ChordTile` at `newPlayingIndex` re-renders (its `isPlaying` changed from `false` → `true`).

This is the minimum necessary work and is correct.

### Optional Future Optimisation

If `ProgressionSidebar` is wrapped in `memo`, it will avoid re-rendering entirely when only
unrelated parent state changes (e.g. theme toggles). However, during playback its
`playingIndex` prop legitimately changes, so `memo` alone cannot eliminate the two
`ChordTile` re-renders. A fully optimised solution would require lifting `playingIndex`
tracking into a context that only the relevant `ChordTile` subscribes to (see PERF-07 in
the audit for a note on context splitting).

---

## 3. Conclusion

The main performance audit (ISSUE-E9-05) addressed the highest-impact issues. The two
hotspots explored in this SPIKE are both low-risk and low-effort to address as follow-on
work:

| Action | File | Effort | Impact |
|---|---|---|---|
| Hoist `buildChordGraph()` to module scope | `findShortestVoiceLeading.ts` | Low | Eliminates redundant allocations |
| Wrap `ProgressionSidebar` in `memo` | `ProgressionSidebar.tsx` | Low | Prevents renders from unrelated parent state changes |
