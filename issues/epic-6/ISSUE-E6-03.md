# ISSUE-E6-03 — Playback-active visual indicator on `ChromaticCircle`

## Objective
Add a subtle visual indicator to `ChromaticCircle` that communicates playback is currently active. This prevents user confusion when the polygon changes without their direct input.

## Background
After E6-02, the `ChromaticCircle` polygon moves autonomously during playback. Without feedback, the user may not understand why the circle is changing. A lightweight indicator (e.g. a pulsing outer ring or a styled stroke on the SVG container) directly on the circle resolves this ambiguity without cluttering the UI.

Reference: `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` §6.2 (Optional Enhancements), §9.2 (Risk: externalChord override confuses the user).

## Depends On
E6-02

## Files To Edit

- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx` — accept `isPlaybackActive?: boolean` prop; apply a CSS class or inline SVG style when `true`.
- `client/src/app/App.tsx` — pass `isPlaybackActive={isPlaying}` to `ChromaticCircle`.

## Files To Add/Edit (styling)
- Add indicator styles to the existing `ChromaticCircle` CSS module (or SVG inline styles). A CSS keyframe pulse on the ring element is the recommended approach.

## Design Constraints
- The indicator must be non-intrusive — it should not obscure any note labels, the polygon, or the ring.
- Animation should use CSS (not `requestAnimationFrame`) so it runs independently of the chord-morph animation.
- The indicator must disappear when `isPlaybackActive` becomes `false`.
- Color/opacity should match the existing design language of the circle; avoid introducing new brand colors.

## Acceptance Criteria
- [ ] A visible indicator is present on `ChromaticCircle` whenever `isPlaying` is `true`.
- [ ] The indicator disappears immediately (or fades out gracefully) when playback stops.
- [ ] The indicator does not interfere with user interaction (click/drag) on the circle.
- [ ] The indicator does not obstruct note labels or the existing chord polygon.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
