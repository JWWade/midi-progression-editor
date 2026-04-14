# ISSUE-E13-03 — AppHeader: two-zone layout (view controls vs system controls)

## Objective
Split the AppHeader control bar into two visually distinct zones so related controls are grouped and unrelated controls don't compete.

## Background
The current header is a single flat row: `[Centroid] [Intervals] [Legend] [Load JSON] [Retro/Theme] [Flats]`. These are two different concerns:

- **View controls** — affect the circle visualisation: Centroid, Intervals, Legend
- **System controls** — affect global state or I/O: Load JSON, Theme, Flats

Mixing them creates a cognitively flat control bar where nothing reads as primary or secondary.

## Files To Edit

- `client/src/app/components/AppHeader.tsx` — wrap view controls in a `<div className={styles.viewControls}>` group and system controls in `<div className={styles.systemControls}>`. The outer `.toggles` container should use `justify-content: space-between` or a spacer to push the two groups apart.
- `client/src/app/components/AppHeader.module.css` — add `.viewControls` and `.systemControls` flex sub-groups; add a visible gap or divider between them.

## Acceptance Criteria
- [ ] View controls (Centroid, Intervals, Legend) are visually grouped on the left of the toggle bar.
- [ ] System controls (Load JSON, Theme, Flats) are visually grouped on the right.
- [ ] A clear gap or subtle divider separates the two groups.
- [ ] No functional change — all controls still work identically.
- [ ] Layout remains responsive at narrow widths (wraps gracefully).

## Notes
- The divider can be as simple as a wider gap (`gap: 24px` between groups vs `gap: 8px` within) or a `1px` vertical rule. Keep it subtle.
- Do not reorder controls within each group.
