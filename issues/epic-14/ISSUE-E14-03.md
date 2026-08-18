# ISSUE-E14-03 — Add Transformation Controls for Mirror Axis and Mutation Intensity

## Objective

Give users more intentional control over how harmonic ideas evolve by surfacing transformation settings instead of keeping them implicit.

## Background

The current codebase already contains transformation primitives such as mirroring, rerooting, rotation, and mutation in the chromatic-circle workflow. These are musically interesting and visually engaging, but they should be easier to control deliberately.

## Scope

1. Surface mirror axis selection as an explicit user control.
2. Surface mutation intensity so users can choose between subtle and more adventurous changes.
3. Ensure transformation actions are reversible, understandable, and accompanied by textual feedback.
4. Avoid controls that require drag-only or hover-only interaction.

## Files To Investigate

- `client/src/features/chromatic-circle/hooks/useCustomChordState.ts`
- `client/src/features/chord/utils/reflectChord.ts`
- `client/src/features/chromatic-circle/components/`
- `client/src/features/current-chord/`

## Requirements

### Product Behavior

- Users should be able to choose the transformation context before applying it.
- The system should clearly communicate what changed after each transformation.
- Controls should support both playfulness and precision.

### Accessibility

- Mirror-axis selection must be keyboard operable.
- Mutation state must be communicated in text, not only animation or sound.
- Users must have a clear way to undo, reset, or recover from experimental changes.

## Acceptance Criteria

- [ ] Mirror axis can be selected directly from the UI.
- [ ] Mutation intensity can be adjusted without code or hidden settings.
- [ ] Every transformation provides perceivable feedback about what occurred.
- [ ] The flow supports undo or reset.
- [ ] The feature works with keyboard-only interaction.
