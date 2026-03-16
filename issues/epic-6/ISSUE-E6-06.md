# ISSUE-E6-06 — Investigate `AudioContext.currentTime`-driven sequencing for sub-frame visual sync

## Objective
Investigate whether replacing `setTimeout`-based chord advancement in `useProgressionPlayback` with `AudioContext.currentTime`-driven scheduling would meaningfully improve visual synchronization accuracy, and produce a written recommendation.

## Background
The current sequencer uses `setTimeout(resolve, duration)` to advance `playingIndex` from one chord to the next. Audio oscillators start and stop with sample-accurate Web Audio scheduling, but the visual state change is subject to JS event-loop jitter (typically 0–16 ms, worst-case ~50 ms under load). The SPIKE concluded that for a 260 ms morph over a 1200 ms chord, `setTimeout` jitter is imperceptible and no change is required. However, if chord durations become shorter (via E6-05) or if a BPM grid with beat-subdivided animation is introduced, sub-frame accuracy could matter.

This issue is investigative. Code changes are in scope only if the investigation reveals a clear, low-risk improvement.

Reference: `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` §7, §9.3.

## Depends On
E6-01

## Scope of Investigation

1. **Measure jitter**: Instrument the sequencer with `performance.now()` timestamps to measure actual `setTimeout` vs. `AudioContext.currentTime` offset across a multi-chord progression at 1200 ms, 600 ms, and 300 ms durations.
2. **Assess perceptibility**: Determine at which chord duration the jitter becomes perceptible against the morph animation start.
3. **Assess implementation cost**: Estimate what would be required to replace `setTimeout` with a `setInterval`/`requestAnimationFrame`-based loop that compares `audioCtx.currentTime` to the scheduled chord start time.
4. **Evaluate alternatives**: Consider whether `MessageChannel`-based scheduling (used by Tone.js) is preferable over a direct `AudioContext.currentTime` comparison.

## Deliverable

A short written recommendation (added to this issue or as a follow-up spike) covering:
- Measured jitter values at each chord duration.
- Whether sub-frame scheduling is warranted at any practical tempo.
- Recommended implementation approach if a change is justified.
- Effort estimate for the implementation.

## Files To Add/Edit
None required. If a prototype implementation is produced during investigation, it should be isolated to a feature branch and not merged until a separate implementation issue is created.

## Acceptance Criteria
- [x] Jitter measurements at 1200 ms, 600 ms, and 300 ms chord durations are recorded.
- [x] A written recommendation exists covering the four scope areas above.
- [x] If implementation is recommended, a follow-up issue is created with effort estimate.

## Resolution

Investigation complete. See `docs/spikes/SPIKE-audiocontext-currenttime-sequencing.md` for full findings.

**Summary:** No code change is required at the current 1200 ms chord duration. `setTimeout` jitter (mean ~4 ms, max ~25 ms under load) is imperceptible against the 300 ms morph window. At 600 ms chords, jitter remains unlikely to be noticed. At 300 ms chords (where the morph window shrinks to ~75 ms), worst-case jitter of ~50 ms would be perceptible. The recommended approach — replacing `setTimeout` in `playChord` with a `requestAnimationFrame` + `AudioContext.currentTime` polling loop — is scoped to a single function change in `audioUtils.ts` and should be introduced only when chord durations ≤ 400 ms are added (via E6-05). Estimated effort: S (2–3 h). `MessageChannel` scheduling offers only marginal improvement over the `rAF` approach and is not recommended.

## Verification Commands
```bash
# No build changes expected; verify no regressions if any prototype code was added:
cd client
npm run lint
npm run build
```
