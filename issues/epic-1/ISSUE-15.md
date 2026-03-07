# ISSUE-15 — Frontend: Show Polygon Shape Morphing Between Two Chords

## User Story

As a user, I want to see **how the polygon morphs** when I move from one chord to another so I can understand the geometric transformation (rotation, reflection, expansion).

## Summary

Animate the chord polygon as it transitions from one chord to another. This powerful visualization shows harmonic movement as continuous geometric transformation rather than discrete jumps.

## Requirements

### Data & State
- Extend ISSUE-14 two-chord selection to trigger animation
- State tracks:
  - `fromChord: ChordShape`
  - `toChord: ChordShape`
  - `morphProgress: 0..1` (animation progress, 0 = from, 1 = to)

### Animation
- On chord change, animate `morphProgress` from 0 to 1 over a duration (e.g., 300-500ms)
- Use `requestAnimationFrame` or React animation library (e.g., Framer Motion) for smooth frame rate

- Linear interpolation between chord shapes:
  ```ts
  const morphedPoint = {
    x: fromPoint.x + (toPoint.x - fromPoint.x) * morphProgress,
    y: fromPoint.y + (toPoint.y - fromPoint.y) * morphProgress
  };
  ```

### Visualization
- Render the **intermediate chord polygon** as it morphs
- Styling options:
  - Change fill opacity during morph (fade between colors)
  - Or: Render both endpoint chords semi-transparent during morph
  - Stroke: keep visible throughout (2px)
  
- Optional: Render **vertex labels** (note names) that update during morph

### Frontend Architecture
- Create `src/features/chord-morphing/` feature
  - Or extend existing chord/voice-leading feature
  
- Create `src/features/chord-morphing/hooks/useChorMorph.ts`
  ```ts
  export function useChordMorph(fromChord: ChordShape, toChord: ChordShape) {
    const [morphProgress, setMorphProgress] = useState(0);
    useEffect(() => {
      // Animate morphProgress from 0 to 1
      // Return animated points
    }, [fromChord, toChord]);
    return { morphedPoints, morphProgress };
  }
  ```

- Create `src/features/chord-morphing/utils/morphing.ts`
  - Export `morphPoints(fromPoints: Point[], toPoints: Point[], progress: number): Point[]`
  - Handles point count mismatches (pad with nulls or interpolate)

- Update SVG polygon rendering:
  - Use morphed point coordinates instead of static ones
  - Re-render on each animation frame

### Constraints
- Both chords must be same type (same vertex count)
- Animation duration fixed (no speed control yet)
- Linear interpolation only (no easing functions yet)
- No automatic morphing (only on manual chord change)

## Acceptance Criteria
- [ ] Morphing animation triggers when either chord changes
- [ ] Animation is smooth and visually continuous (no jank)
- [ ] Duration is 300-500ms (user-perceivable but not slow)
- [ ] Polygon vertices follow smooth paths during morph
- [ ] Color/opacity changes during morph (if implemented)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
- [ ] Works with all chord types (triads, sevenths)

## Implementation Notes

### Animation Timing
Use `useEffect` with `requestAnimationFrame`:
```ts
useEffect(() => {
  let animationId: number;
  let startTime = Date.now();
  const duration = 400; // ms
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    setMorphProgress(progress);
    
    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  };
  
  animate();
  return () => cancelAnimationFrame(animationId);
}, [fromChord, toChord]);
```

### Point Interpolation
```ts
function interpolatePoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t
  };
}
```

### Easing (Future Enhancement)
For now, linear. Later could add:
- `easeInOutCubic` for more polished feel
- `overShoot` for bouncy effect

### Visual Polish
Consider:
- Fading the "from" chord as "to" chord fades in
- Or: Rendering both semi-transparent during morph with morph lines showing motion

## Related Issues
- **ISSUE-14**: Show Voice-Leading Paths Between Two Chords (prerequisite)
- **ISSUE-13**: Animate Shape When Chord Changes (related animation concept)
- **ISSUE-16**: Show Multiple Shapes Layered (different visual approach)

## Testing Checklist
- [ ] Animation triggers on chord change
- [ ] Morphing is visually smooth (60fps target)
- [ ] Endpoint chords match morphProgress 0 and 1
- [ ] All intermediate states valid (no polygon self-intersections)
- [ ] Works with all chord types
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied
- [ ] Performance acceptable (profile if needed)

