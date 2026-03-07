# ISSUE-09 — Frontend: Display C Major Chord as Triangle on Chromatic Circle

## User Story

As a user, I want to **see the triangle formed by the notes of a C major chord** on the chromatic circle so that I can visually understand the chord's geometric identity.

## Summary

Render a visual triangle connecting the three notes of a C major chord (C, E, G) on the chromatic circle. This is the foundational story for all geometric chord visualization work.

## Requirements

### Visual Requirements
- Display a triangle (SVG polygon) with vertices at the positions of C (root), E (major third), and G (perfect fifth) on the chromatic circle
- The triangle should be:
  - **Outlined** with a 2px stroke (color: e.g., `#4F46E5` for indigo)
  - **Filled** with semi-transparent fill (e.g., `rgba(79, 70, 229, 0.1)`)
  - **Responsive** to the circle's radius and scaling

### Data Requirements
- Create a backend endpoint (or extend existing `/Scale/from-root`) to return **chord tone information**
  - At minimum, for C major: indices [0, 4, 7] (C, E, G in semitones from C)
  - Could be a new endpoint: `POST /Chord/notes` with `{ root: Note, chordType: "major" }`
  - Return format: `{ notes: NoteInfo[] }` where `NoteInfo` includes index, name, and role (root, third, fifth)

- Or hardcode the chord tones in the frontend:
  ```ts
  const CMajorChord = [
    { index: 0, name: "C", role: "root" },
    { index: 4, name: "E", role: "third" },
    { index: 7, name: "G", role: "fifth" }
  ];
  ```

### Frontend Architecture
- Create `src/features/chord/api/getChordNotes.ts` (or extend scale feature)
  - Function: `getChordNotes(root: Note, chordType: ChordType): Promise<NoteInfo[]>`
  - For this issue: hardcode C major or fetch from new backend endpoint
  
- Create `src/features/chromatic-circle/utils/geometry.ts`
  - Function: `calculatePolygonPoints(circleRadius: number, noteIndices: number[]): Point[]`
  - Maps note indices (0-11) to SVG polygon coordinates on the circle
  
- Update `ChromaticCircle.tsx`
  - Integrate chord data via a new hook or prop
  - Render the triangle as an SVG `<polygon>` element inside the circle
  - Position the triangle behind/in-front of the note nodes (z-order decision)

### Constraints
- No interactivity yet (no hover, no click handlers on the triangle)
- No animation on initial render
- Single hardcoded chord (C major)
- No dropdown or chord selection UI yet
- Triangle must scale correctly with the circle's responsive sizing

## Acceptance Criteria
- [ ] C major chord triangle renders visually on the chromatic circle
- [ ] Triangle vertices align with the C, E, and G notes on the circle
- [ ] Triangle styling is visually distinct (outline + semi-transparent fill)
- [ ] The triangle persists when the component re-renders
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode is satisfied
- [ ] The circle and triangle resize together on viewport changes (responsive)

## Implementation Notes

### Geometry Calculation
The chromatic circle typically uses 12 evenly-spaced points around a circle. For note index `i` (0-11):
```
angle = (i / 12) * 2π    # radians from 0 (top)
x = cx + radius * sin(angle)
y = cy - radius * cos(angle)
```

Where `(cx, cy)` is the circle's center.

### SVG Structure
```tsx
<svg ...>
  <circle ... />  {/* The chromatic circle */}
  <polygon points="x1,y1 x2,y2 x3,y3" ... />  {/* C major triangle */}
  {/* Note nodes (C, C#, D, ...) */}
</svg>
```

### Backend Considerations
- Option A: Hardcode chord tones in frontend (simpler for now)
- Option B: Create new endpoint `POST /Chord/notes` with `{ root: Note, chordType: ChordType }` (more flexible for future stories)
- Decide based on complexity budget; recommend Option A for this sprint.

## Related Issues
- **ISSUE-08**: Display Scale Notes on Chromatic Circle (foundational)
- **ISSUE-10**: Compare Major vs Minor Triangles (next)
- **ISSUE-11**: Rotate Chord Shape Around Circle (related)

## Testing Checklist
- [ ] Component renders without console errors
- [ ] Triangle appears at correct visual location
- [ ] Circle and triangle are proportional at different viewport sizes
- [ ] Lint passes
- [ ] No TypeScript errors in strict mode
