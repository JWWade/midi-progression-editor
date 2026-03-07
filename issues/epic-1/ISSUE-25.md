# ISSUE-25 — Frontend: Diatonic Transparency on Chromatic Circle

## User Story

As a user, I want **diatonic notes to appear solid and chromatic notes to appear translucent** so I can instantly see which tones belong to the key.

## Summary

The twelve note nodes on the chromatic circle should visually distinguish between notes that belong to the active key (diatonic) and those that don't (chromatic/accidental) by varying their opacity. Solid notes are "in key"; faded notes are "outside" the key.

## Requirements

### Visual Requirements
- **Diatonic notes** (belonging to the selected key's scale): rendered at full opacity (e.g., `opacity: 1`)
- **Chromatic notes** (not in the selected key's scale): rendered at reduced opacity (e.g., `opacity: 0.3` or `opacity: 0.25`)
- The distinction should be visible at a glance without requiring color changes alone
- Note labels should still be legible on translucent nodes

### Data Requirements
- The component must know which notes belong to the active key
- Reuse or extend the existing scale data (e.g., from `/Scale/from-root` endpoint or local scale definitions)
- A helper function maps `(key: Note, mode: Mode) → Set<number>` of diatonic note indices (0–11)

### Frontend Architecture
- Create or update `src/features/chromatic-circle/utils/scaleUtils.ts`
  - Export `getDiatonicIndices(root: Note, mode: Mode): Set<number>`
- Update the note-node rendering in `ChromaticCircle.tsx`:
  - For each note index (0–11), check membership in the diatonic set
  - Apply `opacity` style conditionally
- Opacity values should be defined as named constants (e.g., `DIATONIC_OPACITY`, `CHROMATIC_OPACITY`)

### Constraints
- No change to note positions or sizes — only opacity
- Translucent notes must still be interactive (clickable/selectable) if interaction is later added
- Works for all 12 keys and both major and minor modes

## Acceptance Criteria
- [ ] Diatonic notes appear solid (full opacity) for the active key
- [ ] Chromatic notes appear translucent for the active key
- [ ] Distinction updates immediately when the selected key changes
- [ ] Note labels remain legible on translucent nodes
- [ ] Works correctly for all 12 root notes and at least major and minor modes
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-24**: Color-Responsive Chromatic Circle (companion visual feature)
- **ISSUE-26**: Chord-tone Emphasis with Expressive Color
- **ISSUE-34**: Transparency for Harmonic Function
