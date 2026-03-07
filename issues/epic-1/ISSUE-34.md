# ISSUE-34 — Frontend: Transparency for Harmonic Function (Diatonic vs Chromatic)

## User Story

As a user, I want **transparency to indicate diatonic vs chromatic tones** so I can understand tension and stability visually.

## Summary

Extend and formalize the transparency layer of the color language so it consistently communicates harmonic function. Diatonic tones (stable, in-key) are rendered at full opacity; chromatic tones (tense, outside the key) are rendered with reduced transparency. This rule applies across all surfaces — the chromatic circle, the chord thumbnail, and progression tiles.

## Requirements

### Transparency Rules
| Tone type                              | Opacity      |
|----------------------------------------|-------------|
| Diatonic (in the active key's scale)   | Full (1.0)  |
| Chromatic (outside the active key)     | Reduced (e.g., 0.3–0.4) |
| Chord tone + diatonic                  | Full (1.0), with quality fill |
| Chord tone + chromatic (e.g., blue note) | Partial (e.g., 0.7), with quality fill |

### Design Intent
- The transparency gradient conveys harmonic tension without requiring any text labels
- "Stable" tones feel present and solid; "tense" tones feel ghostly and unresolved
- The system allows users to intuitively understand which notes "belong" and which create color

### Frontend Architecture
- Create or update `src/features/color-language/utils/harmonyOpacity.ts`
  - Export `getHarmonyOpacity(noteIndex: number, diatonicIndices: Set<number>, isChordTone: boolean): number`
  - Encapsulates the transparency rules table above
- Update all rendering contexts to use `getHarmonyOpacity`:
  - Note nodes on `ChromaticCircle.tsx`
  - Chord thumbnail (`ChordThumbnail.tsx`)
  - Progression tile thumbnails

### Constraints
- Opacity values should be named constants, not magic numbers
- Even fully-transparent chord tones must still be color-filled (opacity rule only reduces, never removes fill for chord tones)
- This story formalizes and consolidates what ISSUE-25 began — avoid duplication

## Acceptance Criteria
- [ ] Diatonic tones consistently render at full opacity across all surfaces
- [ ] Chromatic non-chord tones render at reduced opacity across all surfaces
- [ ] Chromatic chord tones (e.g., blue notes) render at a middle opacity with quality fill
- [ ] Opacity values are named constants (no magic numbers)
- [ ] The rule is applied consistently on circle, thumbnail, and progression tiles
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-25**: Diatonic Transparency on Chromatic Circle (precursor)
- **ISSUE-32**: Quality-based Color Groups (color side of same system)
- **ISSUE-33**: Intensity for Chord Variations (richness side of same system)
- **ISSUE-42**: Shared Color Grammar Across Circle, Panel, and Sidebar
