# ISSUE-E14-04 — Add Expressive Playback Controls for Octave Range and Pattern Presets

## Objective

Expose a small set of playback-expression controls that make the system feel more musical, more personal, and more fun to experiment with.

## Background

The app already supports audio playback, loop mode, tempo control, beats per chord, and arpeggio pattern editing. That is a strong foundation for making playback more expressive without introducing a full DAW-style panel.

A good MVP should focus on controls that are easy to understand and immediately audible, such as octave range and playback presets.

## Scope

1. Add an octave-range or register control for playback.
2. Add pattern presets that make arpeggiated playback easier to explore.
3. Ensure these controls pair sound changes with visible textual state.
4. Keep the controls approachable for first-time users.

## Files To Investigate

- `client/src/features/audio/hooks/useProgressionPlayback.ts`
- `client/src/features/audio/utils/audioUtils.ts`
- `client/src/features/audio/types/arpeggioPattern.ts`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/midi-export/utils/midiBuilder.ts`

## Requirements

### UX

- Presets should feel like guided entry points, not technical configuration bundles.
- Users should be able to discover the audible difference quickly.
- The UI should communicate the current playback profile clearly.

### Accessibility

- Audio changes must be paired with visible text or state indicators.
- No control should depend on hearing alone.
- Labels and current values must be exposed to assistive technologies.

## Acceptance Criteria

- [ ] Users can adjust playback octave or register from the UI.
- [ ] Users can select from a small set of understandable playback pattern presets.
- [ ] Preset changes are visible and understandable even with audio muted.
- [ ] The controls remain easy to use and do not overwhelm the default workflow.
