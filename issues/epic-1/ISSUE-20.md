# ISSUE-20 — Frontend: Show Multiple Shapes Layered (Triad + Seventh)

## User Story

As a user, I want to **see both the triad and the seventh** simultaneously (triangle + quadrilateral) so I can understand how chord extensions build on the base shape.

## Summary

Render two polygons on top of each other: the base triad (3-vertex) and the extended seventh (4-vertex). This shows visually how a seventh chord is built from a triad by adding one more note.

## Requirements

### Visual Requirements
- Display **two polygons simultaneously**:
  - Triad (3-vertex triangle): base color, solid line (e.g., #4F46E5, 2px)
  - Seventh (4-vertex quad): extended color, dashed line (e.g., #A855F7, 2px dashed)
  
- Z-order: Seventh behind triad (or both visible with transparency)
- Styling clearly distinguishes the two shapes

### UI Control
- Add **checkbox or toggle**:
  - Label: "Show Seventh" or "Show Extension"
  - Default: unchecked (triad only)
  - When checked: render both shapes

- Or: **Dropdown** to select display mode:
  - "Triad Only", "Seventh Only", "Both"
  - Recommend checkbox for simplicity

### Data Requirements
- Given a chord type (e.g., "Cm7"):
  - Extract base triad: Cm = [0, 3, 7]
  - Show full seventh: Cm7 = [0, 3, 7, 10]
  - Calculate "extension points": [7, 10] (or [10] if showing only new notes)

### Frontend Architecture
- Create utility function `getChordTriad(chordType: ChordType): number[]`
  - Returns base triad intervals for any chord
  - E.g., for "Cm7", returns [0, 3, 7]
  
- Update chord polygon rendering:
  - Render two `<polygon>` elements with different styling
  - One for triad, one for (full seventh or extension only)
  
- Update `ChromaticCircle.tsx`:
  - Add state: `const [showExtension, setShowExtension] = useState(false)`
  - Render toggle
  - Conditionally render second polygon

### Constraints
- Only works with seventh chords (triads have no extension to show)
- Triad + Seventh only (no deeper extensions like 9, 11, 13)
- No animation on toggle (instant show/hide)
- Simple styling differentiation (color and line style)

## Acceptance Criteria
- [ ] Toggle renders for enabling "Show Seventh"
- [ ] Both triad and seventh shapes render when toggle is on
- [ ] Triad points are correct subset of seventh points
- [ ] Visual distinction clear (different colors and/or line styles)
- [ ] Toggle properly shows/hides seventh shape
- [ ] Works with all seventh chord types (maj7, min7, dom7, halfdim7)
- [ ] Works with all root notes
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Implementation Notes

### Extracting Base Triad
From a full chord shape, extract the triad:
```ts
const SeventhChords = {
  maj7: { full: [0, 4, 7, 11], triad: [0, 4, 7] },
  min7: { full: [0, 3, 7, 10], triad: [0, 3, 7] },
  dom7: { full: [0, 4, 7, 10], triad: [0, 4, 7] },
  halfdim7: { full: [0, 3, 6, 10], triad: [0, 3, 6] }
};

function getTriadPoints(chordType: ChordType): number[] {
  return SeventhChords[chordType]?.triad || [];
}
```

### SVG Styling
```tsx
{/* Seventh (background) */}
<polygon
  points={seventhPoints.join(" ")}
  fill="rgba(168, 85, 247, 0.05)"
  stroke="#A855F7"
  strokeWidth="2"
  strokeDasharray="5,5"
/>

{/* Triad (foreground) */}
<polygon
  points={triadPoints.join(" ")}
  fill="rgba(79, 70, 229, 0.1)"
  stroke="#4F46E5"
  strokeWidth="2"
/>
```

### Z-Order Control
CSS `z-index` or SVG element order:
- Render seventh polygon first (background)
- Render triad polygon second (foreground)

### Label Enhancement
Optionally label the extension note:
- "Extra: B" or "+7: B"
- Highlight the 4th vertex differently

## Related Issues
- **ISSUE-12**: Display Seventh Chords as Quadrilaterals (foundational)
- **ISSUE-17**: Display Note Names at Chord Vertices (label enhancement)
- **ISSUE-15**: Show Polygon Shape Morphing Between Two Chords (morphing both)

## Testing Checklist
- [ ] Toggle control functional
- [ ] Both shapes render when enabled
- [ ] Triad shape is subset of seventh shape
- [ ] Visual distinction clear (colors and line styles)
- [ ] Works with all seventh chord types
- [ ] Works with all root notes
- [ ] Shapes update when chord changes (with toggle on)
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied

