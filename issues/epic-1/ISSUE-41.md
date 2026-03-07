# ISSUE-41 — Frontend: Visual Confirmation When a Chord is Added to the Progression

## User Story

As a user, I want **the newly added chord tile in the sidebar to briefly highlight** so I know the action succeeded.

## Summary

When a chord is added to the progression (ISSUE-40), the newly created tile in the progression sidebar should briefly flash or glow to confirm the addition. This micro-interaction closes the feedback loop between the "add" action and its result in the sidebar.

## Requirements

### Visual Behavior
- When a new chord tile is added to the sidebar, it plays a brief **highlight animation**:
  - Example: tile background fades from a bright quality color to its normal state over ~600ms
  - Or: tile has a brief glow/pulse (box-shadow animation)
- The animation plays **once** on insertion and does not repeat
- After the animation ends, the tile looks identical to all other tiles (no persistent difference)

### Implementation Approach
- Use a CSS animation or transition triggered by the tile's initial mount
- The simplest approach: apply an animation class on mount that automatically removes itself via `animationend` or after a timeout
- Respect `prefers-reduced-motion` — skip or simplify the animation if the user has reduced motion enabled

### Frontend Architecture
- Update `ChordTile.tsx` (ISSUE-36):
  - Apply a CSS animation class on initial render (e.g., `chord-tile--entering`)
  - Remove the class after the animation duration using `useEffect` with a `setTimeout` or by listening to `animationend`
- Define the CSS animation in the component's stylesheet or as inline keyframes
- The animation color is derived from the chord's quality color (ISSUE-32)

### Constraints
- Animation duration should be short (≤800ms) to feel snappy, not sluggish
- The animation must not affect the tile's final layout or size
- Must respect `prefers-reduced-motion`
- No external animation libraries required — CSS animations are sufficient

## Acceptance Criteria
- [ ] Newly added chord tile plays a brief highlight animation
- [ ] Animation plays only once on insertion
- [ ] After the animation, the tile looks identical to all other tiles
- [ ] Animation respects `prefers-reduced-motion` (reduced or no animation when set)
- [ ] No layout shift during or after the animation
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-36**: Chord Tiles with Thumbnails in Progression Sidebar
- **ISSUE-40**: Add-to-Progression Flow (triggers this animation)
- **ISSUE-32**: Quality-based Color Groups (provides animation color)
