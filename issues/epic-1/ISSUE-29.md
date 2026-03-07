# ISSUE-29 — Frontend: Stylized Geometric Thumbnail in the Current-Chord Panel

## User Story

As a user, I want **a small, expressive thumbnail of the chord's shape** (with color fills, gradients, and layering) so I can visually recognize the chord's quality at a glance.

## Summary

The current-chord panel (ISSUE-28) should include a miniature, stylized rendering of the chord's geometric shape — a small SVG thumbnail that echoes the full chord polygon on the chromatic circle, complete with quality-specific color fills and subtle gradients.

## Requirements

### Visual Requirements
- A small SVG thumbnail (e.g., 80×80 px or 100×100 px) is displayed inside the current-chord panel
- The thumbnail renders the chord's polygon shape:
  - Filled with the chord's quality color (see ISSUE-32)
  - Uses a subtle gradient fill (e.g., radial gradient from light center to saturated edge)
  - Vertices at correct relative positions (proportional to the full circle geometry)
- The thumbnail is expressive, not a technical diagram — beauty and clarity are both goals
- When no chord is active, the thumbnail area shows a neutral placeholder shape or is empty

### Data Requirements
- The thumbnail receives the chord's note indices and quality as props
- Reuses geometry calculation utilities from `src/features/chromatic-circle/utils/geometry.ts` (ISSUE-09)
- Reuses color mapping from `src/features/color-language/` (ISSUE-32)

### Frontend Architecture
- Create `src/features/current-chord/components/ChordThumbnail.tsx`
  - Props: `{ noteIndices: number[], quality: ChordQuality, size?: number }`
  - Renders a self-contained SVG at the given size
  - Applies gradient fill using `<defs><radialGradient>` in SVG
- Integrate `ChordThumbnail` into `CurrentChordPanel.tsx` (ISSUE-28)

### Constraints
- Thumbnail is view-only (no interaction in this story)
- Gradient fill uses inline SVG `<defs>` — no external CSS gradient
- The thumbnail must look good at small sizes (80–120 px); avoid thin lines or tiny text
- No label text inside the thumbnail

## Acceptance Criteria
- [ ] A chord shape thumbnail renders in the current-chord panel
- [ ] The thumbnail reflects the current chord's polygon shape
- [ ] The thumbnail uses a quality-specific color fill with a subtle gradient
- [ ] The thumbnail updates when the chord changes
- [ ] The thumbnail shows a neutral state when no chord is active
- [ ] Looks visually polished at 80–120 px size
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-28**: Explicit Chord Identity in Current-Chord Panel (parent panel)
- **ISSUE-32**: Quality-based Color Groups (color source)
- **ISSUE-36**: Chord Tiles with Thumbnails in Progression Sidebar (reuses this component)
- **ISSUE-45**: Stylized Geometry with Color Fills and Gradients
