# ISSUE-24 — Frontend: Color-Responsive Chromatic Circle

## User Story

As a user, I want the **chromatic circle to subtly change color based on the selected key and the chord I'm building** so I can understand harmonic context at a glance.

## Summary

The chromatic circle should respond visually to both the active key and the current chord by shifting its ambient color. This gives the user an immediate, glanceable signal about harmonic context without requiring them to read labels.

## Requirements

### Visual Requirements
- The circle's background, ring, or ambient color should subtly shift based on:
  - The currently selected **key** (e.g., C major → one hue, F# major → another hue)
  - The **chord quality** being constructed (major, minor, diminished, etc.)
- Color changes should be **subtle** — not overwhelming the note labels or geometry
- Transition should be smooth (e.g., CSS transition or short animation)

### Data Requirements
- The circle component receives the selected key (root note + mode) as a prop or from shared state
- The circle component receives the current chord quality as a prop or from shared state
- A mapping table or function maps `(key, quality)` → color value

### Frontend Architecture
- Create or update `src/features/chromatic-circle/utils/circleColors.ts`
  - Export `getCircleColor(key: Note, quality: ChordQuality): string`
  - Returns a CSS color string (e.g., HSL with defined lightness/saturation ranges)
- Update `ChromaticCircle.tsx` to consume the color and apply it to the SVG background or ring element
- Use `useMemo` or similar to avoid unnecessary recalculations

### Constraints
- Color changes must not reduce contrast to the point where note labels are unreadable
- Transitions should respect `prefers-reduced-motion` media query
- No external color-manipulation library required; pure CSS/HSL arithmetic is sufficient

## Acceptance Criteria
- [ ] Circle color shifts when the selected key changes
- [ ] Circle color shifts when the chord quality changes
- [ ] Color change is subtle and does not obscure note labels or geometry
- [ ] Transition animation is smooth and respects `prefers-reduced-motion`
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-25**: Diatonic Transparency on Chromatic Circle
- **ISSUE-26**: Chord-tone Emphasis with Expressive Color
- **ISSUE-32**: Quality-based Color Groups for Chord Types
- **ISSUE-42**: Shared Color Grammar Across Circle, Panel, and Sidebar
