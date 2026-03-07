# ISSUE-30 — Frontend: Directional Action Button in the Current-Chord Panel

## User Story

As a user, I want **a button that visually points toward the progression sidebar** so I understand that I'm "sending" the chord from the circle into the progression.

## Summary

The current-chord panel (ISSUE-28) should contain a clear call-to-action button that adds the current chord to the progression sidebar. The button's design should visually indicate directionality — pointing right toward the sidebar — reinforcing the left-to-right workflow of: circle → panel → sidebar.

## Requirements

### Visual Requirements
- The button is positioned in the current-chord panel, visually oriented toward the progression sidebar (right side)
- The button uses a directional icon or arrow pointing right (e.g., `→`, `▶`, or an icon from a UI library)
- The button is large enough to be a comfortable tap target (minimum 44×44 px)
- The button is visually distinct (e.g., filled, elevated) to invite interaction
- When no chord is constructed, the button is **disabled** (and visually dimmed)

### Behavior Requirements
- Clicking/tapping the button dispatches the "add chord to progression" action
- After the chord is added, the circle resets or clears the current chord (UX decision — document in implementation)
- The button provides visual feedback on click (e.g., brief scale animation or ripple)

### Frontend Architecture
- Update `CurrentChordPanel.tsx` to include the add button
  - Props or callback: `onAddChord: () => void`
  - Disabled state when `chord` is null
- The button triggers the progression state update (see ISSUE-40 for the full flow)
- Use a `<button>` element or MUI `Button` component with an arrow icon

### Constraints
- The button must be keyboard-accessible (focusable, activatable with Enter/Space)
- Disabled state must be properly communicated to screen readers (`aria-disabled`)
- Visual arrow direction should always point toward the sidebar regardless of layout changes

## Acceptance Criteria
- [ ] The directional action button renders in the current-chord panel
- [ ] The button visually points toward the progression sidebar (arrow or icon)
- [ ] Clicking the button adds the current chord to the progression
- [ ] The button is disabled and dimmed when no chord is active
- [ ] The button is keyboard-accessible
- [ ] Disabled state is communicated to assistive technology
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-28**: Explicit Chord Identity in Current-Chord Panel (parent)
- **ISSUE-40**: Add-to-Progression Flow (full interaction flow)
- **ISSUE-41**: Visual Confirmation When Chord is Added
