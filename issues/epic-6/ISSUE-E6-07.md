# ISSUE-E6-07 — Pulse/glow effect on polygon entry during playback

## Objective
Add a brief pulse or glow animation to the chord polygon in `ChromaticCircle` each time a new chord begins during playback. This provides a tactile "beat" cue that reinforces the audio onset.

## Background
After E6-02, the polygon morphs smoothly between chords but there is no distinct visual onset cue at the moment a new chord starts sounding. A short pulse (300–500 ms CSS keyframe animation on the `<polygon>` element) triggered by `playingIndex` changing would give the user a clear per-chord marker without requiring any changes to the `requestAnimationFrame`-based morphing pipeline.

The SPIKE identified this as a low-effort optional enhancement using CSS keyframes. `ChordPolygon.tsx` renders the `<polygon>` element and is the appropriate place to apply the animation class.

Reference: `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` §6.2.

## Depends On
E6-02

## Files To Edit

- `client/src/features/chromatic-circle/components/ChordPolygon.tsx` — accept a `pulse?: boolean` prop; apply a CSS animation class for one cycle when `true`, then reset.
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx` — derive whether the current render is a new chord onset (i.e. `externalChord` just changed) and pass `pulse` to `ChordPolygon`.
- Add pulse keyframe styles to the existing `ChromaticCircle` CSS module.

## Design Constraints
- The pulse must be a single, non-repeating CSS animation cycle (300–500 ms).
- The animation should affect opacity, stroke brightness, or a brief scale/spread glow — not permanently alter the polygon's fill color or shape.
- The pulse must not conflict with or interrupt the morph animation (which operates on `points`, not `opacity`/`filter`).
- The pulse must only fire during playback (`externalChord` non-null), not on user-driven chord changes.

## Implementation Notes
To trigger the CSS animation for exactly one cycle, apply the animation class on the frame when `externalChord` changes, then remove it after the animation completes (via `onAnimationEnd` or a short `setTimeout` matching the keyframe duration). Alternatively, a React `key` change on the polygon element causes React to remount the element, which naturally re-triggers any CSS entry animation.

## Acceptance Criteria
- [ ] A visible pulse fires on the polygon at the start of each chord during playback.
- [ ] The pulse does not fire when the user changes chord selection manually.
- [ ] The pulse is a single cycle and does not loop.
- [ ] The morph animation is visually unaffected by the pulse.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
