# ISSUE-40 — Frontend: Add-to-Progression Flow (Circle → Panel → Sidebar)

## User Story

As a user, I want to **shape a chord on the circle, confirm it in the current-chord panel, and send it to the progression with a single action** so the workflow feels fluid.

## Summary

Wire together the three-step interaction flow: (1) the user builds a chord by interacting with the chromatic circle, (2) the current-chord panel displays the constructed chord for confirmation, and (3) the user presses the directional action button to add the chord to the progression sidebar. This is the core interaction loop of the application.

## Requirements

### Interaction Flow
1. **Build**: User selects/builds a chord on the chromatic circle → the current-chord panel updates to show the chord (ISSUE-28)
2. **Confirm**: User reviews the chord name and thumbnail in the panel
3. **Send**: User clicks the directional action button (ISSUE-30) → chord is appended to the progression (ISSUE-39) → panel clears or resets ready for the next chord

### State Transitions
- Circle state: tracks the chord currently being built (`currentChord: Chord | null`)
- On "add": `useProgression.addChord(currentChord)` is called
- After adding: `currentChord` resets to `null` (or stays, UX decision — document clearly)
- If progression is full (ISSUE-38): the add button is disabled; the action is blocked

### Frontend Architecture
- The `currentChord` state may live in `App.tsx` or a shared context
- `ChromaticCircle` updates `currentChord` as the user interacts
- `CurrentChordPanel` reads `currentChord` and calls `addChord` on button press
- `ProgressionSidebar` reads the progression array from `useProgression`
- Data flow is unidirectional: circle → shared state → panel + sidebar

### Constraints
- The flow must feel fast — no loading states or network calls in the add action
- "Add" should not duplicate the same chord if accidentally double-clicked (consider debounce or button disable-on-click)
- State management must be typed end-to-end with TypeScript

## Acceptance Criteria
- [ ] Building a chord on the circle updates the current-chord panel
- [ ] Clicking the add button appends the chord to the progression
- [ ] The panel resets (or stays, as documented) after adding
- [ ] The progression sidebar reflects the new chord immediately
- [ ] Double-clicking the add button does not create duplicate entries
- [ ] The flow is blocked gracefully when the progression is full
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-28**: Explicit Chord Identity in Current-Chord Panel
- **ISSUE-30**: Directional Action Button in Current-Chord Panel
- **ISSUE-35**: Right-hand Vertical Progression Sidebar
- **ISSUE-38**: Finite Progression Length
- **ISSUE-39**: Session-only Persistence for Progression
- **ISSUE-41**: Visual Confirmation When Chord is Added
