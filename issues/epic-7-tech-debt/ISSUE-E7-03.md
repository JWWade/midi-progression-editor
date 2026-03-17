# ISSUE-E7-03 — Refactor `useChordState` into Focused Single-Concern Hooks

## Objective
Break the monolithic `useChordState` hook (309 lines, 7 `useState` calls, 5 `useCallback` functions, multiple unrelated concerns) into smaller, independently testable hooks.

## Background
`client/src/features/chromatic-circle/hooks/useChordState.ts` currently manages all of the following in a single function:

| Concern | State/callbacks |
|---|---|
| Pointer drag detection | `dragStart`, `currentDrag`, `dragHasMoved` |
| Named chord selection | `selectedChord`, `selectChord` |
| Custom chord construction | `customNotes`, `toggleCustomNote`, `clearCustomNotes`, `isCustomMode` |
| Primitive chord shape | derived from `selectedChord.type` |
| Screen-reader announcements | `announcement` string, setter |

The combined size makes the hook impossible to unit-test (too many internal dependencies) and difficult to reason about (unrelated state changes may trigger re-renders together).

## Proposed Split

### `useDragState` (new)
```ts
// Owns: dragStart, currentDrag, dragHasMoved
// Exported from: chromatic-circle/hooks/useDragState.ts
```

### `useChordSelection` (new)
```ts
// Owns: selectedChord, selectChord callback
// Exported from: chromatic-circle/hooks/useChordSelection.ts
```

### `useCustomChordState` (new)
```ts
// Owns: customNotes, toggleCustomNote, clearCustomNotes, isCustomMode
// Exported from: chromatic-circle/hooks/useCustomChordState.ts
```

### `useChordState` (thin orchestrator — keep same public interface)
```ts
// Composes the three new hooks + announcement state
// Public surface unchanged — callers require no edits
// Target: ≤150 lines
```

## Files To Add
- `client/src/features/chromatic-circle/hooks/useDragState.ts`
- `client/src/features/chromatic-circle/hooks/useChordSelection.ts`
- `client/src/features/chromatic-circle/hooks/useCustomChordState.ts`

## Files To Edit
- `client/src/features/chromatic-circle/hooks/useChordState.ts` — gutted to orchestrator; delegates to new hooks.
- `client/src/features/chromatic-circle/hooks/index.ts` — export new hooks if not already done.

## Files Not To Edit
- Any component that calls `useChordState` — the public interface must remain identical.

## Acceptance Criteria
- [ ] Three new focused hooks exist, each ≤150 lines and with a single declared concern.
- [ ] `useChordState.ts` is ≤150 lines and only composes the three hooks.
- [ ] No caller of `useChordState` requires any change.
- [ ] All existing tests pass.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
npm test
```
