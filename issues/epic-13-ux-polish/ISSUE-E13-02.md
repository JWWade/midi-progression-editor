# ISSUE-E13-02 — Increase contrast: dim non-diatonic notes more aggressively

## Objective
Raise the contrast ratio between active chord tones and background (non-diatonic, non-selected) notes so the chord polygon pops against the circle without requiring the user to parse all 12 nodes.

## Background
The current approach dims non-diatonic notes using `getHarmonyOpacity`, but the delta between inactive (~60–70% opacity) and active (100%) is too small. With 12 notes competing for attention, the chord shape gets visually lost. The fix is a two-layer update:

1. Push non-diatonic, non-chord notes down (target: ~30% opacity when a chord is active).
2. Optionally give chord-tone nodes a subtle brightness boost or stroke to reinforce them.

## Files To Edit

- `client/src/features/color-language/utils/harmonyOpacity.ts` (or wherever `getHarmonyOpacity` is defined) — tighten the inactive tier from its current value to ~0.28–0.32.
- Any CSS that applies opacity to non-selected circle nodes — verify the value propagates correctly.

## Acceptance Criteria
- [ ] Non-diatonic, non-chord notes render at ≤ 35% opacity when a chord is selected.
- [ ] Chord-tone nodes remain at 100% opacity.
- [ ] The visual result is verified at both light and dark themes (dark mode may need a slightly different threshold since dark backgrounds already suppress non-active elements less).
- [ ] All existing `harmonyOpacity` / `circleColors` unit tests still pass.
- [ ] If a chord is deselected, all notes return to their default (non-dimmed) state.

## Notes
- The target opacity of 30% is a starting point; tune visually. The goal is that the chord polygon is immediately obvious at a glance.
- Do not change the opacity of the *root note* — it may warrant its own visual treatment in a future issue.
