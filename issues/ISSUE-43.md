# ISSUE-43 — Frontend: Chord Geometry Visualization (Triangle for C–E–G)

## User Story

As a user, I want **the triangle formed by C–E–G (C major) to appear on the circle** so I can understand the chord's geometric identity.

## Summary

Render the geometric shape of the C major chord (C–E–G) as a triangle on the chromatic circle. The vertices of the triangle sit at the positions of the three notes on the circle. This is the foundational geometry story for all chord shape work.

## Requirements

### Visual Requirements
- A triangle (SVG `<polygon>`) connects the positions of C (index 0), E (index 4), and G (index 7) on the chromatic circle
- The triangle is:
  - **Outlined** with a visible stroke (e.g., `#4F46E5` indigo, 2px)
  - **Filled** with a semi-transparent quality color (e.g., `rgba(79, 70, 229, 0.1)`)
  - **Responsive**: scales with the circle's radius at all viewport sizes
- The triangle renders behind the note nodes (lower z-order in SVG)

### Data Requirements
- Chord tone indices for C major: `[0, 4, 7]`
- These may be hardcoded for this foundational story or derived from chord utilities
- Geometry calculation maps note indices to SVG coordinates:
  ```
  angle = (index / 12) * 2π   (0 = top, clockwise)
  x = cx + radius * sin(angle)
  y = cy - radius * cos(angle)
  ```

### Frontend Architecture
- Create `src/features/chromatic-circle/utils/geometry.ts` (if not already created in ISSUE-09)
  - Export `calculatePolygonPoints(circleRadius: number, noteIndices: number[], cx: number, cy: number): Point[]`
- Update `ChromaticCircle.tsx` to render an SVG `<polygon>` using the calculated points
- Polygon is positioned in SVG z-order behind note nodes

### Constraints
- No interactivity on the triangle (no hover/click)
- No animation on initial render
- Single hardcoded chord (C major) for this story
- No chord selection UI in this story (see ISSUE-44 for multiple qualities)

## Acceptance Criteria
- [ ] A triangle renders on the chromatic circle connecting C, E, and G
- [ ] Triangle vertices align precisely with the note positions on the circle
- [ ] Triangle has a visible stroke and semi-transparent fill
- [ ] Triangle scales correctly with the circle at all viewport sizes
- [ ] Triangle renders behind note nodes (correct z-order)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Implementation Notes

### SVG Structure
```tsx
<svg>
  <circle ... />           {/* The ring */}
  <polygon points="..." /> {/* Chord triangle — behind notes */}
  {/* Note nodes (C, C#, D, ...) */}
</svg>
```

### Geometry Formula
For note at index `i` (0–11) on a circle of radius `r` centered at `(cx, cy)`:
```
x = cx + r * sin((i / 12) * 2π)
y = cy - r * cos((i / 12) * 2π)
```

## Related Issues
- **ISSUE-09**: Display C Major Chord as Triangle (earlier iteration — reconcile or supersede)
- **ISSUE-44**: Quality-specific Chord Shapes (extends this)
- **ISSUE-45**: Stylized Geometry with Color Fills and Gradients
- **ISSUE-26**: Chord-tone Emphasis with Expressive Color
