# BUG Investigation: Chord Vertex Inspection Not Working

## Symptom
The UI displays the message "Click a chord vertex to inspect its tone" in the ToneInfoPanel, but clicking on chord vertices in the chromatic circle does not trigger the inspection panel to show tone information.

## Code Structure Findings

### Current Implementation
1. **ChromaticCircle.tsx** (lines ~543 and ~575):
   - Renders clickable vertices as SVG `<circle>` elements for both "From" and "To" chords
   - Each vertex has `onClick` handlers that call `setSelectedTone()` with ToneInfo object
   - Vertices include styling for selected state (larger radius, colored fill/stroke)
   - `style={{ cursor: "pointer" }}` indicates they should be clickable

2. **ToneInfoPanel.tsx** (lines 60-78):
   - Displays placeholder text when `selectedTone === null`
   - Shows tone details (note name, role, interval, frequency) when `selectedTone` is set
   - Panel is absolutely positioned (right: 20, top: 100)

3. **SVG Container**:
   - Main SVG has `onClick={deselectTone}` to clear selection when background is clicked
   - Vertex circles rendered after polygons in render order
   - Each vertex has `aria-label` for accessibility

## Hypotheses to Investigate
1. **Pointer Events Blocked**: Something might be blocking pointer events from reaching the vertex circles
2. **Vertex Rendering Issue**: Vertices might not be rendering at all or in incorrect positions
3. **State Management**: `selectedTone` might not be updating despite onClick handler firing
4. **Z-index/Layering**: Vertices might be behind other SVG elements (polygons, labels, etc.)
5. **Event Handler Not Attached**: onClick handlers might not be properly attached in React render

## Next Steps
1. Start the dev server and open browser DevTools
2. Inspect the SVG to verify vertex circles are present and clickable
3. Add console.log statements to the onClick handlers
4. Check if there are CSS rules preventing pointer events (e.g., `pointer-events: none` on container)
5. Verify `VERTEX_RADIUS` (6px) is large enough to be clickable
6. Check if there's a wrapper element with `pointer-events: none` that's blocking clicks

## Files to Examine
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx` (vertex rendering)
- `client/src/features/chord-inspection/components/ToneInfoPanel.tsx` (display)
- Root SVG container and any CSS that might affect pointer events
