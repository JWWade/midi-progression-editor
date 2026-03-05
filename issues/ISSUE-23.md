# ISSUE-23 — Frontend: Show Interval Pattern Visually

## User Story

As a user, I want to see **interval distances** between vertices (e.g., major third, minor third) so I can understand the chord's internal spacing.

## Summary

Display the musical intervals between consecutive chord notes as labels or visual indicators on the polygon edges. This makes chord quality visible through interval information.

## Requirements

### Visual Elements
- Calculate intervals between consecutive chord notes
  - Root → Third: major (4) or minor (3) semitones
  - Third → Fifth: minor (3) or major (4) semitones
  - Fifth → Seventh (if applicable): major (4) or minor (3) semitones

- Render **interval labels** on or near polygon edges:
  - Place text at midpoint of each edge
  - Example: "M3" for major third, "m3" for minor third
  - Or: "4st" for 4 semitones, "3st" for 3 semitones
  
- Optional: Draw **arc or curve** along each edge with interval name

### Interval Naming
Standard music theory abbreviations:
```
m2 = minor second (1 semitone)
M2 = major second (2 semitones)
m3 = minor third (3 semitones)
M3 = major third (4 semitones)
P4 = perfect fourth (5 semitones)
A4/d5 = augmented fourth / diminished fifth (6 semitones)
P5 = perfect fifth (7 semitones)
m6/A5 = minor sixth / augmented fifth (8 semitones)
M6 = major sixth (9 semitones)
m7 = minor seventh (10 semitones)
M7 = major seventh (11 semitones)
```

### Data Requirements
- Map semitone count to interval name:
  ```ts
  const IntervalNames = {
    1: "m2",
    2: "M2",
    3: "m3",
    4: "M3",
    5: "P4",
    6: "A4/d5",
    7: "P5",
    8: "m6",
    9: "M6",
    10: "m7",
    11: "M7",
    12: "Octave"
  };
  ```

### Frontend Architecture
- Create `src/features/chord-intervals/utils/intervalNames.ts`
  - Export `getIntervalName(semitones: number): string`
  - Handles edge cases and wrapping

- Create `src/features/chord-intervals/components/IntervalLabel.tsx`
  - Props: `{ from: Point, to: Point, intervalName: string }`
  - Renders text label at edge midpoint
  
- Update `ChromaticCircle.tsx`:
  - Calculate intervals between consecutive chord notes
  - Render interval labels for each edge
  - Position labels cleaerly (offset from edge, good contrast)

### Constraints
- Static calculation (no animation)
- Simple text labels (no complex graphics)
- No interaction with labels (view-only)
- Works with all chord types

## Acceptance Criteria
- [ ] Interval labels render on chord polygon edges
- [ ] Interval names are musically correct
- [ ] Label positioning clear and readable
- [ ] Works with all chord types (triads, sevenths)
- [ ] Works with all root notes
- [ ] Label text contrasts with background
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Implementation Notes

### Interval Calculation
Given chord notes (sorted by index):
```ts
function getIntervals(noteIndices: number[]): number[] {
  const intervals = [];
  for (let i = 0; i < noteIndices.length - 1; i++) {
    const interval = (noteIndices[i + 1] - noteIndices[i] + 12) % 12;
    intervals.push(interval);
  }
  return intervals;
}
```

Note: Intervals are always positive (add 12 if negative, then modulo 12).

### Label Positioning
Place label at midpoint of edge, offset outward slightly:
```ts
const midX = (from.x + to.x) / 2;
const midY = (from.y + to.y) / 2;

// Offset outward from center
const centerX = circleCenter.x;
const centerY = circleCenter.y;
const direction = {
  x: midX - centerX,
  y: midY - centerY
};
const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
const labelX = midX + (direction.x / magnitude) * 10;
const labelY = midY + (direction.y / magnitude) * 10;
```

### SVG Text Styling
```tsx
<text
  x={labelX}
  y={labelY}
  fontSize="11"
  fontWeight="600"
  fill="#1F2937"
  textAnchor="middle"
  dominantBaseline="middle"
  background="white"  {/* Not SVG attr, may need background rect */}
>
  {intervalName}
</text>

{/* Optional: Background rectangle behind text */}
<rect
  x={labelX - 12}
  y={labelY - 8}
  width="24"
  height="16"
  fill="white"
  rx="2"
/>
```

### Wrapping Intervals
For sevenths chords, there's also an interval from the last note back to root (context-dependent):
- Option A: Show all edges (including wrap-around)
- Option B: Show only consecutive edges
- Recommend **Option A** for completeness

### Abbreviations
Keep abbreviations concise and standard:
- "M3" not "Major Third"
- "m7" not "Minor Seventh"
- Consider adding tooltip with full name on hover (future enhancement)

## Related Issues
- **ISSUE-22**: Show the Centroid of the Chord Shape (geometry-related)
- **ISSUE-20**: Show Multiple Shapes Layered (could show intervals for both)
- **ISSUE-07**: Connect Scale API to Chromatic Circle Feature (scale intervals could use similar display)

## Testing Checklist
- [ ] Interval labels render on all chord polygon edges
- [ ] Interval names match semitone counts
- [ ] Label positioning clear and readable
- [ ] Label text contrasts with background
- [ ] Works with all chord types (triads, sevenths)
- [ ] Works with all root notes
- [ ] No label overlap or collision
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied

