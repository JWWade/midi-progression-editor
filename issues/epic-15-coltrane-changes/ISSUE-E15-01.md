# ISSUE-E15-01 — Define the Coltrane Bridge Generation Model and MVP Scope

## Objective

Define a repo-aligned, musically coherent, and implementation-ready model for Coltrane-style bridge generation.

## Background

Coltrane changes are a recognizable reharmonization device built from symmetric tonic centers separated by major thirds, usually prepared by dominant chords. They are especially effective for expanding a cadence or inserting a more adventurous bridge before a resolution.

Because the app already supports bridge suggestions and advanced harmonic exploration, this is a natural extension — but it needs a clearly bounded MVP before implementation begins.

## Scope

1. Define the exact musical model used for the MVP.
2. Decide whether the initial implementation targets:
   - destination major chords only
   - ii–V–I expansion first
   - or more general stable-chord bridging
3. Define which variants are in scope for v1:
   - full cycle only
   - partial cycle variants
   - deterministic ordering
4. Define how the feature should appear in the UI and issue language.

## Requirements

### Musical Model

- Base the bridge on the destination tonic or destination chord center.
- Build the major-third tonic cycle from that destination.
- Precede each tonic center with its dominant.
- Prefer an ordering that resolves clearly and musically into the destination.

### Product Framing

- Label this as an advanced bridge option.
- Keep the feature optional and discoverable.
- Do not require jazz knowledge to use it successfully.

## Acceptance Criteria

- [ ] The MVP Coltrane generation model is defined and documented.
- [ ] Initial scope boundaries are agreed and recorded.
- [ ] Edge-case assumptions are documented for enharmonic spelling and non-major targets.
- [ ] Follow-on implementation work can proceed without ambiguity.
