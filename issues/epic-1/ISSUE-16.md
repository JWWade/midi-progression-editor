# ISSUE-16 — Frontend: Add Chord Selector Dropdown (Simple UX Entry Point)

## User Story

As a user, I want to **pick a chord name** (C, Cm, C7, etc.) and immediately see the corresponding shape on the circle so I can explore harmony visually.

## Summary

Provide a formatted chord name selector that makes it easy to browse pre-defined chords. Instead of separate root/quality dropdowns, users can select "C Major", "C Minor", "Cmaj7", etc. from a single list. This is a more intuitive entry point than abstract controls.

## Requirements

### Chord Naming & Definitions
- Common chord names:
  ```ts
  const ChordNames = [
    "C", "Cm", "C7", "Cmaj7", "Cm7", "Cø7",
    "C#", "C#m", "C#7", "C#maj7", "C#m7", "C#ø7",
    // ... all 12 roots × 6 chord types
  ];
  ```

- Map names to `{ root: Note, type: ChordType }`:
  ```ts
  const chordNameToData = {
    "C": { root: 0, type: "major" },
    "Cm": { root: 0, type: "minor" },
    "C7": { root: 0, type: "dom7" },
    // ...
  };
  ```

### UI Control
- **Single dropdown** showing all chord names (72 options: 12 roots × 6 types)
- Label: "Select Chord"
- Initial selection: "C" (C Major)
- Organize optionally by root or by type (subgroups)

### Frontend Architecture
- Create `src/features/chord/data/chordNames.ts`
  - Export mapping of chord names to data
  - Export array of all chord names in desired order
  
- Create `src/features/chord/components/ChordSelector.tsx`
  - Simple `<select>` or dropdown component
  - Props: `value: string, onChange: (chordName: string) => void`
  
- Update `ChromaticCircle.tsx`:
  - Add state: `const [selectedChordName, setSelectedChordName] = useState("C")`
  - Render `ChordSelector` component
  - Parse selected chord name to get root and type
  - Render corresponding chord polygon

### Constraints
- No complex chord types yet (no slash chords, suspended, etc.)
- Single dropdown only (no secondary selectors)
- No search/filter (straight list)
- No keyboard shortcuts

## Acceptance Criteria
- [ ] Dropdown renders with all 72 chord options
- [ ] Selecting a chord updates the visualization
- [ ] Triangle shape and position match the selected chord
- [ ] Works with all root notes and chord types
- [ ] Chord name clearly matches the displayed chord
- [ ] Initial selection is "C" (or configurable)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Implementation Notes

### Dropdown Organization
Option A: Simple alphabetical list
```
C, Cm, C7, Cmaj7, Cm7, Cø7, C#, C#m, C#7, ...
```

Option B: Grouped by root
```
C
  - C Major
  - C Minor
  - C7
  - Cmaj7
  - Cm7
  - Cø7
C#
  - C# Major
  - ...
```

Option C: Grouped by type
```
Major Triads
  - C, C#, D, ..., B
Minor Triads
  - Cm, C#m, Dm, ..., Bm
...
```

Recommend Option B for future expansion.

### Naming Convention
Use standard jazz/music theory notation:
- C = C Major (common)
- Cm = C Minor (more standard than C-)
- C7 = C Dominant 7th
- Cmaj7 = C Major 7th
- Cm7 = C Minor 7th
- Cø7 = C Half-Diminished 7th

### State Management
Simple flow:
```
Chord Name → Parse → { root, type } → Calculate Notes → Render
```

## Related Issues
- **ISSUE-11**: Rotate Chord Shape Around Circle (underlying logic)
- **ISSUE-12**: Display Seventh Chords as Quadrilaterals (builds on this)
- **ISSUE-17**: Show Note Names on Vertices (label enhancement)

## Testing Checklist
- [ ] All 72 chord options selectable
- [ ] Chord visualization updates correctly for each option
- [ ] Parsing chord name to root/type works for all options
- [ ] Visual representation matches music theory expectations
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied
- [ ] Responsive on different viewport sizes

