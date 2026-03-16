# ISSUE-E6-04 — Guard against mid-playback progression mutations

## Objective
Stop playback automatically when the user adds, removes, or reorders chords in the progression while playback is active. This prevents the sequencer from playing stale chord data after a mutation.

## Background
`useProgressionPlayback` captures the `chords` array at the time `play()` is called. Mutations made during playback (add, delete, reorder) are not reflected in the running loop, which can cause the sequencer to play deleted chords or skip newly added ones. The simplest correct fix is to stop playback whenever the `chords` array identity changes while `isPlaying` is `true`.

After E6-01, `isPlaying`, `stop()`, and `chords` are all available in `App.tsx`, making this guard straightforward to implement.

Reference: `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` §9.2 (Risk: User adds/removes chords during playback).

## Depends On
E6-01

## Files To Edit

- `client/src/app/App.tsx` — add a `useEffect` that calls `stop()` whenever `chords` changes and `isPlaying` is `true`.

## Files To Add
None.

## Implementation Notes

```tsx
useEffect(() => {
  if (isPlaying) {
    stop();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [chords]);
```

The `stop` reference is stable (ref-backed in `useProgressionPlayback`), so it does not need to be in the dependency array. Only `chords` (the progression entries array) should be the trigger.

## Acceptance Criteria
- [ ] Adding a chord while playback is active stops playback immediately.
- [ ] Deleting a chord while playback is active stops playback immediately.
- [ ] Reordering chords while playback is active stops playback immediately.
- [ ] Starting playback on an unchanged progression works normally.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
