# ISSUE-17 — Frontend: Display Note Names at Chord Vertices

## User Story

As a user, I want to **hover or click** on a vertex and see the note name so I can connect the geometry to musical meaning.

## Summary

Add interactive labels showing the note name (e.g., "C", "E", "G") at each chord polygon vertex. This bridges the visual geometry to the underlying music theory.

## Requirements

### Visual Elements
- Render **text labels** at each polygon vertex position
  - Label content: note name (e.g., "C", "E", "G", "C#", "Bb")
  - Font size: 12-14px, bold or semi-bold
  - Color: matches or contrasts with vertex color
  - Background: optional light background behind text for readability (e.g., white box)

### Interaction Options
- **Option A**: Always visible (simpler, but can clutter the UI)
- **Option B**: Visible on hover over vertex or chord
- **Option C**: Toggle button to show/hide all labels
- Recommend **Option A** for foundational clarity

### Label Positioning
- Offset labels **slightly outward** from vertex
  - E.g., 15-20px further from circle center
  - Prevents overlap with circle nodes
  
- Use angle to position label appropriately:
  ```ts
  const labelDistance = circleRadius + 30;
  const labelX = cx + labelDistance * sin(angle);
  const labelY = cy - labelDistance * cos(angle);
  ```

### Frontend Architecture
- Create `src/features/chord/components/ChordLabel.tsx`
  - Props: `{ point: Point, noteName: string, noteIndex: number }`
  - Renders `<text>` SVG element at positioned coordinates
  
- Update chord polygon rendering in `ChromaticCircle.tsx`:
  - After rendering polygon, render a label for each vertex
  - Pass vertex point and corresponding note name
  - Handle label text alignment (anchor, dominantBaseline)

### Styling
- SVG text styling:
  ```tsx
  <text
    x={labelX}
    y={labelY}
    textAnchor="middle"
    dominantBaseline="middle"
    fontSize="12"
    fontWeight="600"
    fill="#1F2937"
  >
    {noteName}
  </text>
  ```

### Constraints
- Always-visible labels (no hover state for this issue)
- No background boxes yet (text only)
- No interaction with labels (clicking doesn't trigger anything)
- Label text centered on coordinates

## Acceptance Criteria
- [ ] Text labels render at each chord vertex
- [ ] Label text matches the note name (C, E, G, etc.)
- [ ] Label positioning is clear and readable (no overlap with circle)
- [ ] Label color contrasts with background
- [ ] Labels update when chord changes
- [ ] Works with all chord types (triads, sevenths)
- [ ] Responsive repositioning on viewport resize
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Implementation Notes

### Label Offset Calculation
Given vertex point on circle, offset label outward:
```ts
const angle = Math.atan2(vertex.y - cy, vertex.x - cx);
const labelDistance = circleRadius + 30;
const labelX = cx + labelDistance * Math.cos(angle);
const labelY = cy + labelDistance * Math.sin(angle);
```

### Text Anchor & Baseline
Ensure text is centered on the calculated position:
```tsx
textAnchor="middle"       {/* horizontal center */}
dominantBaseline="middle" {/* vertical center */}
```

### Font Selection
Use monospace or medium-weight sans-serif for clarity:
- Example: `font-family: "Menlo", "Monaco", "monospace"`
- Or: `font-family: system-ui, sans-serif`

### Accidental Notation
Ensure # and b characters display clearly:
- Test with C#, D#, Eb, Bb, Gb, etc.
- May need special encoding or Unicode characters

## Related Issues
- **ISSUE-16**: Add Chord Selector Dropdown (builds on chord selection)
- **ISSUE-09**: Display C Major Chord as Triangle (foundational)
- **ISSUE-18**: Show Chord Tone Roles (Roles: root, third, fifth)

## Testing Checklist
- [ ] Labels visible for all chord vertices
- [ ] Label text correctly matches note names
- [ ] Positioning clear and readable (no overlap)
- [ ] Works with all 12 note names (including accidentals)
- [ ] Labels update on chord change
- [ ] Responsive to viewport resizing
- [ ] No console errors
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied
- [ ] Accidentals display correctly (# and b)

