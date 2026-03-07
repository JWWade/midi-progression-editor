# ISSUE-19 — Frontend: Animate Chord Shape Changes Smoothly

## User Story

As a user, I want the polygon to **smoothly morph** when I change chords so I can see the transformation as a continuous motion rather than a jump.

## Summary

Build on ISSUE-15's morphing logic to apply it whenever the current chord changes (via selector, not separate "from/to" selection). This makes every chord change feel fluid and helps users track the geometric transformation.

## Requirements

### Animation Trigger
- Animation automatically triggers when:
  - User selects a new chord from dropdown
  - User changes root note
  - User changes chord quality/type
  - User changes scale

### Animation Parameters
- **Duration**: 300-400ms (adjustable)
- **Easing**: Start with linear, optionally add easing functions (easeInOutQuad, easeInOutCubic)
- **Target**: Morph polygon vertices to new chord positions

### Visualization
- Render the **morphing polygon** real-time during animation
- Stroke remains visible throughout
- Optional: Change opacity or color during morph to indicate state change

### Frontend Architecture
- Create/extend `src/features/chord-animation/hooks/useChordMorphing.ts`
  - Input: current chord shape, previous chord shape
  - Output: animated points, morphing progress
  - Handles auto-trigger on chord change

- Update `ChromaticCircle.tsx` or chord polygon rendering:
  - Use morphed points instead of static points
  - Depends on `useChordMorphing` hook
  - Re-render on each animation frame

### Constraints
- Automatic trigger (no manual "animate" button)
- Single animation duration (no speed control)
- Linear or basic easing (no elastic or bounce effects)
- Works with any chord type (triads, sevenths)

## Acceptance Criteria
- [ ] Chord polygon animates on every chord change
- [ ] Animation is smooth and visually continuous
- [ ] Duration is perceptible (300-400ms)
- [ ] All vertices follow accurate paths during morph
- [ ] Animation completes before next chord change is allowed (or handles overlapping)
- [ ] Works with all chord selectors (dropdown, root change, type change)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Implementation Notes

### Animation Trigger Detection
Detect chord change via `useEffect` dependency:
```ts
useEffect(() => {
  // Trigger morph animation when chord changes
  startAnimation();
}, [current Chord data]);
```

### Morphing Hook Pattern
```ts
export function useChordMorphing(currentChord: NoteInfo[]) {
  const [morphedPoints, setMorphedPoints] = useState<Point[]>([]);
  const previousChordRef = useRef<NoteInfo[]>([]);
  
  useEffect(() => {
    if (!isEqual(previousChordRef.current, currentChord)) {
      animateToNewChord(previousChordRef.current, currentChord);
      previousChordRef.current = currentChord;
    }
  }, [currentChord]);
  
  return morphedPoints;
}
```

### Easing Functions
Simple easing:
```ts
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
```

Apply to morphProgress:
```ts
const easedProgress = easeInOutQuad(linearProgress);
const morphedPoint = interpolate(from, to, easedProgress);
```

### Handling Overlapping Changes
If user changes chord while animation is pending:
- Option A: Cancel and start new animation immediately
- Option B: Wait for animation to complete
- Recommend **Option A** for responsiveness

## Related Issues
- **ISSUE-15**: Show Polygon Shape Morphing Between Two Chords (foundational pattern)
- **ISSUE-16**: Add Chord Selector Dropdown (trigger source)
- **ISSUE-11**: Rotate Chord Shape Around Circle (another trigger)

## Testing Checklist
- [ ] Animation triggers on chord selector change
- [ ] Animation triggers on root note change
- [ ] Animation triggers on quality type change
- [ ] Animation is visually smooth (60fps target)
- [ ] All endpoints match chord positions (progress 0 and 1)
- [ ] Works with all chord types
- [ ] No jank or stuttering
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied
- [ ] Performance acceptable (profile if needed)

