# Implementation Plan — ISSUE-46

**Title:** Strengthen Primary Action & Reorient Layout Around Chromatic Circle

**Branch:** `feature/issue-46-primary-action-layout`

**Base:** `develop`

**Priority:** High (Milestone 1 — Core Clarity & Flow)

---

## Overview

This issue has two tightly coupled components:

1. **Button Styling** — Elevate "Add to Progression →" as a visual primary action with filled color and click animation
2. **Layout Reorganization** — Move chromatic circle to page center and restructure grid around it

Both changes work together to create a coherent visual flow: circle (chord source) → panel (refinement) → progression (accumulation).

---

## Implementation Strategy

### Phase 1: Button Styling (Dependency-Free, Lower Risk)

**Can be implemented independently and tested first.**

- [ ] Create `.buttonPrimary` CSS class with color, padding, font-weight, and alignment
- [ ] Update `CurrentChordPanel.tsx` to apply new class and `margin-left: auto`
- [ ] Implement arrow-slide animation with `@keyframes arrowSlide`
- [ ] Add `isAnimating` state with `onAnimationEnd` handler
- [ ] Add `title` and `aria-label` attributes
- [ ] Test button disabled state logic
- [ ] Verify animation resets cleanly without lingering
- [ ] Lint and TypeScript checks pass

**Estimated effort:** 1–2 hours

### Phase 2: Layout Reorganization (Requires Coordination)

**Depends on understanding current container structure; may require small refactors.**

- [ ] Audit current `App.tsx` layout structure and existing CSS
- [ ] Create new grid layout in `App.module.css` (3 rows: header, center, footer)
- [ ] Update `App.tsx` JSX to match new grid structure
- [ ] Move `ChromaticCircle` into center row; update sizing to be responsive
- [ ] Refactor `CurrentChordPanel` and `ProgressionSidebar` into header with flexbox
- [ ] Reposition controls section into footer row
- [ ] Add responsive breakpoints for mobile (< 768px vertical stacking)
- [ ] Verify circle centers properly on all viewport sizes
- [ ] Test no unwanted scrolling introduced
- [ ] Lint and TypeScript checks pass

**Estimated effort:** 2–3 hours

---

## Affected Files

### Phase 1: Button

```
client/src/features/current-chord/components/
  ├── CurrentChordPanel.tsx (add state, animation handler, attributes)
  └── CurrentChordPanel.module.css (new .buttonPrimary, @keyframes arrowSlide)
```

### Phase 2: Layout

```
client/src/
  ├── app/
  │   ├── App.tsx (restructure JSX into grid rows)
  │   └── App.module.css (3-row grid, flexbox for header/footer)
  └── features/
      ├── chromatic-circle/
      │   ├── components/ChromaticCircle.tsx (update sizing context)
      │   └── ChromaticCircle.module.css (responsive SVG sizing)
      ├── current-chord/
      │   └── components/CurrentChordPanel.tsx (flex layout for header)
      └── progression-sidebar/
          └── components/ProgressionSidebar.tsx (flex layout for header)
```

---

## Key Decisions & Rationale

### Button Color
- Use `ChordQualityColors[quality].base` for background
- Fallback to indigo (`#4F46E5`) if quality undefined
- White text for contrast; consider luminance calculation if colors vary widely

### Layout Grid vs. Flexbox
- **Grid** for overall 3-row structure (clear semantic separation)
- **Flexbox** for header (current chord + sidebar side-by-side) and footer (controls)
- Avoids over-nesting; allows proportional sizing

### Circle Sizing Strategy
- `max-width: 550px; max-height: 550px` (desktop)
- `max-width: 300px; max-height: 300px` (mobile)
- `aspect-ratio: 1 / 1` or `viewBox` in SVG to preserve shape
- Allows responsive growth/shrink within constraints

### Animation Lifecycle
- Pure CSS `@keyframes` (no JavaScript timers)
- `onAnimationEnd` listener to remove `.arrowSlideActive` class
- Prevents animation accumulation on rapid clicks

---

## Testing Checklist

### Button Styling
- [ ] Click button; animation plays once and returns to rest state
- [ ] Disable button (chord === null); verify gray appearance
- [ ] Disable button (progression full); verify gray appearance
- [ ] Hover over button; `title` tooltip appears
- [ ] Button text is white and readable on all chord colors
- [ ] Button padding is visually larger than secondary buttons

### Layout
- [ ] Circle appears centered vertically on 1280×720 viewport
- [ ] Current Chord Panel and Progression Sidebar visible above circle
- [ ] Controls visible below circle
- [ ] Resize to 1920×1080; circle remains centered, layout proportional
- [ ] Resize to 480×800 (mobile); layout stacks vertically
- [ ] No horizontal scroll at any viewport size
- [ ] No vertical scroll for initial 8-chord progression
- [ ] Circle preserves aspect ratio on all screen sizes

### Code Quality
- [ ] `npm run lint` passes with `--max-warnings=0`
- [ ] `npx tsc --noEmit` passes in strict mode
- [ ] No console errors or warnings in Dev Tools
- [ ] No `any` types introduced
- [ ] CSS Module class names are descriptive

---

## Git Workflow

1. **Create feature branch off `develop`:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/issue-46-primary-action-layout
   ```

2. **Phase 1 commit (button styling):**
   ```bash
   git add client/src/features/current-chord/components/
   git commit -m "feat(issue-46): style Add to Progression button as primary action

   - Add .buttonPrimary CSS class with filled background using chord quality color
   - Implement arrow-slide animation on click
   - Add title and aria-label for accessibility
   - Button right-aligned with margin-left: auto
   - Animation resets via onAnimationEnd handler"
   ```

3. **Phase 2 commit (layout reorganization):**
   ```bash
   git add client/src/app/ client/src/features/chromatic-circle/
   git commit -m "feat(issue-46): reorganize layout with chromatic circle at center

   - Restructure App.tsx grid: header (panels) → center (circle) → footer (controls)
   - Move chromatic circle to vertical center of page
   - Add responsive breakpoints for mobile (<768px)
   - Update circle sizing to max-width/max-height with aspect ratio preservation
   - Flexbox layout for header and footer rows"
   ```

4. **Push to remote:**
   ```bash
   git push -u origin feature/issue-46-primary-action-layout
   ```

5. **Create Pull Request on GitHub:**
   - Base: `develop`
   - Link to ISSUE-46 in description
   - Request review

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Circle sizing breaks SVG polygon calculations | Test polygon points recalculate on resize; use ResizeObserver if needed |
| Grid gaps cause unexpected spacing | Set explicit `gap` values; test on multiple screen sizes |
| Mobile layout doesn't stack properly | Use `@media (max-width: 768px)` and test on real mobile emulator |
| Color contrast on chord colors | Pre-test all 12+ chord quality colors; use luminance function if needed |
| Animation felt sluggish or jerky | Trial different durations (300–400ms) and easing functions |

---

## Related Issues

- **ISSUE-47**: Highlight New Progression Tile on Add (visual feedback for add action)
- **ISSUE-48**: Replace "0/8" with Clearer Capacity Indicator (reinforces progression limit)

---

## Progress Tracker

### Phase 1: Button Styling
- [ ] Create `.buttonPrimary` CSS class
- [ ] Update `CurrentChordPanel.tsx` with state and handlers
- [ ] Implement arrow-slide animation
- [ ] Add accessibility attributes (`title`, `aria-label`)
- [ ] Test disabled states
- [ ] Lint and TypeScript pass
- **Phase 1 Status:** Not Started

### Phase 2: Layout
- [ ] Audit and understand current layout structure
- [ ] Design new grid layout
- [ ] Update `App.tsx` JSX
- [ ] Update `App.module.css` with 3-row grid
- [ ] Refactor header (flexbox) and footer (flexbox)
- [ ] Update circle sizing and constraints
- [ ] Add mobile responsive breakpoints
- [ ] Full cross-browser testing
- [ ] Lint and TypeScript pass
- **Phase 2 Status:** Not Started

### Final Verification
- [ ] Both phases complete and tested
- [ ] Feature branch pushed to GitHub
- [ ] Pull request created and reviewed
- [ ] Code merged to `develop`
- **Final Status:** Not Started

---

## Notes

- **Start Date:** TBD
- **Estimated Duration:** 3–5 hours total
- **Owner:** Josh / copilot
- **Review Checklist:** See acceptance criteria in ISSUE-46.md
