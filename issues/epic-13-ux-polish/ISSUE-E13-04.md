# ISSUE-E13-04 — Replace AppHeader checkboxes with pill toggles

## Objective
Replace the `<input type="checkbox">` elements in AppHeader with styled pill-toggle components that match the modern visual language of the rest of the UI.

## Background
The current Centroid / Intervals / Legend controls use browser-default checkboxes inside a label, styled minimally with `.checkbox`. Native checkboxes are visually inconsistent with the app's card/button/border-radius design system and feel like a developer affordance rather than a product one. A pill toggle (two-state switch) communicates the same boolean state in a style consistent with the rest of the UI.

## Files To Edit / Add

- `client/src/shared/components/PillToggle/PillToggle.tsx` — new shared component. Props: `id: string`, `checked: boolean`, `onChange: (checked: boolean) => void`, `label: string`. Renders a visually styled toggle (pill track + thumb) using CSS, not a library.
- `client/src/shared/components/PillToggle/PillToggle.module.css` — all styles for the toggle. Should respect `prefers-reduced-motion`.
- `client/src/app/components/AppHeader.tsx` — replace the three `<label>/<input type="checkbox">` blocks with `<PillToggle>` for Centroid, Intervals, and Legend. The Flats toggle (enharmonic) should also be converted if it is currently a checkbox.
- `client/src/app/components/AppHeader.module.css` — remove now-unused `.checkbox` rule.

## Acceptance Criteria
- [ ] Centroid, Intervals, Legend, and Flats controls render as pill toggles.
- [ ] Toggle is keyboard-operable (Space/Enter to toggle, visible focus ring).
- [ ] Toggle communicates checked/unchecked state accessibly (`role="switch"`, `aria-checked`).
- [ ] Toggle respects `prefers-reduced-motion` (no thumb slide animation when motion is reduced).
- [ ] Visual style (size, colour, border-radius) is consistent with the app's existing button/card language.
- [ ] No functional change to the underlying boolean state they control.

## Notes
- The `PillToggle` component must not depend on any third-party library beyond React.
- The thumb colour when active should use the existing `--color-accent` or `--chord-quality-base` CSS custom property (whichever is active). When inactive, use `--color-border`.
- Minimum tap target: 44 × 24 px for the toggle track.
