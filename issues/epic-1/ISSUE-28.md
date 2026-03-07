# ISSUE-28 — Frontend: Explicit Chord Identity in the Current-Chord Panel

## User Story

As a user, I want **the currently constructed chord to be displayed clearly in a dedicated panel** so I always know what I'm about to add to the progression.

## Summary

Add a "current-chord panel" UI component that clearly displays the name and identity of the chord the user has built on the chromatic circle. This panel acts as a confirmation area before the chord is sent to the progression sidebar.

## Requirements

### Visual Requirements
- A dedicated panel (card or section) sits between the chromatic circle and the progression sidebar
- The panel prominently displays:
  - **Chord name** (e.g., "C Major", "F# Minor 7", "Bb Diminished")
  - **Root note** and **chord quality** as distinct typographic elements
- The panel should be clearly labeled or visually differentiated from surrounding UI
- When no chord is selected or constructed, the panel displays a neutral placeholder (e.g., "No chord selected")

### Data Requirements
- The panel consumes the currently active chord from shared state (or a prop)
- Chord data includes at minimum: `root: Note`, `quality: ChordQuality`, `extensions?: string[]`
- Chord name formatting logic:
  - `C + Major → "C Major"`
  - `F# + Minor + 7 → "F#m7"`
  - Use a helper function for consistent formatting across the app

### Frontend Architecture
- Create `src/features/current-chord/components/CurrentChordPanel.tsx`
  - Accepts props: `chord: Chord | null`
  - Renders the chord name prominently
  - Renders a placeholder when `chord` is null
- Create `src/features/current-chord/utils/chordName.ts`
  - Export `formatChordName(chord: Chord): string`
- Integrate `CurrentChordPanel` into the main layout (e.g., `App.tsx` or a layout component)

### Constraints
- Panel is display-only in this story (no interactive elements beyond the send button, which is ISSUE-30)
- Chord name must update reactively as the chord changes on the circle
- No hardcoded chord name strings in the component — always use `formatChordName`

## Acceptance Criteria
- [ ] A dedicated current-chord panel renders in the UI
- [ ] The panel displays the current chord's name clearly
- [ ] The panel updates immediately as the chord changes on the circle
- [ ] A placeholder is shown when no chord is constructed
- [ ] Chord name formatting is consistent and musically correct
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-29**: Stylized Geometric Thumbnail in Current-Chord Panel
- **ISSUE-30**: Directional Action Button in Current-Chord Panel
- **ISSUE-31**: Material-UI Expressiveness for Current-Chord Panel
- **ISSUE-40**: Add-to-Progression Flow
