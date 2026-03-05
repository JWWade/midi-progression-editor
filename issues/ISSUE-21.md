# ISSUE-21 — Frontend: Zoom Into a Single Chord Tone

## User Story

As a user, I want to **click a note** and see its role (root, third, fifth, seventh) so I can understand the chord's internal structure.

## Summary

Enable interactive inspection of individual chord tones. Clicking a vertex shows detailed information about that note's function within the chord (its role and interval from the root).

## Requirements

### Interaction
- **Click handler** on chord polygon vertices
  - On click, display information about that note in a modal, popover, or sidebar
  
- **Information displayed**:
  - Note name (e.g., "E")
  - Role in chord (e.g., "Major Third")
  - Interval from root (e.g., "+4 semitones")
  - Interval quality (e.g., "Major 3rd")
  - Frequency (optional, e.g., "329.63 Hz")

### UI Presentation
- **Option A**: Popover/tooltip near the clicked vertex
  - Shows info in a small card
  - Closes on click outside or ESC key
  
- **Option B**: Sidebar panel on right side
  - Persistent display of currently selected tone
  - Updates on vertex click
  
- **Option C**: Modal dialog
  - Centered on screen with detailed info
  - Click to close
  
- Recommend **Option B** (sidebar) for UX clarity

### Information Mapping
Define chord tone roles:
```ts
const ChordToneRoles = {
  0: "Root (Fundamental)",
  4: "Major Third (+4 semitones)",
  3: "Minor Third (+3 semitones)",
  7: "Perfect Fifth (+7 semitones)",
  6: "Diminished Fifth (+6 semitones)",
  11: "Major Seventh (+11 semitones)",
  10: "Minor Seventh (+10 semitones)",
  9: "Major Sixth (+9 semitones)"
};
```

### Frontend Architecture
- Create `src/features/chord-inspection/` feature
  
- Create `src/features/chord-inspection/types/tone-info.ts`
  ```ts
  export interface ToneInfo {
    note: NoteInfo;
    role: string;
    interval: number; // semitones from root
    frequency: number;
  }
  ```

- Create `src/features/chord-inspection/components/ToneInfoPanel.tsx`
  - Props: `{ selectedTone: ToneInfo | null }`
  - Displays tone details if selected
  
- Update chord polygon rendering:
  - Add `onClick` handler to each vertex
  - Call state setter to select that tone
  - Pass selected tone to panel

### Constraints
- Single tone selection (not multiple)
- No editing or modification of tone (view-only)
- Simple role naming (no complex music theory jargon)
- No MIDI/frequency feedback (display only)

## Acceptance Criteria
- [ ] Clicking a vertex selects that tone
- [ ] Selected tone information displays correctly
- [ ] Role names are musically accurate and understandable
- [ ] Interval calculation correct for all chord types
- [ ] Visual indication of selected vertex (highlight or outline)
- [ ] Can deselect by clicking elsewhere
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Implementation Notes

### Interval Recognition
Map interval semitones to roles:
```ts
function getToneRole(intervalFromRoot: number, chordType: ChordType): string {
  const rolesMap = {
    major: {
      0: "Root",
      4: "Major Third",
      7: "Perfect Fifth",
      11: "Major Seventh"
    },
    minor: {
      0: "Root",
      3: "Minor Third",
      7: "Perfect Fifth",
      10: "Minor Seventh"
    },
    // ...
  };
  return rolesMap[chordType]?.[intervalFromRoot] || `+${intervalFromRoot} semitones`;
}
```

### Frequency Calculation
Optional: Display frequency of selected note
```ts
function noteIndexToFrequency(noteIndex: number, octave: number = 4): number {
  const midiNote = 60 + octave * 12 + noteIndex; // Relative to Middle C
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}
```

### Visual Feedback
Highlight selected vertex:
```tsx
<circle
  cx={point.x}
  cy={point.y}
  r={isSelected ? 8 : 6}
  fill={isSelected ? "#FCD34D" : "currentColor"}
  stroke={isSelected ? "#D97706" : "none"}
  strokeWidth="2"
/>
```

### Panel Styling
Simple sidebar:
```tsx
<div style={{
  position: "absolute",
  right: 20,
  top: 100,
  width: 250,
  padding: 16,
  backgroundColor: "#F3F4F6",
  borderRadius: 8,
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
}}>
  <h3>{selectedTone?.note.name}</h3>
  <p>{selectedTone?.role}</p>
  <p>Interval: +{selectedTone?.interval} semitones</p>
</div>
```

## Related Issues
- **ISSUE-17**: Display Note Names at Chord Vertices (visual foundation)
- **ISSUE-16**: Add Chord Selector Dropdown (chord selection)
- **ISSUE-18**: Play the Chord I'm Looking At (could play just the selected tone)

## Testing Checklist
- [ ] Clicking vertex triggers selection
- [ ] Selected tone info displays accurately
- [ ] Role names match interval values
- [ ] Works with all chord types
- [ ] Visual indication of selected vertex clear
- [ ] Can change selection by clicking another vertex
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied

