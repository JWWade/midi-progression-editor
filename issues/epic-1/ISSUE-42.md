# ISSUE-42 — Frontend: Shared Color Grammar Across Circle, Panel, and Sidebar

## User Story

As a user, I want **the colors on the circle, the current-chord panel, and the progression tiles to match** so the system feels coherent and purposeful.

## Summary

Ensure that the color language established in ISSUE-32 and ISSUE-33 is applied consistently and identically across all three surfaces: the chromatic circle, the current-chord panel, and the progression sidebar. A given chord quality should always look the same regardless of where it appears in the UI.

## Requirements

### Consistency Rules
- The same chord quality produces the **exact same color** on:
  - Chord-tone fills on the chromatic circle
  - The current-chord panel (thumbnail fill, accent color)
  - Progression tile thumbnails and accent colors
- The same complexity tier (triad/seventh/extended) produces the **same intensity** on all surfaces
- Transparency rules (ISSUE-34) are applied identically across all surfaces

### Audit Scope
- Review all components that display chord color: `ChromaticCircle.tsx`, `CurrentChordPanel.tsx`, `ChordThumbnail.tsx`, `ChordTile.tsx`, `ProgressionSidebar.tsx`
- Verify each imports from `src/features/color-language/` (ISSUE-32) and does not use local/inline color values

### Frontend Architecture
- All chord color logic must flow from a single source: `src/features/color-language/`
- No component should define its own chord color values
- If any component has hardcoded or local color logic, refactor it to use the central module
- Create a visual audit checklist in the implementation PR description

### Constraints
- This is primarily a refactoring and consistency story — minimal new features
- Do not change the color palette itself; just ensure consistent application
- All surfaces must remain accessible after the audit (WCAG AA)

## Acceptance Criteria
- [ ] All chord-color-using components import from the central color language module
- [ ] No local or hardcoded chord color values exist in component files
- [ ] The same chord quality renders identically on circle, panel, and sidebar
- [ ] The same complexity tier renders identically across all surfaces
- [ ] Transparency rules are identical across all surfaces
- [ ] All surfaces remain WCAG AA accessible
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-32**: Quality-based Color Groups (source of truth)
- **ISSUE-33**: Intensity for Chord Variations
- **ISSUE-34**: Transparency for Harmonic Function
- **ISSUE-26**: Chord-tone Emphasis (circle surface)
- **ISSUE-29**: Stylized Geometric Thumbnail (panel surface)
- **ISSUE-36**: Chord Tiles with Thumbnails (sidebar surface)
