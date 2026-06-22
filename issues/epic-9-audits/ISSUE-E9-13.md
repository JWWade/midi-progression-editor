# ISSUE-E9-13 — ToneInfoPanel Responsive Layout (WCAG 1.4.10 AA)

## Objective

Ensure the ToneInfoPanel reflows correctly and remains visible on narrow viewports (< 600px width), addressing WCAG 1.4.10 (Reflow) for small-screen users.

## Background

The June 2026 accessibility audit identified that the ToneInfoPanel is positioned with `position: absolute; right: 20px; top: 100px`. On very narrow viewports (< 400–500px width, common on mobile devices and some tablet orientations), the panel may:
- Overlap the chromatic circle SVG
- Be clipped by viewport edges
- Render off-screen to the right

This violates WCAG 1.4.10 (AA) which requires that content reflow without loss of information.

## Success Criteria

- [ ] On viewports ≤ 600px width, the ToneInfoPanel is repositioned or hidden without losing information
- [ ] All content (selected tone, frequency, interval, etc.) remains accessible on small screens
- [ ] The chromatic circle and ToneInfoPanel do not overlap on any screen size
- [ ] Manual testing on mobile devices (Chrome DevTools, real phones) shows no clipping or off-screen content

## Options

### Option A: Responsive Repositioning (Preferred)
Add a media query to reflow the panel below the circle on narrow viewports:

```css
@media (max-width: 900px) {
  .toneInfoPanel {
    position: relative;
    right: auto;
    top: auto;
    margin-top: 12px;
    width: 100%;
    max-width: 100%;
  }
}
```

### Option B: Modal/Popover on Mobile
Convert the panel to a modal or popover overlay on narrow viewports:

```css
@media (max-width: 600px) {
  .toneInfoPanel {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    max-width: 90vw;
    z-index: 1000;
    /* Add close button */
  }
}
```

### Option C: Hide / Collapse on Mobile
Provide a button to open/close the panel on small screens:

```jsx
// New state: panelOpen
// Show/hide based on mediaQuery or user toggle
{!isMobile && <ToneInfoPanel ... />}
{isMobile && (
  <button onClick={() => setPanelOpen(!panelOpen)}>
    {panelOpen ? 'Hide' : 'Show'} Tone Info
  </button>
)}
```

## Implementation Notes

- **Option A** is simplest and aligns with responsive design best practices
- **Option B** requires additional focus management (trap focus in modal, restore focus on close)
- **Option C** requires state management and UX design decisions

### Testing Checklist
- [ ] Desktop (900px+): Panel positioned absolutely, no overlap
- [ ] Tablet (600–900px): Panel repositioned or modal UI active
- [ ] Mobile (< 600px): All content visible and accessible, no horizontal scroll
- [ ] All orientations tested (portrait and landscape)
- [ ] Keyboard navigation works in all layouts

## WCAG Criteria

- 1.4.10 Reflow (AA)
- 1.3.2 Meaningful Sequence (A) — if modal is used, ensure focus management is correct

## Estimated Effort

- Low (1–2 hours) for Option A
- Medium (2–3 hours) for Option B
- Medium (2–3 hours) for Option C

## Files to Modify

- `client/src/features/chord-inspection/components/ToneInfoPanel.tsx`
- `client/src/features/chord-inspection/components/ToneInfoPanel.module.css`
- `client/src/features/chromatic-circle/components/ChromaticCircle.module.css` (if panel wrapper needs adjustment)

## Design Notes

- Check existing responsive breakpoints in `App.module.css` for consistency
- Consider mobile-first layout strategy (panel below on mobile, positioned on desktop)
- Test with Chrome DevTools device emulation and real mobile devices
