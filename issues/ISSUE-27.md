# ISSUE-27 — Frontend: Simple, Elegant Visual Hierarchy on the Chromatic Circle

## User Story

As a user, I want **the circle to remain clean and uncluttered even as it responds to key and chord information** so I can focus on the geometry.

## Summary

As more visual layers are added to the chromatic circle (diatonic transparency, chord-tone fills, color responsiveness, geometric shapes), the overall design must remain visually calm and hierarchy-driven. This story establishes and enforces layout and styling constraints that keep the circle legible and aesthetically elegant.

## Requirements

### Visual Design Principles
- **One focal layer at a time**: chord geometry (polygon) is the primary visual element; note nodes are secondary; the circle ring is tertiary
- **Consistent spacing and sizing**: note nodes are uniformly sized; no element visually overwhelms another
- **Minimal ornamentation**: no drop shadows, borders, or decorations that are not musically meaningful
- **Typography clarity**: note labels use a single, clean font; size is proportional to circle radius
- **White space**: sufficient padding around the circle so it breathes within its container

### Layout Requirements
- The chromatic circle is centered within its container at all viewport sizes
- The circle scales responsively with the container while maintaining a fixed aspect ratio (1:1)
- Labels do not overlap at any supported viewport width
- No scrollbars introduced by the circle component

### Implementation Guidance
- Audit `ChromaticCircle.tsx` and all child components after implementing ISSUE-24 through ISSUE-26 to identify visual conflicts or clutter
- Define a shared style constants file `src/features/chromatic-circle/constants/visualConstants.ts`:
  - `NODE_RADIUS`, `LABEL_FONT_SIZE`, `STROKE_WIDTH`, `CIRCLE_PADDING`, etc.
- Use those constants consistently across all circle-related components

### Constraints
- No new visual features introduced in this story — this is a polish and constraint-enforcement story
- Changes should not break any existing acceptance criteria from ISSUE-24 to ISSUE-26
- Must remain accessible: sufficient color contrast for all text elements (WCAG AA minimum)

## Acceptance Criteria
- [ ] The circle renders cleanly with all visual layers active (color, opacity, fills, polygon)
- [ ] No element overlaps or visually dominates in a confusing way
- [ ] Note labels are legible at all supported viewport sizes
- [ ] The circle scales proportionally and stays centered at all viewport widths
- [ ] No horizontal scrollbars introduced by the circle component
- [ ] Color contrast for all text meets WCAG AA minimum
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-24**: Color-Responsive Chromatic Circle
- **ISSUE-25**: Diatonic Transparency on Chromatic Circle
- **ISSUE-26**: Chord-tone Emphasis with Expressive Color
- **ISSUE-42**: Shared Color Grammar Across Circle, Panel, and Sidebar
