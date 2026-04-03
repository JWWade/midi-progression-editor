# ISSUE-E10-02 — Tutorial UX Controls and Accessibility

## Objective

Ensure the tutorial system is user-controlled, accessible, and robust across keyboard, screen reader, and reduced-motion usage patterns.

## Background

The current system supports modal and tooltip surfaces with dismiss, skip, skip-all, and reset flows. That is a good baseline, but it does not yet offer pacing modes, snooze behavior, progress feedback, or an explicit accessibility hardening pass for focus, keyboard flow, and motion preferences.

## Scope

1. Add experience modes for tutorial interruption level.
2. Add user controls such as snooze/pause and progress indication.
3. Strengthen focus management and keyboard support.
4. Improve screen reader support and reduced-motion handling.
5. Add scenario and accessibility tests.

## Files To Edit

Expected touch points:

- `client/src/features/tutorial/context/TutorialProvider.tsx`
- `client/src/features/tutorial/types/index.ts`
- `client/src/features/tutorial/components/TutorialTooltip.tsx`
- `client/src/features/tutorial/components/TutorialModal.tsx`
- Related tutorial CSS module files
- `client/src/app/App.tsx` if new settings entry points are added at app level
- Tutorial tests and any accessibility/scenario test files

## Requirements

### Experience Modes

Implement a defined behavior model for:

- Guided
- Standard
- Minimal

Each mode must explicitly control:

- which steps may auto-trigger
- interruption frequency
- whether non-critical idle prompts are allowed

### User Controls

Add:

- snooze or pause behavior
- a visible or accessible step progress indicator where sequences make sense

### Focus and Keyboard Behavior

- Focus moves into the tutorial surface when it opens.
- Focus returns appropriately when the tutorial closes.
- Logical tab order is preserved.
- Tooltip and modal interactions are fully keyboard-operable.

### Screen Reader and Motion Support

- Correct roles and accessible naming are present for tutorial surfaces.
- Tutorial behavior respects `prefers-reduced-motion`.
- Non-essential animation is removed or suppressed in reduced-motion mode.

### Test Coverage

Add scenario coverage for:

- first-time user flow
- returning user flow
- minimal mode behavior
- keyboard-only interaction
- screen reader and accessibility checks where practical in the existing test stack

## Acceptance Criteria

- [ ] Experience modes are implemented with documented behavior differences.
- [ ] Users can control interruption level and temporarily pause tutorials.
- [ ] Tutorial UI is fully keyboard operable.
- [ ] Focus management is correct on open and close.
- [ ] Tutorial UI exposes correct roles and accessible naming.
- [ ] Reduced-motion preference is respected.
- [ ] Scenario and accessibility tests cover the new behavior.
- [ ] Trusted Tester and baseline accessibility expectations are represented in the implementation and tests.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] `npm test` passes.

## Verification Commands

```bash
cd client
npm run lint
npm run build
npm test
```
