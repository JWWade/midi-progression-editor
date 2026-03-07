# ISSUE-26 — Frontend: Chord-Tone Emphasis with Expressive Color

## User Story

As a user, I want **the notes that form my current chord to be filled with expressive color** so I can see the chord's geometry clearly.

## Summary

When a chord is being constructed or displayed on the chromatic circle, the note nodes that belong to that chord should stand out with a rich, expressive fill color. This makes the chord's geometric footprint immediately visible against the rest of the circle.

## Requirements

### Visual Requirements
- Note nodes that are part of the current chord should be rendered with a distinct **filled color**
  - Example: chord tones filled with the chord's quality color (see ISSUE-32 for color grammar)
  - Non-chord diatonic notes remain solid but unfilled (or lightly filled)
  - Chromatic (non-diatonic) non-chord notes remain translucent (see ISSUE-25)
- The fill should be visually "expressive" — consider a gradient or saturated hue rather than a flat color
- The fill must contrast well with both the circle background and the note label text

### Data Requirements
- The circle component receives the current chord's note indices as a prop or from shared state
- The chord quality is also available to determine the fill color
- A mapping from chord quality to fill color is reused from the color language system (ISSUE-32)

### Frontend Architecture
- Update note-node rendering in `ChromaticCircle.tsx`:
  - Accept a prop `chordNoteIndices: number[]` (or derive from shared state)
  - For each note node, check if its index is in `chordNoteIndices`
  - Apply the chord's quality color as a fill when the note is a chord tone
- Create or update `src/features/chromatic-circle/utils/noteStyles.ts`
  - Export `getNoteStyle(index: number, chordIndices: number[], quality: ChordQuality, diatonicIndices: Set<number>): NoteStyle`
  - Returns an object with `fill`, `opacity`, and optionally `stroke`

### Constraints
- Fill colors must remain readable (label text must contrast)
- Visual emphasis should not conflict with diatonic/chromatic opacity logic (ISSUE-25)
- Chord tone fill updates instantly when the chord changes
- No animation required for this story (instant fill update)

## Acceptance Criteria
- [ ] Chord tone notes are visually distinct from non-chord notes on the circle
- [ ] Fill color reflects the chord's quality (major vs minor vs diminished, etc.)
- [ ] Fill updates immediately when the chord changes
- [ ] Note labels remain legible on filled nodes
- [ ] Chord tone emphasis coexists correctly with diatonic/chromatic opacity
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-25**: Diatonic Transparency (opacity layer — must coexist)
- **ISSUE-32**: Quality-based Color Groups (source of fill colors)
- **ISSUE-43**: Chord Geometry Visualization (chord shape on the circle)
- **ISSUE-45**: Stylized Geometry with Color Fills and Gradients
