# ISSUE-E6-01 — Lift `useProgressionPlayback` to `App.tsx`

## Objective
Move the `useProgressionPlayback` call from `ProgressionSidebar` to `App.tsx` and pass the resulting playback state and controls down as props. This is the prerequisite refactor that makes `playingIndex` available at the root level, enabling the `ChromaticCircle` to observe it in E6-02.

## Background
Currently `ProgressionSidebar` owns `useProgressionPlayback` and uses `playingIndex` only for per-tile highlighting. `ChromaticCircle` has no way to observe playback state because it is a sibling subtree. Lifting the hook to `App.tsx` is the minimal architectural change needed; the SPIKE investigation confirmed no pub/sub or context provider is necessary for this use case.

Reference: `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` §4, §8.1.

## Files To Edit

- `client/src/app/App.tsx` — add `useProgressionPlayback(chords)` call; derive `playingChord`; pass `isPlaying`, `playingIndex`, `onPlay`, `onStop` to `ProgressionSidebar`.
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` — remove internal `useProgressionPlayback` call; accept `isPlaying`, `playingIndex`, `onPlay`, `onStop` as props.

## Files To Add
None.

## Acceptance Criteria
- [ ] `useProgressionPlayback` is called exactly once, in `App.tsx`.
- [ ] `ProgressionSidebar` no longer imports or calls `useProgressionPlayback`.
- [ ] `ProgressionSidebar` accepts `isPlaying: boolean`, `playingIndex: number | null`, `onPlay: () => void`, `onStop: () => void` as props.
- [ ] Per-tile `isPlaying` highlighting in `ChordTile` continues to work as before.
- [ ] `App.tsx` derives `playingChord: Chord | null` as `playingIndex !== null ? (chords[playingIndex] ?? null) : null` (unused until E6-02, but defined here).
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
