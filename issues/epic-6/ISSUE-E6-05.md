# ISSUE-E6-05 — Configurable chord duration in `useProgressionPlayback`

## Objective
Replace the hardcoded 1200 ms chord duration in `useProgressionPlayback` with a configurable value exposed via a UI control (BPM input or direct ms-per-chord input).

## Background
`useProgressionPlayback` currently uses a fixed 1200 ms duration per chord (`playChord` call in `audioUtils.ts` / the sequencer loop). Giving the user control over tempo is a natural quality-of-life improvement now that playback is synchronized with the `ChromaticCircle`. The morph animation (260 ms) remains well within budget at any practical tempo; the SPIKE recommends constraining `morphDuration ≤ chordDuration × 0.25`, which is satisfied at durations ≥ 1040 ms (i.e. BPM ≤ ~58 for whole-note equivalence, or any duration if morphDuration is treated as fixed).

Reference: `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` §6.3, §7.3.

## Depends On
E6-01

## Files To Edit

- `client/src/features/audio/hooks/useProgressionPlayback.ts` — accept a `chordDurationMs: number` parameter (default `1200`).
- `client/src/app/App.tsx` — pass `chordDurationMs` to `useProgressionPlayback`; source from new UI state.
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` — add a tempo/duration control (e.g. a labeled number input or BPM slider) that feeds back up via a prop or lives in `App.tsx` state.

## Files To Add
None.

## Design Constraints
- The control should be visible near the play/stop buttons in `ProgressionSidebar`.
- Minimum value: 200 ms per chord (approx. 300 BPM equivalent — below this, morph and audio would overlap unpleasantly).
- Maximum value: 4000 ms per chord.
- Label the control clearly (e.g. "ms / chord" or "BPM"). If BPM, convert to ms in `App.tsx` before passing to the hook.
- Changing the duration while playback is active takes effect at the next chord (no mid-chord interruption needed).

## Acceptance Criteria
- [ ] `useProgressionPlayback` accepts `chordDurationMs` and uses it for all chord playback durations.
- [ ] The UI exposes a control to adjust tempo/duration near the playback buttons.
- [ ] Default value remains 1200 ms so existing behavior is unchanged if the control is not touched.
- [ ] Input is validated/clamped to the allowed range; out-of-range values are rejected or clamped silently.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
