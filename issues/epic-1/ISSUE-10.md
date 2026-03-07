# ISSUE-10 — Frontend: Toggle Between Major and Minor Chord Shapes

## User Story

As a user, I want to **toggle between C major and C minor** and immediately see how the triangle changes shape, so I can visually compare chord qualities.

## Summary

Add UI controls to switch between C major (C–E–G) and C minor (C–Eb–G) chords on the chromatic circle. This demonstrates how a single quality change (major vs minor) produces a different geometric shape.

## Requirements

### UI Controls
- Add a simple **toggle button** or **button group** above/below the chromatic circle
  - Options: "Major" and "Minor"
  - Example: `<button>Major</button> <button>Minor</button>` (selected state styling)
  - Initial state: Major
  
- Alternative UX: **Radio buttons** or **segmented control** if more professional appearance desired

### Data Requirements
- Define both chord shapes:
  ```ts
  const CMajorChord = [
    { index: 0, name: "C", role: "root" },
    { index: 4, name: "E", role: "third" },
    { index: 7, name: "G", role: "fifth" }
  ];
  
  const CMinorChord = [
    { index: 0, name: "C", role: "root" },
    { index: 3, name: "Eb", role: "third" },
    { index: 7, name: "G", role: "fifth" }
  ];
  ```

- Store selected chord type in local state (`useState("major" | "minor")`)

### Frontend Architecture
- Update `ChromaticCircle.tsx`:
  - Add state hook for chord quality: `const [quality, setQuality] = useState<"major" | "minor">("major")`
  - Conditionally select chord data based on state
  - Render toggle buttons
  - Pass chord data to triangle rendering function
  
- Update `src/features/chord/` module:
  - Create `src/features/chord/types/chords.ts` with chord definitions
  - Export `getMajorChord(root: Note)` and `getMinorChord(root: Note)` helper functions
  - For now, hardcode the intervals (major: [0, 4, 7], minor: [0, 3, 7])

### Constraints
- Still hardcoded to root note C (no rotation yet)
- No animation on toggle (instant update)
- No backend dependency (hardcoded values sufficient)
- Toggle is simple styling, not a complex component library

## Acceptance Criteria
- [ ] Toggle buttons render above the chromatic circle
- [ ] Clicking "Major" displays C major triangle (C–E–G)
- [ ] Clicking "Minor" displays C minor triangle (C–Eb–G)
- [ ] Triangle updates immediately when toggled (no delay)
- [ ] Visual difference between major and minor shapes is obvious (E vs Eb position)
- [ ] Button styling indicates which chord quality is active (e.g., filled vs outlined)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
- [ ] Responsive on different viewport sizes

## Implementation Notes

### Chord Intervals
- **Major triad**: Root (0), Major 3rd (+4 semitones), Perfect 5th (+7 semitones)
- **Minor triad**: Root (0), Minor 3rd (+3 semitones), Perfect 5th (+7 semitones)

The difference: E (index 4) vs Eb (index 3) as the third.

### Button State Styling
Simple approach:
```tsx
<button 
  onClick={() => setQuality("major")}
  style={quality === "major" ? { fontWeight: "bold", backgroundColor: "#4F46E5", color: "white" } : {}}
>
  Major
</button>
```

Or use CSS classes if available.

### Geometry Stability
The triangle should smoothly update; if vertices move, ensure smooth calculation (no jittering).

## Related Issues
- **ISSUE-09**: Display C Major Chord as Triangle (prerequisite)
- **ISSUE-11**: Rotate Chord Shape Around Circle (extends this)
- **ISSUE-12**: Show Quadrilaterals for Seventh Chords (related)

## Testing Checklist
- [ ] Both major and minor triangles render correctly
- [ ] Toggle buttons work without console errors
- [ ] Visual difference is clear between the two chord shapes
- [ ] Lint passes
- [ ] No TypeScript errors
- [ ] Component responsive on mobile/desktop

