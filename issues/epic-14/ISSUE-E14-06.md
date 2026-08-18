# ISSUE-E14-06 — Implement Accessibility-First Interaction and Semantics for All Surfaced Controls

## Objective

Ensure that every newly surfaced control in Epic 14 is usable by keyboard, understandable by assistive technology, and perceivable without relying on a single modality.

## Background

This epic explicitly treats accessibility as a baseline requirement rather than a follow-up polish pass. The current product already includes interactive musical controls, but newly surfaced options must be held to a stronger consistency standard across keyboard behavior, semantics, and feedback.

## Scope

1. Review every new control added under Epic 14.
2. Ensure logical focus order and visible focus indicators.
3. Ensure accessible names, roles, states, and values are exposed.
4. Ensure audio changes also have visible or textual equivalents.
5. Ensure dynamic updates are announced or otherwise perceivable.
6. Validate behavior against WCAG 2.2 POUR expectations.

## Files To Investigate

- `docs/accessibility-audit.md`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/chromatic-circle/components/`
- `client/src/features/current-chord/`
- `client/src/app/App.tsx`

## Requirements

### Keyboard and Focus

- No keyboard traps
- Logical tab order
- Visible focus ring or equivalent focus styling
- Full operability without pointer input

### Semantics and Feedback

- Programmatic name, role, and value for each control
- `aria-pressed`, `aria-expanded`, labels, descriptions, and live feedback where appropriate
- No reliance on color-only, animation-only, or sound-only signaling

## Acceptance Criteria

- [ ] Every new control is fully keyboard operable.
- [ ] Focus behavior is visible and logical.
- [ ] Screen readers can identify the purpose and current state of each control.
- [ ] Dynamic changes are perceivable without relying solely on audio.
- [ ] Baseline accessibility review passes for the Epic 14 feature set.
