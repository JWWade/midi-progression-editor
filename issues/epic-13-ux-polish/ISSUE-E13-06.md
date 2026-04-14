# ISSUE-E13-06 — Progression sidebar: playback control hierarchy

## Objective
Give **Play All** clear visual primacy over the Loop and Arpeggio controls so users understand it is the main playback action.

## Background
Currently the Play All button, Loop toggle, and Arpeggio toggle sit at similar visual weights in the playback control row. "Play All" is the user's primary action but nothing in the layout or styling reinforces that. The Loop and Arpeggio controls are modifiers — they should read as secondary.

## Current layout (approximate)

```
[ ▶ Play All ]  [ ↺ Loop ]  [ ≋ Arp ]
```

All three use similar button sizing and weight.

## Target layout

```
[ ▶ Play All          ]   (primary, full or near-full width in its row)

[ ↺ Loop ]  [ ≋ Arp ]    (secondary, smaller, grouped below or alongside)
```

## Files To Edit

- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` — restructure the playback controls JSX. Play All should be on its own row or clearly separated. Loop and Arpeggio should be visually grouped as modifier toggles.
- `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css` — update playback row styles. Play All button: increase `font-size` to match the AddButton pattern (15px, font-weight 600, full available width). Loop + Arp row: smaller font (13px), ghost-style buttons, grouped with a smaller gap.

## Acceptance Criteria
- [ ] Play All is visually the most prominent control in the playback zone.
- [ ] Loop and Arpeggio controls are clearly secondary in visual weight (smaller, lighter, or grouped distinctly).
- [ ] Existing functionality of all three controls is unchanged.
- [ ] ARIA labels are unchanged.
- [ ] Layout works at the sidebar's typical width without wrapping awkwardly.

## Notes
- Do not change the actual button text ("▶ Play All", "■ Stop", "↺ Loop", etc.).
- If Arpeggio toggle currently opens the arpeggio editor panel, this layout change must not break that interaction.
