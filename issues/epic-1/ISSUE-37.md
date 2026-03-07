# ISSUE-37 — Frontend: Simple Editing Controls in the Progression Sidebar

## User Story

As a user, I want to **move chords up or down and delete them with minimal friction** so I can refine the progression easily.

## Summary

Add inline editing controls to each chord tile in the progression sidebar. Each tile should expose move-up, move-down, and delete actions in a clean, unobtrusive way. The controls should be immediately accessible without requiring a separate edit mode.

## Requirements

### Controls Per Tile
Each chord tile (ISSUE-36) should provide:
- **Move up** (↑): moves the chord one position earlier in the progression
  - Disabled and visually dimmed for the first chord
- **Move down** (↓): moves the chord one position later in the progression
  - Disabled and visually dimmed for the last chord
- **Delete** (✕ or trash icon): removes the chord from the progression
  - May prompt a brief confirmation (optional) or act immediately

### Visual Design
- Controls should be small and secondary — they do not compete with the chord name or thumbnail
- Consider showing controls on hover only (desktop) with a persistent tap target (mobile)
- Use icon buttons rather than text buttons to save space

### State Management
- All reorder and delete operations mutate the shared progression state array
- Reorder: swap adjacent elements in the array
- Delete: filter the chord out of the array by index
- State changes are reflected immediately in the sidebar (no undo in this story)

### Frontend Architecture
- Update `ChordTile.tsx` (ISSUE-36):
  - Add props: `onMoveUp?: () => void`, `onMoveDown?: () => void`, `onDelete: () => void`
  - Add `isFirst: boolean`, `isLast: boolean` props to control disabled state
- Update `ProgressionSidebar.tsx` to pass the correct callbacks and flags to each tile
- Reorder/delete logic lives in the progression state management (hook or context)

### Constraints
- No undo functionality required in this story
- No drag-and-drop in this story (potential future enhancement)
- All controls must be keyboard-accessible
- Disabled states must be communicated to assistive technology (`aria-disabled`)

## Acceptance Criteria
- [ ] Each chord tile has move-up, move-down, and delete controls
- [ ] Move-up is disabled for the first chord; move-down is disabled for the last chord
- [ ] Clicking move-up/down reorders the chord correctly
- [ ] Clicking delete removes the chord from the progression
- [ ] State updates are reflected immediately in the sidebar
- [ ] All controls are keyboard-accessible
- [ ] Disabled states are communicated to assistive technology
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-35**: Right-hand Vertical Progression Sidebar
- **ISSUE-36**: Chord Tiles with Thumbnails (tiles being edited)
- **ISSUE-38**: Finite Progression Length
- **ISSUE-39**: Session-only Persistence for Progression
