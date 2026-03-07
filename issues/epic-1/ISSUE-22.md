# ISSUE-22 — Frontend: Show the Centroid of the Chord Shape

## User Story

As a user, I want to see a **center point** representing the chord's geometric center so I can compare how "balanced" different chords are.

## Summary

Calculate and display the geometric centroid of the chord polygon. Different chords have different centroids, which provides a visual proxy for harmonic "weight" or "balance." This helps users intuit harmonic stability.

## Requirements

### Visualization
- Calculate the **centroid** (center of mass) of the chord polygon
  ```ts
  centroid = average of all vertex coordinates
  ```
  
- Render a **visual marker** at the centroid:
  - Small circle (radius 4-6px)
  - Color: e.g., #EF4444 (red), or use chord color
  - Style: solid fill, no stroke (or thin outline)
  - Label (optional): "Center" or no label

- Optional: Render a subtle **crosshair** or **crossdot** at centroid

### Data Calculation
```ts
function calculateCentroid(points: Point[]): Point {
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  return {
    x: sumX / points.length,
    y: sumY / points.length
  };
}
```

### Frontend Architecture
- Create `src/features/chord-geometry/utils/centroid.ts`
  - Export `calculateCentroid(points: Point[]): Point`
  
- Update chord polygon rendering in `ChromaticCircle.tsx`:
  - Calculate centroid for current chord
  - Render centroid marker as SVG `<circle>`
  
- Optional: Add toggle to show/hide centroid

### Constraints
- Static calculation (no animation toward centroid)
- Simple circle marker (no complex glyphs)
- No interaction with centroid (view-only)
- Optional visual label or legend

## Acceptance Criteria
- [ ] Centroid marker renders at correct position
- [ ] Marker position mirrors polygon shape changes
- [ ] Visual distinction of marker (color, size)
- [ ] Works with all chord types (triads, sevenths)
- [ ] Works with all root notes
- [ ] Centroid calculation mathematically correct
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Implementation Notes

### Centroid Polygon Property
The centroid is the geometric center of gravity of the polygon:
```ts
const centroid = {
  x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
  y: points.reduce((sum, p) => sum + p.y, 0) / points.length
};
```

For a regular polygon (equilateral triangle, square), the centroid is at the geometric center.

### Visual Design
Simple marker:
```tsx
<circle
  cx={centroid.x}
  cy={centroid.y}
  r="5"
  fill="#EF4444"
  opacity="0.7"
/>
```

Or with crosshair:
```tsx
<g>
  <circle cx={centroid.x} cy={centroid.y} r="3" fill="#EF4444" />
  <line
    x1={centroid.x - 8} y1={centroid.y}
    x2={centroid.x + 8} y2={centroid.y}
    stroke="#EF4444" strokeWidth="1" opacity="0.5"
  />
  <line
    x1={centroid.x} y1={centroid.y - 8}
    x2={centroid.x} y2={centroid.y + 8}
    stroke="#EF4444" strokeWidth="1" opacity="0.5"
  />
</g>
```

### Interpretation
- Major/Minor triads: Centroid close to the circle center (balanced)
- Seventh chords: Centroid may shift toward the seventh note (more weight on extension)
- Root position vs inversions: Different centroids (good teaching tool)

### Legend/Explanation
Optional: Add text or tooltip explaining:
- "Red dot = Chord centroid (center of gravity)"
- Link to music theory concept of chord quality/weight

## Related Issues
- **ISSUE-09**: Display C Major Chord as Triangle (foundational polygon)
- **ISSUE-20**: Show Multiple Shapes Layered (both could have centroids)
- **ISSUE-23**: Show Interval Pattern Visually (geometry-related)

## Testing Checklist
- [ ] Centroid calculation correct for known shapes
- [ ] Marker renders at correct position
- [ ] Centroid updates when chord changes
- [ ] Works with all chord types
- [ ] Visual marker clearly visible
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied
- [ ] Centroid position makes harmonic sense

