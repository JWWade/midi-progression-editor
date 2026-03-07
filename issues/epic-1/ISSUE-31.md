# ISSUE-31 — Frontend: Material-UI Expressiveness for the Current-Chord Panel

## User Story

As a user, I want **the panel to feel tactile and musical, with soft surfaces, subtle elevation, and elegant typography** so the current-chord panel feels like a natural part of the creative instrument.

## Summary

Apply Material-UI (or equivalent) design tokens and component styling to the current-chord panel to give it a polished, tactile feel. The panel should use soft card surfaces, subtle box shadows, and expressive typography that reinforces the musical context rather than feeling like a generic UI widget.

## Requirements

### Visual Design Requirements
- **Surface**: Use a card-like surface with rounded corners (`border-radius: 12px` or MUI Paper/Card with `elevation`)
- **Elevation**: Apply a subtle box shadow (MUI `elevation={2}` or equivalent) to lift the panel slightly off the background
- **Typography**:
  - Chord name: large, bold, musical — consider a serif or semi-bold sans-serif font
  - Secondary labels (root, quality): smaller, lighter weight
  - Font choices should feel "designed," not system-default
- **Color**: Panel background is a soft neutral (e.g., near-white or very light tint of the key color from ISSUE-24)
- **Spacing**: Generous internal padding; no cramped layout
- **Border**: Subtle border or none (let elevation do the work)

### Implementation Guidance
- If MUI is available in the project, use `Paper` or `Card` + `CardContent` components
- If MUI is not yet installed, use plain CSS with the described design values — do not add MUI as a dependency solely for this story without confirming with the team
- Typography styles should be defined as reusable CSS classes or styled components, not inline style strings scattered across JSX

### Constraints
- No changes to panel data or behavior — this story is purely visual/style
- Styling must not break existing functionality from ISSUE-28, ISSUE-29, ISSUE-30
- All interactive elements must retain accessible focus styles

## Acceptance Criteria
- [ ] The current-chord panel has a card-like surface with rounded corners and subtle elevation
- [ ] Typography for chord name is large, bold, and expressive
- [ ] Secondary labels use a smaller, lighter typographic treatment
- [ ] Internal padding is generous; no cramped layout
- [ ] Panel background uses a soft neutral or subtle tint
- [ ] All interactive elements retain accessible focus styling
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-28**: Explicit Chord Identity in Current-Chord Panel
- **ISSUE-29**: Stylized Geometric Thumbnail in Current-Chord Panel
- **ISSUE-30**: Directional Action Button in Current-Chord Panel
