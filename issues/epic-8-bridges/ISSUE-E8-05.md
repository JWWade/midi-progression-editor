# ISSUE-E8-05 — Undo After Bridge Apply

**Epic:** Epic 8 — ii–V Bridge Suggestions  
**Priority:** Medium  
**Estimate:** 1 story point  
**Depends on:** ISSUE-E8-03

---

## Summary

Wrap the **Apply** action (inserting bridge chords into the progression) in an undo mechanism so the user can immediately reverse the insertion if the bridge doesn't fit. Show a toast notification with an inline **Undo** link that removes the inserted chords.

---

## Background

The current progression state lives in `App.tsx` as `chords: Chord[]`. When a bridge is applied, `n` new chords are spliced into the array at the insertion index. Undoing should restore the exact previous `chords` array.

---

## Files to Modify / Create

| File | Action |
|---|---|
| `client/src/features/progression-sidebar/hooks/useBridgeApply.ts` | Create |
| `client/src/app/App.tsx` | Modify — consume `useBridgeApply`, render toast |
| `client/src/shared/components/Toast/Toast.tsx` | Modify or Create (if not present) |

---

## Requirements

### `useBridgeApply` hook

```typescript
export function useBridgeApply(
  chords: Chord[],
  setChords: (chords: Chord[]) => void,
): {
  applyBridge: (bridge: Chord[], insertAfterIndex: number) => void;
  undoPending: boolean;
  undoBridge: () => void;
  clearUndo: () => void;
}
```

- `applyBridge(bridge, insertAfterIndex)`:
  1. Stores a snapshot: `const snapshot = chords.slice()`.
  2. Splices `bridge` into `chords` after `insertAfterIndex`.
  3. Calls `setChords([...newChords])`.
  4. Sets `undoPending = true`.
  5. Starts a 6-second timer; when it fires, calls `clearUndo` (toast auto-dismisses).
- `undoBridge()`:
  1. Calls `setChords(snapshot)`.
  2. Calls `clearUndo`.
- `clearUndo()`: clears snapshot, sets `undoPending = false`, cancels any pending timer.
- Calling `applyBridge` again while `undoPending` is true discards the previous snapshot and starts fresh (chained applies are not multi-level undoable).

### Toast notification

While `undoPending === true`, render a toast in `App.tsx`:

```
Bridge inserted — Undo
```

- Toast floats over the bottom of the screen at `bottom: 24px; left: 50%; transform: translateX(-50%)`.
- Contains a `<button>Undo</button>` that calls `undoBridge()`.
- Dismisses automatically after 6 seconds.
- Dismisses immediately on `undoBridge()` or `clearUndo()`.
- Only one toast visible at a time (applying a new bridge replaces any existing toast).
- The toast is `role="status"` and `aria-live="polite"` for accessibility.

If a shared `Toast` component already exists at `client/src/shared/components/Toast/`, update it to accept an `action?: { label: string; onClick: () => void }` prop; otherwise create a minimal local toast component.

---

## Acceptance Criteria

- [ ] Applying a bridge inserts the chords and shows the **Undo** toast
- [ ] Clicking **Undo** removes the inserted bridge chords and restores prior progression
- [ ] Toast dismisses automatically after 6 seconds
- [ ] Toast does not accumulate — only one visible at a time
- [ ] Undoing after a second apply restores the state just before that second apply (not the original)
- [ ] `npm run lint` passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
