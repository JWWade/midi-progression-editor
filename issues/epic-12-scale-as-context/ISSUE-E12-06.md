# ISSUE-E12-06 — Persist Key Context in Session Snapshot

## Objective

Confirm that `HarmonySnapshot.scaleContext` is written exclusively through
`setKeyContext()` and that JSON export/import correctly round-trips the
user-declared key — not a chord-coupled artifact from the pre-E12-02 bug.

## Background

`HarmonySnapshot` already has a `scaleContext` field, and `importSnapshot`
already reads it. However, before E12-02, `keyRoot` was silently overwritten
by chord selection, so any snapshot captured before decoupling may encode the
most recently played chord root as the key — not the user's declared key.

After E12-02, the key state is stable and intentional. This issue validates
and enforces the round-trip. It is primarily **verification and wiring work**,
not new feature work.

## Contract

All writes to snapshot key context must route through `setKeyContext`:

```ts
// In importSnapshot handler:
setKeyContext({
  root: snapshot.scaleContext.root,
  scale: snapshot.scaleContext.scale,
  source: "snapshot",
})
```

The `source: "snapshot"` value identifies the write origin without affecting
behavior. It must not bypass `setKeyContext` and set `keyRoot` / `keyScale`
directly.

## Files To Edit

| File | Change |
|---|---|
| `client/src/app/App.tsx` | Confirm `importSnapshot` calls `setKeyContext({ ..., source: "snapshot" })` |
| `client/src/shared/types/HarmonySnapshot.ts` | Confirm `scaleContext` field type is `{ root: number; scale: ScaleType }` |

## Acceptance Criteria

- Export a snapshot with key set to D Dorian (root 2, scale `"dorian"`)
- Import that snapshot → `KeyContextPanel` displays D Dorian
- The restored key is **not** overwritten by startup chord selection or any
  subsequent chord interaction
- `importSnapshot` in `App.tsx` passes `source: "snapshot"` to `setKeyContext`
- `scaleContext` field type in `HarmonySnapshot.ts` matches `{ root: number; scale: ScaleType }`

## Verification Commands

```bash
cd client
npm run lint
npm run build
npm test
```
