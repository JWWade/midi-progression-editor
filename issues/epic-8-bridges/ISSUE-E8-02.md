# ISSUE-E8-02 — `useBridgeSuggestions` React Hook

**Epic:** Epic 8 — ii–V Bridge Suggestions  
**Priority:** High  
**Estimate:** 1 story point  
**Depends on:** ISSUE-E8-01

---

## Summary

Create a memoized React hook that calls `suggestBridges` for a specific adjacent chord pair in the progression sidebar. Handles edge cases (fewer than two chords, out-of-range index) and re-computes only when the relevant inputs change.

---

## File to Create

```
client/src/features/progression-sidebar/hooks/useBridgeSuggestions.ts
```

---

## Requirements

### Signature

```typescript
import type { BridgeSuggestion } from "@/features/ii-v-suggestions";
import type { Chord } from "@/features/current-chord/types";

export interface ScaleContext {
  root: number;
  mode: string;
}

export function useBridgeSuggestions(
  chords: Chord[],
  insertAfterIndex: number,
  scale: ScaleContext | null,
  maxBridgeLength?: number,
  topN?: number,
): BridgeSuggestion[]
```

### Behaviour

- Returns `[]` when:
  - `chords.length < 2`
  - `insertAfterIndex < 0`
  - `insertAfterIndex >= chords.length - 1`
- Otherwise calls `suggestBridges(chords[insertAfterIndex], chords[insertAfterIndex + 1], scale, maxBridgeLength, topN)`.
- Wraps call in `useMemo`; dependency array: `[chords, insertAfterIndex, scale, maxBridgeLength, topN]`.
- Default values: `maxBridgeLength = 2`, `topN = 3`.
- Does not call `suggestBridges` if the guard condition is not met (no wasted computation).

### Notes

- The hook is a thin wrapper over the pure `suggestBridges` function. Keep it minimal — no internal state beyond the `useMemo`.
- `ScaleContext` shape (`{ root: number; mode: string }`) must be compatible with the scale state already threaded through `ProgressionSidebar` from `App.tsx`. Check and match the existing type (see `ChromaticCircle`'s `selectedScale` prop and `ScaleMode` from `features/scale/types/`).
- Export `ScaleContext` from the hook file for reuse by the popover component.

---

## Acceptance Criteria

- [ ] Returns `[]` for all out-of-range and too-short guard cases
- [ ] Returns `BridgeSuggestion[]` from `suggestBridges` for a valid pair
- [ ] Memoized with `useMemo`; does not recompute unless inputs change
- [ ] `ScaleContext` type is exported and compatible with existing scale state shape
- [ ] `npm run lint` passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
