# ISSUE-11 — Frontend: Rotate Chord Shape Around the Chromatic Circle

## User Story

As a user, I want to **rotate the triangle around the chromatic circle** (e.g., C major → C# major → D major) so I can see how the same chord quality maps to different roots.

## Summary

Extend chord visualization to support any root note, not just C. Add a dropdown or pitch selector to choose the root note, then watch the triangle rotate around the circle. This demonstrates chord invariance: the shape stays the same, only the starting position changes.

## Requirements

### UI Controls
- Add a **dropdown or segmented control** showing all 12 pitch classes
  - Options: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
  - Initial selection: C
  - Label: "Root Note" or "Transpose"

### Data Requirements
- Create helper functions to transpose chords:
  ```ts
  function transposeChord(baseChord: NoteInfo[], rootIndex: number): NoteInfo[] {
    return baseChord.map(note => ({
      ...note,
      index: (note.index + rootIndex) % 12
    }));
  }
  ```

- Chord definitions remain interval-based (e.g., major triad = [0, 4, 7])
- Apply root transposition to those intervals

### Frontend Architecture
- Update `ChromaticCircle.tsx`:
  - Add state hook: `const [rootNote, setRootNote] = useState<Note>("C")`
  - Render root note selector (dropdown or radio buttons)
  - Calculate current chord by transposing base intervals
  - Pass transposed chord to triangle rendering
  
- Create `src/features/chord/utils/transpose.ts`:
  - Export `transposeChord(baseIntervals: number[], rootIndex: number): NoteInfo[]`
  - Handles modulo arithmetic correctly

### Constraints
- Chord quality (major vs minor) remains toggleable alongside root selection
- No backend API call needed (pure frontend transposition)
- No animation during rotation yet (instant update)
- Must handle accidentals correctly (# and b display names)

## Acceptance Criteria
- [ ] Root note dropdown/selector renders and is functional
- [ ] Selecting a new root note immediately rotates the triangle
- [ ] All 12 roots display the same chord shape, correctly positioned
- [ ] Triangle shape is visually invariant across rotations (only position changes)
- [ ] Major/Minor toggle still works after rotation
- [ ] Note names displayed over the circle reflect the current root (if applicable)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Implementation Notes

### Transposition Logic
Base chord intervals (always starting from index 0):
```ts
const MajorTriad = [0, 4, 7];
const MinorTriad = [0, 3, 7];
```

When user selects root note with index `r` (0-11):
```ts
const transposed = baseChord.map(interval => (interval + r) % 12);
```

### Note Display Names
Ensure the display names update after transposition:
- C=0, C#=1, D=2, D#=3, E=4, F=5, F#=6, G=7, G#=8, A=9, A#=10, B=11

Or use enharmonic equivalents if desired (e.g., Db instead of C#).

### UI Polish
- Consider grouping natural vs accidental notes visually
- Or use a circular selector that maps to the chromatic circle itself (future enhancement)

## Related Issues
- **ISSUE-10**: Toggle Between Major and Minor Chord Shapes (prerequisite)
- **ISSUE-09**: Display C Major Chord as Triangle (foundational)
- **ISSUE-13**: Animate Shape When Chord Changes (enhancement)

## Testing Checklist
- [ ] All 12 root notes selectable
- [ ] Triangle rotates correctly for each root
- [ ] Triangle shape (set of intervals) remains consistent
- [ ] Major/Minor toggle independently functional with root selection
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied
