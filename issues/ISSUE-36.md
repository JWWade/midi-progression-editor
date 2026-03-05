# ISSUE-36 — Frontend: Chord Tiles with Thumbnails in the Progression Sidebar

## User Story

As a user, I want **each chord in the progression to appear as a tile with its name and a miniature stylized geometric shape** so I can scan the sequence visually.

## Summary

Populate the progression sidebar (ISSUE-35) with chord tiles. Each tile shows the chord's name in text and includes a miniature version of the chord's geometric thumbnail (the same shape used in the current-chord panel, ISSUE-29). This makes the sidebar scannable as a visual sequence, not just a list of text names.

## Requirements

### Chord Tile Visual Requirements
- Each tile is a compact card with:
  - **Chord name** (e.g., "Cmaj", "Am7") — prominently displayed
  - **Miniature geometric thumbnail** — the chord's polygon shape, small but recognizable
  - **Quality color accent** — the tile's left border or background tint uses the chord's quality color (ISSUE-32)
- Tiles are vertically stacked in progression order (first chord at top)
- Tiles have consistent height; if chord names vary in length, they should not cause height inconsistency
- A subtle hover state (e.g., slight background tint change) indicates the tile is interactive

### Data Requirements
- The sidebar receives an ordered array of `Chord` objects
- Each `Chord` contains: `root`, `quality`, `noteIndices`, optional `extensions`
- Tile rendering is pure — no side effects inside the tile component

### Frontend Architecture
- Create `src/features/progression-sidebar/components/ChordTile.tsx`
  - Props: `{ chord: Chord, index: number }`
  - Renders the chord name and a small `ChordThumbnail` (reused from ISSUE-29)
  - Applies quality color accent
- Update `ProgressionSidebar.tsx` (ISSUE-35) to render a `ChordTile` for each chord in the array
- Reuse `ChordThumbnail` from ISSUE-29 with a small `size` prop (e.g., `size={48}`)

### Constraints
- Tile interactions (move/delete) are not part of this story (see ISSUE-37)
- Tile must look good for chord names of varying lengths
- Thumbnail should scale cleanly at small size (no blurry or clipped geometry)

## Acceptance Criteria
- [ ] Each chord in the progression renders as a tile in the sidebar
- [ ] Each tile shows the chord name
- [ ] Each tile shows a miniature chord shape thumbnail
- [ ] Tile styling uses the chord's quality color as an accent
- [ ] Tiles are ordered top-to-bottom matching progression order
- [ ] Tile has a subtle hover state
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-29**: Stylized Geometric Thumbnail (reused component)
- **ISSUE-32**: Quality-based Color Groups (color accent source)
- **ISSUE-35**: Right-hand Vertical Progression Sidebar (parent)
- **ISSUE-37**: Simple Editing Controls in Progression Sidebar
