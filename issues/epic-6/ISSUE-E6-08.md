# ISSUE-E6-08 — ARIA live region announcing current chord during playback

## Objective
Add an ARIA live region to `ChromaticCircle` (or its parent container in `App.tsx`) that announces the name of each chord as it begins playing, so screen-reader users receive the same per-chord feedback that sighted users get from the morphing polygon.

## Background
After E6-02, `playingChord` is available at the `App.tsx` level and updates each time `playingIndex` advances. Announcing the chord name via a `role="status"` or `aria-live="polite"` region requires only a small addition — no new audio or animation work. This is a low-effort accessibility improvement with meaningful impact for screen-reader users.

Reference: `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` §12, FU-8.

## Depends On
E6-02

## Files To Edit

- `client/src/app/App.tsx` — add a visually hidden `<div>` with `aria-live="polite"` and `aria-atomic="true"` whose text content is set to the display name of `playingChord` whenever it changes (empty string when `playingChord` is `null`).

## Files To Add
None.

## Implementation Notes

A visually hidden live region should be off-screen but present in the DOM (not `display: none` or `visibility: hidden`, which suppress screen-reader announcements). Use a `.sr-only` CSS class (already common in this codebase, or add it to the global stylesheet):

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

The announced string should be the chord display name (e.g. "C Major", "A Minor 7") — the same value shown in `CurrentChordPanel`. When playback stops, update the region to "Playback stopped" (then clear after a short delay) or simply set it to an empty string.

## Acceptance Criteria
- [ ] A screen reader announces each chord name as playback advances.
- [ ] The live region is visually hidden and does not affect layout.
- [ ] The live region is empty (or contains "Playback stopped") when playback is not active.
- [ ] The announcement does not fire for user-driven chord selection changes (only during playback).
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
