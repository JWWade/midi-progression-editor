# ISSUE-33 — Frontend: Intensity Variation for Complex Chord Extensions

## User Story

As a user, I want **more complex chord variations (sus, 7ths, extensions) to appear in deeper or richer tones** so I can sense complexity without reading labels.

## Summary

Extend the color language (ISSUE-32) so that chord complexity is encoded in color intensity. A simple triad uses the base quality color; a seventh chord uses a slightly deeper tone; extended chords (9ths, 11ths, 13ths) use the richest, most saturated variant. This creates an intuitive visual signal of harmonic weight.

## Requirements

### Intensity Levels
Define intensity tiers mapped to chord complexity:

| Tier | Complexity            | Visual Treatment             |
|------|----------------------|------------------------------|
| 1    | Triads (major, minor) | Base quality color (standard saturation) |
| 2    | Seventh chords        | Deeper / 15–20% more saturated |
| 3    | Extended (9, 11, 13)  | Richest / 25–35% more saturated or darker lightness |

### Data Requirements
- Define a `ChordComplexity` type: `"triad" | "seventh" | "extended"`
- Create a function to derive complexity from a `Chord` object:
  ```ts
  export function getChordComplexity(chord: Chord): ChordComplexity
  ```
- Create a function that combines quality color + complexity to produce the final render color:
  ```ts
  export function getChordColor(quality: ChordQuality, complexity: ChordComplexity): string
  ```

### Frontend Architecture
- Update `src/features/color-language/constants/chordColors.ts` (from ISSUE-32):
  - Extend `QualityColorSet` with `deeper` and `richest` color variants per quality
- Create `src/features/color-language/utils/chordColorUtils.ts`:
  - Export `getChordComplexity` and `getChordColor`
- Update all consumers (circle note fills, thumbnail, progression tiles) to use `getChordColor` instead of the raw base color

### Constraints
- Intensity changes must be visible but not jarring — no sudden hue shifts, only saturation/lightness variation
- All intensity variants must still pass WCAG AA contrast requirements
- Triads should still look good; richer tones for extensions should feel like a natural deepening, not a different color family

## Acceptance Criteria
- [ ] Triads render in the base quality color
- [ ] Seventh chords render in a visibly deeper/richer variant
- [ ] Extended chords render in the richest intensity variant
- [ ] All intensity variants pass WCAG AA contrast
- [ ] Color family (hue) stays consistent across tiers for the same quality
- [ ] Consumers of the color system (circle, panel, sidebar) use the updated utility
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-32**: Quality-based Color Groups (foundation — must be implemented first)
- **ISSUE-42**: Shared Color Grammar Across Circle, Panel, and Sidebar
