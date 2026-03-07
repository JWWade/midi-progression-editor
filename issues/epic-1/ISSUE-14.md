# ISSUE-14 — Frontend: Show Voice-Leading Paths Between Two Chords

## User Story

As a user, I want to **select two chords** and see lines connecting their notes so I can visually understand how the voices move.

## Summary

Enable selection of two chords (A and B), then render lines connecting corresponding notes (voice leads) between the two chord shapes. This visualizes smooth voice leading, a core concept in harmonic movement.

## Requirements

### UI Controls
- Add **two chord selectors** on the page:
  - "From Chord": Root note, Chord Type (e.g., C Major)
  - "To Chord": Root note, Chord Type (e.g., F Major)
  - Or: Single dropdown pairs + radio buttons to select starting vs ending chord
  
- Add a **toggle:** "Show Voice Leads" (on/off)
- Show comparison information:
  - `From: C Major (C, E, G)` → `To: F Major (F, A, C)`

### Data Requirements
- Represent two chords in state:
  ```ts
  const [fromChord, setFromChord] = useState({ root: "C", type: "major" });
  const [toChord, setToChord] = useState({ root: "F", type: "major" });
  ```

- Compute the two sets of note indices (transposed)

### Visualization
- Render **voice lead lines** on the SVG:
  - Connect each note of the first chord to the corresponding note of the second chord
  - For triads: 3 lines connecting Root→Root, Third→Third, Fifth→Fifth
  - For seventh chords: 4 lines
  - Styling:
    - Color: Light gray initially (e.g., #D1D5DB)
    - On hover: Highlight individual lines (color + thicker stroke)
    - Thickness: 2px for visibility

### Frontend Architecture
- Create new feature or extend existing chord feature:
  - `src/features/voice-leading/` (or extend `src/features/chord/`)
  
- Create `src/features/voice-leading/utils/voiceLeading.ts`
  - Export `calculateVoiceLeads(fromChord: NoteInfo[], toChord: NoteInfo[]): VoiceLead[]`
  - `VoiceLead` type: `{ fromNote: NoteInfo, toNote: NoteInfo, from: Point, to: Point }`
  - Assumes chords have same number of notes in same order (triads→triads, seventh→seventh)
  
- Update `ChromaticCircle.tsx` or create new `ChromaticCircleWithVoiceLeads.tsx`:
  - Add selectors for both chords
  - Render both chord triangles (or quads) on the circle
  - Render voice lead lines connecting corresponding vertices
  - Add interactive feedback on hover

### Constraints
- Simple 1-to-1 note correspondence (no voice doubling or inversion logic yet)
- Lines connect notes in the same position within their respective chords
- No path optimization or "best voice leading" algorithm
- No animation on chord change (instant update)
- Both chords must have same chord type (both triads or both sevenths) for simplicity

## Acceptance Criteria
- [ ] Two chord selectors render and are independent
- [ ] Both chord shapes visible on the chromatic circle
- [ ] Voice lead lines connect corresponding notes (Root→Root, etc.)
- [ ] Visual distinction between the two chords (e.g., different colors)
- [ ] Hovering over a line highlights it (color change or thickness increase)
- [ ] Toggling voice lead visibility works
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
- [ ] Works with all chord types (major, minor, sevenths)

## Implementation Notes

### Voice Lead Calculation
Given two chords with same number of notes in same order:
```ts
const voiceLeads = fromChord.map((note, i) => ({
  from: calculatePoint(circleRadius, note.index),
  to: calculatePoint(circleRadius, toChord[i].index),
  fromNote: note,
  toNote: toChord[i]
}));
```

### SVG Rendering
```tsx
{voiceLeads.map((lead, i) => (
  <line
    key={i}
    x1={lead.from.x} y1={lead.from.y}
    x2={lead.to.x} y2={lead.to.y}
    stroke="#D1D5DB"
    strokeWidth="2"
    onMouseEnter={() => /* highlight */}
    onMouseLeave={() => /* reset */}
  />
))}
```

### UI Layout
Consider placing the two chord selectors horizontally side-by-side with an arrow (→) between them to indicate direction of motion.

## Related Issues
- **ISSUE-11**: Rotate Chord Shape Around Circle (prerequisite)
- **ISSUE-12**: Display Seventh Chords as Quadrilaterals (works with sevenths)
- **ISSUE-16**: Show Shape Morphing Between Chords (animation version)

## Testing Checklist
- [ ] Both chord selectors functional
- [ ] Voice lead lines render at correct positions
- [ ] Hover interactivity works on lines
- [ ] Works with triads and seventh chords
- [ ] Visual hierarchy clear (both chords visible)
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied

