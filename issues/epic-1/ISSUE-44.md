# ISSUE-44 — Frontend: Quality-Specific Chord Shapes (Triangles and Quadrilaterals)

## User Story

As a user, I want **different chord qualities to form different shapes (triangles, quadrilaterals)** so I can see harmonic differences visually.

## Summary

Extend the chord geometry visualization (ISSUE-43) so that different chord qualities produce distinctly shaped polygons on the circle. Triads produce triangles; seventh chords produce quadrilaterals. The shapes encode harmonic meaning through geometry.

## Requirements

### Shape Rules
| Chord Type         | Notes in Chord   | Shape          | Vertices |
|-------------------|-----------------|---------------|---------|
| Major triad        | Root, M3, P5    | Triangle       | 3       |
| Minor triad        | Root, m3, P5    | Triangle       | 3       |
| Diminished triad   | Root, m3, d5    | Triangle       | 3       |
| Augmented triad    | Root, M3, A5    | Triangle       | 3       |
| Dominant 7th       | Root, M3, P5, m7 | Quadrilateral | 4       |
| Major 7th          | Root, M3, P5, M7 | Quadrilateral | 4       |
| Minor 7th          | Root, m3, P5, m7 | Quadrilateral | 4       |

- The shape is automatically determined by the number of chord tones
- A toggle or selector allows switching between chord types in the UI (or the shape updates as the chord changes on the circle)

### Visual Differentiation
- Each quality maps to a distinct stroke color (using ISSUE-32 color grammar)
- The shape's fill uses a semi-transparent version of the quality color
- Triangles vs quadrilaterals are visually distinct — the extra vertex for 7th chords should be clearly visible

### Frontend Architecture
- Extend `src/features/chromatic-circle/utils/geometry.ts`:
  - The `calculatePolygonPoints` function already accepts a variable-length `noteIndices` array — no change needed
- Update chord data definitions to include seventh chord variants:
  ```ts
  const ChordShapes: Record<ChordType, number[]> = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
    dominant7: [0, 4, 7, 10],
    major7: [0, 4, 7, 11],
    minor7: [0, 3, 7, 10],
  };
  ```
- Update `ChromaticCircle.tsx` to render the polygon with the correct quality color and number of vertices

### Constraints
- The polygon rendering is the same SVG `<polygon>` element — only the number of points and color change
- No animation when switching chord types (instant update)
- Shapes must still scale correctly at all viewport sizes

## Acceptance Criteria
- [ ] Triads render as triangles (3 vertices)
- [ ] Seventh chords render as quadrilaterals (4 vertices)
- [ ] Each quality uses its correct quality color (ISSUE-32)
- [ ] Shapes update immediately when the chord type changes
- [ ] All shapes scale correctly with the circle
- [ ] Visual difference between qualities is clear and immediate
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-43**: Chord Geometry Visualization — Triangle for C–E–G (prerequisite)
- **ISSUE-45**: Stylized Geometry with Color Fills and Gradients
- **ISSUE-32**: Quality-based Color Groups (color source)
- **ISSUE-26**: Chord-tone Emphasis with Expressive Color
