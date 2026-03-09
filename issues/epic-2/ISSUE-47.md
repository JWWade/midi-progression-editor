# ISSUE-47 — Highlight New Progression Tile on Add

## User Story

As a user, I want to **see exactly which chord I just added** to the progression sidebar so that the connection between my action (clicking "Add to Progression") and the resulting change is immediately clear.

## Summary

When a chord is added to the progression, the new tile should flash briefly with a highlight animation, and the sidebar should automatically scroll to reveal it. Keyboard focus should also move to the new tile for accessibility.

---

## Requirements

### Visual Feedback: Tile Highlight Animation

**Affected files**
- `client/src/features/progression-sidebar/components/ChordTile.tsx`
- `client/src/features/progression-sidebar/components/ChordTile.module.css`

#### Animation Specification
- Create a CSS keyframe `@keyframes tileHighlight`:
  - Duration: 250–350 ms
  - Background color: Chord's quality color at **low alpha** (e.g., `rgba(79, 70, 229, 0.15)` for indigo)
  - Easing: `ease-out` or `ease-in-out`
  - Animation path: Starts at highlighted state, fades back to normal
  - Guard with `prefers-reduced-motion` media query: skip animation if user prefers reduced motion

#### Props and State
- Add `isNew: boolean` prop to `ChordTile`
- When `isNew === true`, apply CSS class `.tileHighlight` that triggers the animation
- `onAnimationEnd` handler removes the `.tileHighlight` class automatically, preventing re-triggers on re-renders

#### Code Example
```tsx
// ChordTile.tsx
interface ChordTileProps {
  chord: Chord;
  index: number;
  isNew?: boolean;
  onPreview?: (chord: Chord) => void;
  onDelete?: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
}

export const ChordTile: React.FC<ChordTileProps> = ({ 
  chord, 
  index, 
  isNew = false,
  onAnimationEnd 
}) => {
  return (
    <div 
      className={`${styles.tile} ${isNew ? styles.tileHighlight : ''}`}
      onAnimationEnd={onAnimationEnd}
      data-chord-tile={`chord-${index}`}
    >
      {/* Tile content */}
    </div>
  );
};
```

```css
/* ChordTile.module.css */
.tile {
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tileHighlight {
  animation: tileHighlight 0.3s ease-out forwards;
}

@keyframes tileHighlight {
  0% {
    background-color: rgba(79, 70, 229, 0.15);
  }
  100% {
    background-color: transparent;
  }
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .tileHighlight {
    animation: none;
  }
}
```

---

### Auto-Scroll: Reveal New Tile

**Affected files**
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`

#### Scroll Behavior
- In `ProgressionSidebar`, maintain a `newTileIndex: number | null` state
- After `addChord()` action succeeds, set `newTileIndex` to the newly added chord's index
- Use a `useRef` on each tile to capture the DOM node: `const tileRef = useRef<HTMLDivElement>(null)`
- Call `tileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` when the ref is set and `isNew === true`
- Guard scroll behavior with `window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'` for accessibility

#### Code Example
```tsx
// ProgressionSidebar.tsx
const [newTileIndex, setNewTileIndex] = useState<number | null>(null);
const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

useEffect(() => {
  if (newTileIndex !== null && tileRefs.current[newTileIndex]) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    tileRefs.current[newTileIndex]?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }
}, [newTileIndex]);

const handleTileAnimationEnd = () => {
  setNewTileIndex(null);
};

return (
  <div className={styles.tileList}>
    {chords.map((chord, index) => (
      <ChordTile
        key={index}
        ref={(el) => { tileRefs.current[index] = el; }}
        chord={chord}
        index={index}
        isNew={newTileIndex === index}
        onAnimationEnd={handleTileAnimationEnd}
        // ... other props
      />
    ))}
  </div>
);
```

---

### Keyboard Focus: Move Focus to New Tile

**Affected files**
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/progression-sidebar/components/ChordTile.tsx`

#### Focus Management
- After the tile is scrolled into view, move keyboard focus to it:
  - Each tile should have `tabIndex={0}` so it can receive focus programmatically
  - Call `tileRef.current?.focus()` after `scrollIntoView()` completes
  - Ensure the tile has a visible focus indicator (outline or ring) via `:focus-visible`

#### Code Example
```tsx
// ProgressionSidebar.tsx
useEffect(() => {
  if (newTileIndex !== null && tileRefs.current[newTileIndex]) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    tileRefs.current[newTileIndex]?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
    
    // Move focus after scroll completes (setTimeout for smooth scroll to settle)
    setTimeout(() => {
      tileRefs.current[newTileIndex]?.focus();
    }, 300);
  }
}, [newTileIndex]);

// ChordTile.tsx
<div 
  ref={ref}
  tabIndex={0}
  className={`${styles.tile} ${isNew ? styles.tileHighlight : ''}`}
  onAnimationEnd={onAnimationEnd}
  data-chord-tile={`chord-${index}`}
  role="button"
  aria-label={`${chord.name}, position ${index + 1}`}
>
  {/* Tile content */}
</div>
```

```css
/* ChordTile.module.css */
.tile:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}
```

---

## Acceptance Criteria

- [ ] New tile flashes for 250–350 ms, then returns to its normal appearance
- [ ] Flash uses the chord's quality color at low alpha
- [ ] Sidebar automatically scrolls to show the new tile when the list is long
- [ ] Scroll behavior is smooth unless `prefers-reduced-motion: reduce` is set
- [ ] Keyboard focus moves to the new tile after add
- [ ] Focus indicator is visible with `:focus-visible` outline
- [ ] Animation does not replay on re-renders (prevented by `onAnimationEnd` handler)
- [ ] Animation is skipped if `prefers-reduced-motion: reduce` is active
- [ ] Tile has `aria-label` with chord name and position
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

## Implementation Notes

### Animation Lifecycle
1. User clicks "Add to Progression →" button from Current Chord Panel
2. `addChord()` action is dispatched in `App.tsx`
3. New chord appended to `chords` array in state
4. `ProgressionSidebar` receives updated `chords` prop
5. Newly added tile renders with `isNew={true}`
6. CSS animation `.tileHighlight` triggers immediately
7. `onAnimationEnd` is fired after 300 ms
8. Handler calls `setNewTileIndex(null)`, removing the animation class
9. Animation does not replay because the class is removed

### Scroll SafeGuards
- Only scroll if the tile is not already in view
- Use `scrollIntoView({ block: 'nearest' })` to minimize unnecessary scrolling
- Delay focus move to allow scroll animation to settle (~300 ms timeout)

### Accessibility Checklist
- [ ] `tabIndex={0}` allows programmatic focus
- [ ] `:focus-visible` provides keyboard navigation feedback
- [ ] `aria-label` announces tile position and chord name to screen readers
- [ ] Animation respects `prefers-reduced-motion` preference

---

## Related Issues

- **ISSUE-46**: Strengthen Primary Action & Reorient Layout (button that triggers the add)
- **ISSUE-48**: Replace "0/8" with Clearer Capacity Indicator (shows progression fullness)
- **ISSUE-53**: Add Preview and Delete Actions to Progression Tiles (extends tile actions)
- **ISSUE-54**: Add "Undo Last Add" Toast (undo flow that works with this feedback)

## Testing Checklist

- [ ] Add a chord; verify the new tile flashes for ~300 ms
- [ ] Flash color matches the chord's quality color at low alpha
- [ ] If sidebar is scrolled to bottom, adding a chord scrolls to show the new tile
- [ ] Sidebar scroll is smooth (not instant) unless `prefers-reduced-motion: reduce`
- [ ] Keyboard focus moves to the new tile after add (verify with Tab key or `document.activeElement`)
- [ ] Focus indicator is visible (blue outline or equivalent)
- [ ] Re-render of props does not re-trigger animation
- [ ] Add with `prefers-reduced-motion: reduce` enabled in browser dev tools; animation is skipped
- [ ] Multiple rapid adds: only the most recent tile flashes (not all at once)
- [ ] ESLint: `npm run lint` passes
- [ ] TypeScript: `npx tsc --noEmit` passes in strict mode
- [ ] No console errors or warnings in dev tools
- [ ] Screen reader announces new tile position and chord name
