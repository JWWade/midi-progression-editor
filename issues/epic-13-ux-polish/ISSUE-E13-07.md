# ISSUE-E13-07 — Progression sidebar: Timing section spacing and grouping

## Objective
Add breathing room and a clear group label to the BPM / Beats-per-chord / chord duration controls so they read as a coherent "Timing" block rather than a run of inputs.

## Background
The BPM and beats-per-chord inputs currently sit inside the sidebar with minimal visual separation from the playback controls above and the chord list below. The proximity makes the section feel cramped and reduces scanability, particularly when the user is adjusting playback speed.

## Files To Edit

- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` — wrap the BPM + beats-per-chord controls in a `<section>` or `<div>` with a section-label heading ("Timing"). This may already be partially labelled; verify and tighten.
- `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css` — add a `.timingSection` rule or update the relevant existing rule:
  - Increase `margin-top` above the timing section (target: ~16px from the playback controls)
  - Add `padding-top` + a subtle top border or divider to visually separate the section
  - Increase vertical spacing between individual timing rows (target: `gap: 10px` instead of current tight value)

## Acceptance Criteria
- [ ] BPM and beats-per-chord controls are visually grouped under a clear "Timing" label.
- [ ] There is adequate spacing above the Timing section separating it from playback controls.
- [ ] Individual rows within the Timing section have consistent spacing.
- [ ] No functional change to sliders, inputs, or their handlers.
- [ ] No new dependencies introduced.

## Notes
- A section label "Timing" should match the style of other sidebar section labels (typically 11px, uppercase, letter-spaced, `--color-text-secondary`).
- A thin top border (`1px solid var(--color-border)`) is sufficient as a divider; don't add a full card/box just for spacing.
