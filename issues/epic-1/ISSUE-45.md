# ISSUE-45 — Frontend: Stylized Geometry with Color Fills and Gradients

## User Story

As a user, I want **these shapes to be expressive, with color fills and subtle gradients**, so the geometry feels musical rather than technical.

## Summary

Elevate the visual quality of the chord polygons on the chromatic circle (and in thumbnails) from functional geometry to expressive, musical graphics. This means applying gradient fills, tuned opacity, and styling choices that make the shapes feel alive and meaningful rather than diagrammatic.

## Requirements

### Visual Enhancements
- **Gradient fill**: chord polygon fill uses a radial or linear gradient rather than a flat color
  - Example: radial gradient from a slightly lighter center to the full quality color at the edges
  - Or: linear gradient from the root note direction to the opposite vertex
- **Stroke styling**: polygon stroke uses a slightly more saturated or darker variant of the quality color
  - Stroke width: 1.5–2px; slightly rounded `stroke-linejoin` (e.g., `round`)
- **Layered effect**: if the chord has an outer and inner polygon (e.g., an octave doubling decoration), they can be layered with varying opacity for depth
  - Note: layering is optional in this story — gradient fill alone meets the requirement
- **Glow or aura** (optional): a very subtle outer glow on the polygon using SVG `filter` (e.g., `feGaussianBlur` with low blur)

### Implementation Guidance
- All gradient definitions use inline SVG `<defs>` (no external CSS gradients)
- Each chord quality has its own gradient defined programmatically from its color values (ISSUE-32)
- Gradient fill is shared between the full-circle polygon and the thumbnail (ISSUE-29)
- Create a utility: `src/features/color-language/utils/svgGradient.ts`
  - Export `createRadialGradientDef(id: string, colorSet: QualityColorSet): React.ReactElement`
  - Returns a `<radialGradient>` element for use inside SVG `<defs>`

### Constraints
- Gradients must render cleanly at both full circle size and thumbnail size
- No performance-heavy SVG filters on mobile (feGaussianBlur is optional/gated by performance check)
- Gradient definitions must use unique IDs to avoid SVG `<defs>` collisions when multiple chords are shown

## Acceptance Criteria
- [ ] Chord polygon fill uses a gradient (radial or linear) rather than a flat color
- [ ] Gradient fill reflects the chord's quality color family
- [ ] Polygon stroke is styled (correct color variant, rounded joins)
- [ ] Gradient renders cleanly at full circle size
- [ ] Gradient renders cleanly at thumbnail size (ISSUE-29)
- [ ] SVG gradient IDs are unique (no collisions with multiple chords)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-43**: Chord Geometry Visualization (foundational polygon rendering)
- **ISSUE-44**: Quality-specific Chord Shapes (shapes being styled)
- **ISSUE-29**: Stylized Geometric Thumbnail (gradient must work at small sizes)
- **ISSUE-32**: Quality-based Color Groups (color values for gradient stops)
