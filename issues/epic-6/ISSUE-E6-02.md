# ISSUE-E6-02 — Add `externalChord` prop to `ChromaticCircle` and wire to playing chord

## Objective
Add an `externalChord?: Chord | null` prop to `ChromaticCircle`. When non-null, the circle renders and animates to that chord instead of the user's internal selection. Wire `playingChord` from `App.tsx` into this prop so the circle morphs live as each chord sounds during progression playback.

## Background
After E6-01 lifts `useProgressionPlayback` to `App.tsx`, `playingChord` is available at the root level but not yet consumed by `ChromaticCircle`. This issue closes that gap. The existing `useChordMorphing` hook already handles all animation automatically — every time `externalChord` changes (i.e. each time `playingIndex` advances), `useChordMorphing` detects the new polygon points, starts a new interpolation, and renders the transition via `requestAnimationFrame`. No new animation code is needed.

When `externalChord` returns to `null` (playback stops), the circle naturally morphs back to the user's current selection.

Reference: `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` §4.2, §8.2, §10.2.

## Depends On
E6-01

## Files To Edit

- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx` — add `externalChord?: Chord | null` to props interface; prefer `externalChord.root` / `externalChord.quality` over internal state when non-null.
- `client/src/app/App.tsx` — pass `externalChord={playingChord}` to `ChromaticCircle`.

## Files To Add
None.

## Implementation Notes

Inside `ChromaticCircle`, the effective root and quality should be derived as:

```tsx
const rootIndex = externalChord?.root ?? internalRoot;
const chordType  = externalChord?.quality ?? internalQuality;
```

`internalRoot` and `internalQuality` continue to come from `useChordState` unchanged. `fromPoints` and the `useChordMorphing` call are already downstream of these two variables — no further changes to the animation pipeline are required.

## Acceptance Criteria
- [ ] `ChromaticCircle` accepts `externalChord?: Chord | null` without TypeScript errors.
- [ ] When a progression is playing, the polygon morphs to each successive chord as it sounds.
- [ ] When playback stops (`externalChord` becomes `null`), the polygon morphs back to the user-selected chord.
- [ ] User interaction (clicking/dragging) during playback does not break the visual; `externalChord` continues to override until playback stops.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
