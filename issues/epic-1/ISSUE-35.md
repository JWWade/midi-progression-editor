# ISSUE-35 — Frontend: Right-Hand Vertical Progression Sidebar

## User Story

As a user, I want **a spacious vertical sidebar on the right where my chords appear in order** so I can build a progression without leaving the chromatic circle.

## Summary

Create the progression sidebar — a dedicated vertical panel on the right side of the main layout. The sidebar is the second primary surface of the application where collected chords are displayed in sequence. This story establishes the sidebar's layout, structure, and empty state.

## Requirements

### Layout Requirements
- The sidebar is positioned on the **right side** of the main layout
- It is **vertically oriented** — chords stack from top to bottom in order
- The sidebar has a fixed or constrained width (e.g., 240–320 px) that does not shrink the circle too much
- The sidebar has its own **scroll area** if the chord list exceeds the viewport height
- On smaller viewports, the sidebar may collapse or move below the circle (responsive behavior)

### Empty State
- When no chords have been added, the sidebar displays a clear empty-state message
  - Example: "Your progression is empty. Build a chord on the circle and add it here."
  - Or a simple placeholder illustration

### Structure
- The sidebar includes:
  - A **header** (e.g., "Progression" label)
  - A **scrollable chord list** area (empty by default in this story)
  - A clear visual boundary separating it from the circle area (border, background difference, or shadow)

### Frontend Architecture
- Create `src/features/progression-sidebar/components/ProgressionSidebar.tsx`
  - Accepts props: `chords: Chord[]` (empty array initially)
  - Renders header, empty state, or chord list based on `chords.length`
- Integrate `ProgressionSidebar` into the main layout in `App.tsx` or a layout component
- Use CSS flexbox or grid for the two-column layout (circle | sidebar)

### Constraints
- No chord editing controls in this story (that is ISSUE-37)
- No chord tiles rendered in this story (that is ISSUE-36)
- Sidebar must be accessible as a landmark region (`<aside>` or `role="complementary"`)

## Acceptance Criteria
- [ ] A vertical sidebar renders on the right side of the main layout
- [ ] The sidebar has a header and a distinct visual boundary
- [ ] An empty-state message is shown when no chords are present
- [ ] The sidebar has its own scroll area
- [ ] The layout is responsive (circle and sidebar resize proportionally)
- [ ] Sidebar is accessible as a landmark region
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-36**: Chord Tiles with Thumbnails in Progression Sidebar
- **ISSUE-37**: Simple Editing Controls in Progression Sidebar
- **ISSUE-38**: Finite Progression Length
- **ISSUE-39**: Session-only Persistence for Progression
- **ISSUE-40**: Add-to-Progression Flow
