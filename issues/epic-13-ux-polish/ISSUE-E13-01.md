# ISSUE-E13-01 — Chromatic circle hover states and pointer cursor

## Objective
Add hover affordances to the 12 note nodes in `ChromaticCircle` so users understand they are interactive before clicking.

## Background
The circle currently has no hover state on note nodes — clicking is the only way to discover interactivity. New users routinely fail to understand that notes are clickable (no pointer cursor, no visual change). The existing node rendering is done in SVG; hover states require either CSS or SVG event-driven class toggling.

## Files To Edit

- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx` (or the node rendering sub-component) — add `onMouseEnter`/`onMouseLeave` handlers, or `pointer-events: all` + CSS `:hover` on the node `<g>` or `<circle>` elements.
- Corresponding CSS module — add `:hover` rule: slight scale-up (`transform: scale(1.15)`), subtle glow (`filter: drop-shadow(0 0 4px currentColor)`), `cursor: pointer`.

## Acceptance Criteria
- [ ] Hovering any note node shows a visible scale or glow change.
- [ ] `cursor: pointer` is applied on hover.
- [ ] Hover state does not interfere with the active/selected state.
- [ ] No hover state on nodes that are purely decorative (if any).
- [ ] Change does not affect `ChromaticCircle` snapshot tests or existing unit tests.

## Notes
- Prefer pure CSS `:hover` on SVG elements if browser support allows (it does for pointer events on SVG `<circle>`/`<g>`). This avoids adding React state.
- Keep the effect subtle — this is a polish, not a new feature. Scale 1.1–1.15 and a soft glow are enough.
