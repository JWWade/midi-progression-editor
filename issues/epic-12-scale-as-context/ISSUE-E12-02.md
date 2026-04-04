# ISSUE-E12-02 — Decouple Key Root from Chord Root

## Objective

Remove the automatic coupling between the active chord's root note and the
app's key root. Introduce `setKeyContext()` as the **single write path** for
all key state changes.

## Background

In `useChordState.ts`, a `useEffect` fires `onKeyScaleChange(effectiveRoot,
selectedScale)` whenever the selected chord's root changes. This silently
overwrites `keyRoot` in `App.tsx` on every chord interaction — a user
declaring "I am in G major" then selecting an F chord will silently move the
key to F. This is the root cause of the "C Dorian after selecting C Major"
browser refresh bug.

This issue is low-effort but architecturally central: it unblocks every other
E12 issue that depends on key context being stable and user-declared.

## Dual-Coordinate System (Architecture Note)

This issue formally separates the app into two coordinate systems:

- **Absolute pitch space** — chord graph, circle geometry; written by chord
  selection and drag. Not affected by this issue.
- **Relative harmonic space** — key context (root + mode); written **only**
  through `setKeyContext()` after this change.

Future contributors must declare which space their feature operates in. Logic
must not write to key state through any path other than `setKeyContext`.

## `setKeyContext` Contract

```ts
interface SetKeyContextAction {
  root: number;    // 0–11 pitch class
  scale: ScaleType;
  source: "panel" | "tonicSnap" | "snapshot" | "startup";
}

function setKeyContext(action: SetKeyContextAction): void
```

- All four write paths must use this function
- `source` is for debugging and future logging — no semantic effect on state
- `setKeyContext` is the exclusive mechanism for modifying `keyRoot` / `keyScale`

The four call sites and their sources:

| Call site | Source value |
|---|---|
| `KeyContextPanel` root/mode selectors (E12-01) | `"panel"` |
| "Set as tonic" / "Set to chord" tonic-snap (E12-01, E12-03) | `"tonicSnap"` |
| `importSnapshot` handler (E12-06) | `"snapshot"` |
| Startup initialization in `App.tsx` (E12-01) | `"startup"` |

## Changes

### `useChordState.ts`

Remove the `useEffect` (or the specific line within it) that calls
`onKeyScaleChange?.(effectiveRoot, selectedScale)`. After this change, chord
root changes do not trigger any key state update.

### `App.tsx`

- Retire the `handleKeyScaleChange` callback that was wired to the circle's
  `onKeyScaleChange` prop
- Introduce `setKeyContext` as a stable function (e.g. `useCallback`) derived
  from `useState` setters for `keyRoot` and `keyScale`
- Pass `setKeyContext` to `KeyContextPanel` (E12-01), `CurrentChordPanel`
  tonic-snap (E12-03), and `importSnapshot` (E12-06)

## Files To Edit

| File | Change |
|---|---|
| `client/src/features/chromatic-circle/hooks/useChordState.ts` | Remove `onKeyScaleChange` auto-fire on chord root change |
| `client/src/app/App.tsx` | Retire `handleKeyScaleChange`; introduce `setKeyContext` |

## Acceptance Criteria

- Selecting a chord with a different root does not change `keyRoot`
- Setting C Major in `KeyContextPanel`, then selecting an F chord → key remains
  C Major in the panel and in derived state (diatonic indices, Roman numeral)
- All writes to `keyRoot` / `keyScale` in the codebase pass through `setKeyContext`
- `source` field is present on every `setKeyContext` call site

## Verification Commands

```bash
cd client
npm run lint
npm run build
```
