# ISSUE-E14-02 — Add Harmonic Intent Controls for Scale Lock and Tonal Constraint

## Objective

Expose controls that let users intentionally constrain exploration to a tonal context and choose between safer diatonic behavior and freer chromatic behavior.

## Background

The app already tracks key root and scale mode in the top-level app state and includes a dedicated scale feature. That creates a strong foundation for making harmonic intent more visible and more controllable.

Right now, some of that context is present in the system but not surfaced as a first-class exploration control.

## Scope

1. Surface a scale or mode lock control in a user-friendly way.
2. Add a diatonic-versus-chromatic exploration toggle.
3. Ensure these states are clearly reflected across progression, playback, and exploration flows where relevant.
4. Provide plain-language labels and descriptions so the controls remain accessible to non-experts.

## Files To Investigate

- `client/src/app/App.tsx`
- `client/src/features/scale/`
- `client/src/features/chromatic-circle/`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/midi-export/`

## Requirements

### UX

- Prefer stepped or segmented controls over hidden behavior.
- Use descriptive labels rather than theory-heavy language where possible.
- Show the currently active harmonic mode in a way that is perceivable without color.

### Accessibility

- Every state must be keyboard reachable and screen-reader understandable.
- Labels must expose name, role, and value programmatically.
- State changes should be announced or otherwise made clearly perceivable.

## Acceptance Criteria

- [ ] Users can set a scale or mode lock deliberately.
- [ ] Users can switch between diatonic and chromatic exploration modes.
- [ ] The current harmonic constraint is clearly visible in the UI.
- [ ] The interaction is fully keyboard operable.
- [ ] The control language is understandable without requiring prior music theory knowledge.
