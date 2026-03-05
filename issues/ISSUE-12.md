# ISSUE-12 — Frontend: Display Seventh Chords as Quadrilaterals

## User Story

As a user, I want to **see a four-sided polygon** when I select a seventh chord (e.g., Cmaj7, Cm7, C7, Cø7) so I can understand how chord extensions change the geometry.

## Summary

Extend chord types beyond triads to include seventh chords. Render 4-vertex polygons on the chromatic circle for different seventh chord qualities. This demonstrates how chord extensions add dimensions to the geometric space.

## Requirements

### Chord Types
Define seventh chord definitions with 4 intervals each:
```ts
const CMaj7Chord = [0, 4, 7, 11];      // C, E, G, B
const CMin7Chord = [0, 3, 7, 10];      // C, Eb, G, Bb
const CDom7Chord = [0, 4, 7, 10];      // C, E, G, Bb
const CHalfDim7Chord = [0, 3, 6, 10];  // C, Eb, Gb, Bb
```

### UI Controls
- Extend the chord type selector to include seventh chord options
  - Example: Dropdown with categories:
    - Triad: Major, Minor
    - Seventh: Maj7, Min7, Dom7, HalfDim7
  - Or: Separate dropdowns for base (Triad/Seventh) and quality
  
### Visualization
- Render **quadrilaterals** (4-vertex SVG polygons) for seventh chords
- Style differently from triads (e.g., different color, dashed outline)
  - Triads: solid outline, indigo (#4F46E5)
  - Sevenths: dashed outline, purple (#A855F7)
  - Or: darker fill for sevenths

### Frontend Architecture
- Update chord definitions in `src/features/chord/types/chords.ts`
  - Add seventh chord constants
  - Define `ChordType = "major" | "minor" | "maj7" | "min7" | "dom7" | "halfdim7"`
  
- Update `ChromaticCircle.tsx` or create `ChordSelector.tsx`
  - Extend chord type selector UI
  - Calculate and render appropriate polygon (3 or 4 vertices)
  
- Update polygon rendering logic:
  - `calculatePolygonPoints()` should handle variable vertex counts
  - Styling logic should check chord type for stroke style (solid vs dashed)

### Constraints
- Still hardcoded chord definitions (no backend)
- Single root note selector (same as ISSUE-11)
- Major/Minor toggle becomes a chord type selector
- No animation between triad and seventh (instant update)

## Acceptance Criteria
- [ ] Seventh chord options appear in chord type selector
- [ ] Selecting Maj7, Min7, Dom7, or HalfDim7 renders a quadrilateral
- [ ] Quadrilateral vertices are at correct positions (transposed correctly)
- [ ] Seventh chords have visually distinct styling from triads
- [ ] Transposition/root rotation works with seventh chords
- [ ] Can toggle between related chords (e.g., Major → Maj7)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
- [ ] All 12 roots work with each chord type

## Implementation Notes

### Seventh Chord Intervals
- **Maj7**: [0, 4, 7, 11] — major triad + major 7th
- **Min7**: [0, 3, 7, 10] — minor triad + minor 7th
- **Dom7**: [0, 4, 7, 10] — major triad + minor 7th
- **HalfDim7**: [0, 3, 6, 10] — diminished triad + minor 7th

### Visual Differentiation
Option A: Different stroke styles
```tsx
const strokeDasharray = isSeventhChord ? "5,5" : "none";
```

Option B: Different colors
```tsx
const stroke = isSeventhChord ? "#A855F7" : "#4F46E5";
```

Option C: Combination of both

### Geometric Properties
Seventh chords create quadrilaterals with interesting properties:
- Some are parallelograms (Dom7, Maj7)
- Some are trapezoids (Min7)
- Some are irregular (HalfDim7)

Documenting these properties could be a future enhancement.

## Related Issues
- **ISSUE-11**: Rotate Chord Shape Around Circle (prerequisite)
- **ISSUE-15**: Show Interval Pattern Visually (related)
- **ISSUE-13**: Animate Shape When Chord Changes (enhancement)

## Testing Checklist
- [ ] Each seventh chord type renders a quadrilateral
- [ ] Visual styling distinguishes sevenths from triads
- [ ] All 12 roots work with each seventh chord type
- [ ] Transposition calculation correct for all 4 vertices
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied
- [ ] Quadrilaterals render in correct z-order with circle

