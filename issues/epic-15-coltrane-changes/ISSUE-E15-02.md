# ISSUE-E15-02 — Implement Destination-Aware Coltrane Tonic-Cycle Generation

## Objective

Add bridge-generation logic that derives Coltrane-style tonic centers from a destination and produces a deterministic advanced bridge sequence.

## Background

The core construction pattern is:

1. identify the destination tonic center
2. derive the two additional major-third tonic centers
3. add dominant preparation chords before each center
4. compress the result into a bridge sequence that resolves into the destination

This issue focuses on the musical logic itself, independent of UI polish.

## Scope

1. Implement tonic-center generation using major-third symmetry.
2. Derive dominant chords for each tonic center.
3. Produce a structured bridge result that the UI can preview and insert.
4. Ensure the sequence is musically coherent and deterministic.

## Requirements

### MVP Behavior

- Support major destination contexts first.
- Generate one stable default sequence per target.
- Prefer consistency and clarity over maximal variation.
- Make the result suitable for playback preview and progression insertion.

### Data Contract

- The bridge result should clearly distinguish between:
  - generated bridge chords
  - destination chord
  - optional explanation metadata if needed later

## Acceptance Criteria

- [ ] A destination chord can generate a Coltrane-style bridge sequence.
- [ ] The tonic cycle uses major-third spacing.
- [ ] Each tonic center is preceded by the correct dominant preparation.
- [ ] The result resolves into the intended destination.
- [ ] The output is stable and ready for UI integration.
