# ISSUE-46 — Strengthen Primary Action & Reorient Layout Around Chromatic Circle

## User Story

As a user, I want the core loop of the UI — **select from circle → inspect chord → add to progression** — to be visually and spatially coherent so that I understand the intentional *flow* of the tool.

## Summary

This issue combines two layout changes:
1. **Elevate "Add to Progression →" as the visual primary action** with a filled button style and arrow-slide animation
2. **Move the chromatic circle to the center of the page** and reorganize control panels around it to match the visual metaphor: circle is the source of all chords, sidebar accumulates selections, control panel refines them

---

## Part 1: Restyle "Add to Progression →" Button

### Affected Files
- `client/src/features/current-chord/components/CurrentChordPanel.tsx`
- `client/src/features/current-chord/components/CurrentChordPanel.module.css`

### Requirements

#### Visual Requirements
- Create a new `.buttonPrimary` CSS Module class:
  - **Filled background** using the **chord's quality color** (major, minor, dominant, etc.)
    - Import `ChordQualityColors` from utilities or define locally
    - Use `ChordQualityColors[quality].base` or fallback to `#4F46E5` (indigo)
  - **White or high-contrast text** (`color: #FFFFFF` or computed from chord color's luminance)
  - **Larger padding** than secondary buttons (e.g., `padding: 12px 24px` vs. `8px 16px`)
  - **Font weight 600** (semi-bold)
  - **Right-aligned** within the panel using `margin-left: auto` (flex layout)

#### Interaction Requirements
- Add a CSS keyframe animation `@keyframes arrowSlide`:
  - Arrow shifts 4–6px to the right and returns (subtle push-outward effect)
  - Duration: 300–400 ms
  - Easing: `ease-out`
- CSS class `.arrowSlideActive` (applied on click, removed after animation completes)
  - Use `onAnimationEnd` listener to auto-remove the class
  - No JavaScript timers; pure CSS animation lifecycle

#### State & Accessibility
- Keep existing **disabled state**:
  - When `chord === null` (no selection): gray background, dimmed text, `cursor: not-allowed`
  - When `isProgressionFull === true` (max 8 chords reached): gray background, tooltip message
- Add **native tooltip** via `title` attribute: `"Add chord to progression"`
- Ensure `aria-label` is present for screen readers

---

## Part 2: Reorganize Page Layout — Chromatic Circle to Center

### Affected Files
- `client/src/app/App.tsx` (main layout structure)
- `client/src/app/App.module.css` (layout grid/flex)
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx` (sizing context)
- `client/src/features/current-chord/components/CurrentChordPanel.tsx`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/current-chord/components/Controls.tsx` or equivalent (chord inspector controls)

### Layout Architecture

**Before (from screenshot)**
```
┌─────────────────────────────────────┐
│  Current Chord    │  Progression    │
│  Panel (left)     │  Sidebar (right)│
├─────────────────────────────────────┤
│  Controls (centered below)          │
├─────────────────────────────────────┤
│  Chromatic Circle (bottom-center)   │
└─────────────────────────────────────┘
```

**After (desired)**
```
┌──────────────────────────────────────┐
│  Current Chord Panel  │  Progression │
│  (left-top)          │  Sidebar      │
└──────────────────────────────────────┘
│                                      │
│    ◎ Chromatic Circle (CENTER)      │
│    (moves up, becomes focal point)  │
│                                      │
└──────────────────────────────────────┘
│  Controls (Form: From → To)         │
│  (Checkboxes, Scale, etc.)          │
└──────────────────────────────────────┘
```

### CSS Grid/Flex Strategy
- **App-level container**: Use CSS Grid with 3 rows:
  - Row 1 (10–15% height): Header section (Current Chord + Progression Sidebar side-by-side)
  - Row 2 (65–70% height): Chromatic Circle centered, full width
  - Row 3 (15–20% height): Controls section (From/To form, checkboxes, scale selector)

- **Current Chord Panel + Progression Sidebar**: Use flexbox, `flex-direction: row`, with each taking proportional width
  - Current Chord: `flex: 1` (left)
  - Progression Sidebar: `flex: 1` (right), may need `max-width` constraint or scrollable list

- **Chromatic Circle container**:
  - Centered horizontally: `display: flex; justify-content: center; align-items: center;`
  - Allow vertical growth: `flex: 1` or `height: auto`
  - Preserve circle's aspect ratio with `aspect-ratio: 1 / 1` or explicit sizing

- **Controls section**:
  - Flex row, center-aligned
  - Wrap on mobile: `flex-wrap: wrap`
  - Consistent padding/spacing

#### Responsive Considerations
- On mobile (< 768px):
  - Stack Current Chord and Progression vertically (not side-by-side)
  - Reduce circle size proportionally
  - Stack controls vertically
- On tablet / desktop: Keep proposed layout

#### CSS Removal/Updates
- Remove any `.bottomSection` or `.circleContainer` fixed-width/fixed-height classes that limit chromatic circle
- Update circle sizing to be responsive:
  - Instead of `width: 400px; height: 400px;`, use proportional units or `max-width: 60vmin` (responsive to viewport)
  - Ensure SVG inside circle recalculates polygon points on resize

---

## Acceptance Criteria

### Button Styling
- [ ] "Add to Progression →" button has a filled background matching chord quality color
- [ ] Button text is white/high-contrast and semi-bold (600 weight)
- [ ] Button is right-aligned within the Current Chord Panel
- [ ] Button padding is noticeably larger than secondary buttons
- [ ] Arrow animation triggers on every click and completes without lingering
- [ ] Disabled state (gray, not-allowed cursor) appears when progression is full or no chord selected
- [ ] Tooltip (`title` attribute) displays on hover
- [ ] `aria-label` is present for accessibility

### Layout Reorganization
- [ ] Chromatic circle is positioned in the vertical center of the page
- [ ] Current Chord Panel and Progression Sidebar remain side-by-side at the top
- [ ] Controls section (From/To form, Scale, checkboxes) sits below the circle
- [ ] Circle is horizontally centered and takes up 65–70% of vertical viewport
- [ ] Layout respects viewport resize (responsive)
- [ ] No horizontal or vertical scroll introduced (unless intentional, e.g., long progressions)

### Code Quality
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
- [ ] No `any` types introduced
- [ ] CSS Module classes are well-named and documented
- [ ] Layout prevents unnecessary re-renders of chromatic circle during state changes

---

## Implementation Notes

### Button Animation Implementation

```tsx
// CurrentChordPanel.tsx
const [isAnimating, setIsAnimating] = useState(false);

const handleAddClick = () => {
  setIsAnimating(true);
  // Dispatch add action
};

const handleAnimationEnd = () => {
  setIsAnimating(false);
};

return (
  <button
    className={`${styles.buttonPrimary} ${isAnimating ? styles.arrowSlideActive : ''}`}
    onClick={handleAddClick}
    onAnimationEnd={handleAnimationEnd}
    disabled={chord === null || isProgressionFull}
    title="Add chord to progression"
    aria-label="Add chord to progression"
  >
    Add to Progression →
  </button>
);
```

```css
/* CurrentChordPanel.module.css */
.buttonPrimary {
  padding: 12px 24px;
  font-weight: 600;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  margin-left: auto;
  /* Background color computed in JS based on chord quality */
}

.buttonPrimary:disabled {
  background-color: #d1d5db;
  color: #6b7280;
  cursor: not-allowed;
  opacity: 0.7;
}

.arrowSlideActive {
  animation: arrowSlide 0.35s ease-out;
}

@keyframes arrowSlide {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(5px);
  }
  100% {
    transform: translateX(0);
  }
}
```

### Layout Grid Implementation

```tsx
// App.tsx
<div className={styles.appContainer}>
  <header className={styles.headerRow}>
    <CurrentChordPanel ... />
    <ProgressionSidebar ... />
  </header>
  <main className={styles.centerRow}>
    <ChromaticCircle ... />
  </main>
  <footer className={styles.footerRow}>
    <Controls />
  </footer>
</div>
```

```css
/* App.module.css */
.appContainer {
  display: grid;
  grid-template-rows: minmax(120px, 15%) 1fr minmax(100px, 20%);
  height: 100vh;
  gap: 16px;
  padding: 16px;
  background-color: #f9fafb;
}

.headerRow {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.centerRow {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.footerRow {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Responsive: Stack vertically on mobile */
@media (max-width: 768px) {
  .appContainer {
    grid-template-rows: auto auto 1fr auto;
  }

  .headerRow {
    flex-direction: column;
  }
}
```

### SVG Circle Responsive Sizing

```tsx
// ChromaticCircle.tsx (or wrapper)
<div className={styles.circleContainer}>
  <svg
    viewBox="0 0 400 400"
    className={styles.circleSvg}
    aria-label="Chromatic circle showing chord and scale degrees"
  >
    {/* Circle graphics */}
  </svg>
</div>
```

```css
/* ChromaticCircle.module.css */
.circleContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.circleSvg {
  max-width: 550px;
  max-height: 550px;
  width: 100%;
  height: auto;
  /* Preserve aspect ratio */
}

/* On mobile, constrain further */
@media (max-width: 768px) {
  .circleSvg {
    max-width: 300px;
    max-height: 300px;
  }
}
```

---

## Related Issues
- **ISSUE-47**: Highlight New Progression Tile on Add (visual feedback when chord added)
- **ISSUE-48**: Replace "0/8" with Clearer Capacity Indicator (reinforces progression limit)

## Testing Checklist
- [ ] Button click triggers animation once, completes without lingering
- [ ] Button disabled state appears/disappears correctly based on chord selection and progression fullness
- [ ] Chromatic circle is centered vertically on desktop (1280px × 720px minimum viewport)
- [ ] Controls section doesn't overlap circle on any viewport size >= 768px
- [ ] On mobile (< 768px), layout stacks vertically without horizontal scroll
- [ ] Circle SVG updates polygon points on window resize (responsive)
- [ ] Title tooltip appears on hover (native browser behavior)
- [ ] ESLint: `npm run lint` passes
- [ ] TypeScript: `npx tsc --noEmit` passes in strict mode
- [ ] No console errors or warnings in dev tools
