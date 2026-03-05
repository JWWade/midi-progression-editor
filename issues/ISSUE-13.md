# ISSUE-13 — Frontend: Highlight Scale Degrees on the Chromatic Circle

## User Story

As a user, I want to **see which notes belong to the selected scale** (e.g., C major) so I can understand the harmonic context before choosing chords.

## Summary

Display which notes are part of the selected scale by visual highlighting (e.g., filled circles or brighter colors) on the chromatic circle nodes. This provides harmonic context: chords are built from scale notes, so highlighting them helps users understand why certain chord shapes exist.

## Requirements

### Data Requirements
- Create backend endpoint or hardcode scale definitions:
  ```ts
  const CMajorScale = [0, 2, 4, 5, 7, 9, 11];  // C, D, E, F, G, A, B
  const CMinorScale = [0, 2, 3, 5, 7, 8, 10]; // C, D, Eb, F, G, Ab, Bb
  ```
  
- Or extend existing `/Scale/from-root` endpoint to include note indices
  - Response: `{ notes: NoteInfo[], isScaleMember: boolean }[]`

### UI Controls
- Add a **scale selector dropdown** alongside the chord selector
  - Options: Major, Natural Minor, Harmonic Minor, Dorian, Phrygian, Lydian, Mixolydian, etc.
  - Initial state: Major
  - Label: "Scale"

### Visualization
- Update note node rendering in `ChromaticCircle.tsx`
  - Scale member notes: filled circle, solid color (e.g., #4F46E5)
  - Non-scale notes: outlined circle, lighter color (e.g., #D1D5DB)
  - Or: filled vs unfilled to indicate membership
  
- Keep existing chord polygon visible and overlaid on the circle

### Frontend Architecture
- Create `src/features/scale/types/scales.ts`
  - Define scale interval patterns: `{ major: [0, 2, 4, 5, 7, 9, 11], ... }`
  
- Create `src/features/scale/utils/scaleUtils.ts`
  - Export `getScaleNotes(rootIndex: number, scaleType: ScaleType): number[]`
  - Implement transposition logic (similar to chord transposition)
  
- Update `ChromaticCircle.tsx`:
  - Add state hook: `const [selectedScale, setSelectedScale] = useState<ScaleType>("major")`
  - Render scale selector
  - Calculate scale notes for current root
  - Update node rendering logic to check if note is in scale
  - Apply different styling based on membership

### Constraints
- Chord polygon still visible (no hiding)
- Scale highlighting independent of chord selection (both can be active)
- No animation on scale change (instant update)
- Static scale definitions (no custom scales yet)

## Acceptance Criteria
- [ ] Scale selector dropdown renders and is functional
- [ ] Selecting a scale updates the visualization
- [ ] Scale member notes are visually distinct from non-members
- [ ] Scale highlighting works with all chord types
- [ ] Changing root note updates scale highlights correctly
- [ ] Visual hierarchy: chord polygon in focus, scale highlights in background
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Implementation Notes

### Scale Interval Definitions
```ts
const ScaleIntervals = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10]
};
```

### Visual Feedback
Simple approach: node opacity or fill color
```tsx
const isInScale = scaleMemberIndices.includes(noteIndex);
const fill = isInScale ? "#4F46E5" : "#D1D5DB";
const opacity = isInScale ? 1 : 0.4;
```

### Transposition
Same pattern as chord transposition:
```ts
const transposedScale = scaleIntervals.map(interval => (interval + rootIndex) % 12);
```

## Related Issues
- **ISSUE-09**: Display C Major Chord as Triangle (foundational)
- **ISSUE-11**: Rotate Chord Shape Around Circle (scales also rotate)
- **ISSUE-14**: Show Chord Tones with Roles (labels over roots)

## Testing Checklist
- [ ] Scale selector functional with multiple scale types
- [ ] Scale member notes highlighted correctly
- [ ] Scale highlighting updates with root note change
- [ ] Visual distinction clear between members and non-members
- [ ] Chord polygon still visible alongside scale highlights
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied

