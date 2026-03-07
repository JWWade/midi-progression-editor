# ISSUE-38 — Frontend: Finite Progression Length

## User Story

As a user, I want **the progression to have a clear maximum number of steps** so the interface stays simple and readable.

## Summary

Enforce a maximum number of chords in the progression. When the maximum is reached, the "add chord" action should be disabled or blocked, and the user should be informed of the limit. This keeps the sidebar compact and the interface focused.

## Requirements

### Limit Definition
- Define a named constant for the maximum progression length (e.g., `MAX_PROGRESSION_LENGTH = 8` or 16)
- The value is configurable as a constant in a shared config file — not hardcoded in multiple places

### Behavior When Limit is Reached
- The "add chord" button in the current-chord panel (ISSUE-30) becomes **disabled** when the progression is full
- The button shows a tooltip or nearby message explaining why it is disabled (e.g., "Progression is full (8/8)")
- The sidebar may also display a subtle indicator at the bottom when full (e.g., "Maximum 8 chords reached")
- Attempting to add via keyboard or programmatically is also blocked (guard in state logic)

### State Management
- The add-chord logic checks `progression.length < MAX_PROGRESSION_LENGTH` before appending
- This guard lives in the progression state management layer (hook or context), not just in the UI

### Frontend Architecture
- Create or update `src/features/progression-sidebar/constants/progressionConfig.ts`
  - Export `MAX_PROGRESSION_LENGTH: number`
- Update the progression state hook to enforce the limit
- Update `CurrentChordPanel.tsx` / the add button to reflect the disabled state and provide user feedback

### Constraints
- The maximum must be enforced in state logic (not just visually hidden in the UI)
- The limit value must be a single named constant — no magic numbers
- User must understand *why* the button is disabled (not just dimmed with no explanation)

## Acceptance Criteria
- [ ] A named constant defines the maximum progression length
- [ ] The "add chord" button is disabled when the limit is reached
- [ ] The user is informed of the limit when the button is disabled
- [ ] Attempting to add a chord programmatically when full is blocked in state logic
- [ ] The sidebar indicates when it is full
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-35**: Right-hand Vertical Progression Sidebar
- **ISSUE-37**: Simple Editing Controls (delete frees up slots)
- **ISSUE-39**: Session-only Persistence for Progression
- **ISSUE-40**: Add-to-Progression Flow
