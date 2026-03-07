# ISSUE-32 — Frontend: Quality-Based Color Groups for Chord Types

## User Story

As a user, I want **major, minor, diminished, augmented, suspended, and dominant chords to each have their own subtle color family** so I can identify chord qualities visually without reading labels.

## Summary

Establish a system-wide color grammar where each chord quality maps to a distinct, cohesive color family. This color language is used consistently across the chromatic circle, the current-chord panel, and the progression sidebar tiles.

## Requirements

### Color Mapping Design
Define a color family for each chord quality. Example palette (adjust for visual harmony):

| Quality      | Color Family       | Example Hue  |
|-------------|-------------------|-------------|
| Major        | Warm gold / amber  | HSL(45, …)  |
| Minor        | Cool blue / indigo | HSL(230, …) |
| Diminished   | Muted purple       | HSL(280, …) |
| Augmented    | Vibrant orange     | HSL(25, …)  |
| Suspended    | Teal / cyan        | HSL(185, …) |
| Dominant 7th | Red-orange         | HSL(15, …)  |

- Each quality has:
  - A **base color** (used for filled note nodes and polygon fill)
  - A **light variant** (used for backgrounds and panel tints)
  - A **dark variant** (used for text on light backgrounds)

### Data Requirements
- Define the color palette as a typed constant object:
  ```ts
  export const ChordQualityColors: Record<ChordQuality, QualityColorSet> = { ... }
  ```
- `QualityColorSet` includes `base`, `light`, `dark` CSS color strings

### Frontend Architecture
- Create `src/features/color-language/constants/chordColors.ts`
  - Exports `ChordQualityColors` constant
  - Exports `getQualityColor(quality: ChordQuality): QualityColorSet` helper
- Create `src/features/color-language/types/colorTypes.ts`
  - Defines `QualityColorSet` and `ChordQuality` types (if not already defined elsewhere)
- All other features that need chord colors import from this module

### Constraints
- No hardcoded hex values in component files — always import from `chordColors.ts`
- Color choices must achieve WCAG AA contrast when used as text on the `light` variant background
- The palette should feel cohesive and musical — avoid clashing primaries

## Acceptance Criteria
- [ ] A typed color mapping exists for all six chord quality groups
- [ ] Each quality has base, light, and dark color variants
- [ ] Colors are accessible (WCAG AA contrast for text use cases)
- [ ] All other features import chord colors from the central module
- [ ] No hardcoded colors in component files
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-26**: Chord-tone Emphasis with Expressive Color (consumer)
- **ISSUE-29**: Stylized Geometric Thumbnail (consumer)
- **ISSUE-33**: Intensity for Chord Variations (extends this palette)
- **ISSUE-36**: Chord Tiles with Thumbnails (consumer)
- **ISSUE-42**: Shared Color Grammar Across Circle, Panel, and Sidebar
