# ISSUE-E14-05 — Add Workflow Controls for Exploration Modes, Looping Behavior, and Scoped Randomness

## Objective

Give users better control over how they explore ideas over time, especially when auditioning progressions, looping material, or generating variations.

## Background

The app already includes looping and progression playback, and the UI already supports iterative composition through the sidebar. There is an opportunity to expose a few additional workflow-level controls that improve experimentation without increasing musical complexity.

## Scope

1. Review which workflow controls should be promoted to first-class UI controls.
2. Prioritize high-value options such as:
   - auto-advance behavior
   - looping behavior variants
   - scoped randomization
   - safe exploration versus full exploration mode
3. Ensure automated behaviors are explicit, reversible, and easy to pause.

## Files To Investigate

- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/audio/hooks/useProgressionPlayback.ts`
- `client/src/app/App.tsx`
- any custom chord or progression generation helpers that support randomness or transformation

## Requirements

### UX

- Treat automated behaviors as clear modes, not hidden background behavior.
- Avoid surprising context changes.
- Make it easy to stop, pause, or revert exploratory actions.

### Accessibility

- All workflow states must be visible and keyboard operable.
- Loop or autoplay behavior must remain user-controlled.
- No automation should trap focus or interfere with navigation.

## Acceptance Criteria

- [ ] At least one additional workflow control is surfaced beyond the current baseline.
- [ ] Automated behaviors are explicit and easy to pause or stop.
- [ ] Users can understand the current exploration mode at a glance.
- [ ] The experience remains accessible and predictable.
