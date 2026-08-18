# ISSUE-E9-12 — Voice-Lead Keyboard Interaction (WCAG 1.4.13 & 2.1.1)

## Objective

Make the voice-lead line interaction keyboard-accessible or document it as a mouse-only enhancement feature.

## Background

The June 2026 accessibility audit identified that voice-lead lines (visual connectors between chord vertices in the chromatic circle) respond to mouse `onMouseEnter`/`onMouseLeave` events with no keyboard equivalent. This violates WCAG 1.4.13 (Content on Hover or Focus) and WCAG 2.1.1 (Keyboard).

### Current Behavior
- Hovering over a chord vertex highlights voice-leading paths to other chords
- No visual focus indicator or keyboard interaction exists for keyboard/switch-access users

### Acceptable Solutions
WCAG 1.4.13 allows hover-only interactions if they meet all three conditions:
1. Can be dismissed without moving focus (e.g., via Escape key)
2. The hovered content remains visible
3. Dismissal doesn't hide other content

The hover state may already satisfy these, but a keyboard alternative should still be provided for full accessibility.

## Success Criteria

### Approach A: Keyboard-Accessible Voice-Lead Preview (Preferred)
- [ ] Voice-lead lines can be focused via Tab key
- [ ] Focused lines display the same highlighting as hover state
- [ ] A visual focus indicator (outline or glow) is applied to the focused line(s)
- [ ] Enter or Space key (or focus alone) triggers the preview
- [ ] Escape key dismisses the preview
- [ ] Screen reader users receive an `aria-label` describing the voice-leading relationship

### Approach B: Non-Hover Alternative UI
- [ ] Hovering is disabled or provides no interaction
- [ ] Voice-leading information is available via a different UI surface (e.g., ToneInfoPanel text or sidebar button)
- [ ] The feature is documented in a help/tutorial section
- [ ] No functionality is lost for keyboard users

## Implementation Notes

### Option A Technical Details
```jsx
// Example keyboard handler for voice-lead <line>:
<line
  role="button"
  tabIndex={0}
  aria-label="Voice leading from {sourceChord} to {targetChord}"
  onMouseEnter={handleHover}
  onMouseLeave={handleHoverEnd}
  onFocus={handleHover}    // New
  onBlur={handleHoverEnd}  // New
  onKeyDown={(e) => {      // New
    if (e.key === 'Enter' || e.key === ' ') {
      handleHover();
    } else if (e.key === 'Escape') {
      handleHoverEnd();
    }
  }}
/>
```

### Option B Alternative
Modify the ToneInfoPanel to display voice-leading info when a chord vertex is selected:
```
Tone Info Panel:
  [Selected Note]
  Interval: Major Third
  Voice-leading to next chord:
    - [X] Move to D
    - [Y] Move to E
    - [Z] Stay on C
```

## WCAG Criteria

- 1.4.13 Content on Hover or Focus (AA)
- 2.1.1 Keyboard (A)

## Estimated Effort

- Medium (2-4 hours) for Option A
- Medium (2-3 hours) for Option B
- Design discussion recommended before implementation

## Files to Modify

- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`
- `client/src/features/chord-inspection/components/ToneInfoPanel.tsx` (if Option B)
- `client/src/features/chromatic-circle/components/ChromaticCircle.module.css` (for focus indicators)

## Design Decision Required

- Should voice-lead preview be keyboard-accessible, or is a non-hover alternative acceptable?
- If keyboard-accessible, should arrow keys navigate between voice-lead paths?
