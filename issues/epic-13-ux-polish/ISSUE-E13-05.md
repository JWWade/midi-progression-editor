# ISSUE-E13-05 — Progression sidebar: actionable empty state

## Objective
Replace the passive "Your progression is empty" empty state with a directive one that tells the user exactly what to do next.

## Background
The current empty state in `ProgressionSidebar` renders an informational message when no chords have been added. It is correct but not actionable — it describes a state rather than guiding the user toward the next step. First-time users who don't understand the three-panel flow are left without a call to action.

## Files To Edit

- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` — update the empty state JSX block. Replace or augment the existing text with:
  - A directional cue pointing left toward the chord panel (e.g., `←`)
  - A short instruction: "Select a chord and press **Add to Progression**"
  - Optionally: a ghost/placeholder chord tile outline to imply where chords will appear

- `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css` — update `.emptyState` styles: centre the arrow + text as a column; use `--color-text-muted` for the instruction; make the arrow larger (e.g., 24px) and lighter.

## Acceptance Criteria
- [ ] Empty state contains a leftward directional cue (arrow or similar).
- [ ] Instructions are concise (one sentence or less).
- [ ] `aria-live="polite"` is preserved on the empty state container.
- [ ] Style uses only existing CSS custom properties (no hardcoded colours).
- [ ] Empty state disappears correctly once the first chord is added.

## Notes
- Don't over-engineer: plain text + a styled arrow character is sufficient. A ghost tile is a nice-to-have, not a requirement.
- Keep the message tone brief. "← Select a chord, then add it here." is enough.
