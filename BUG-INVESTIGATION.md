# BUG Investigation: Chord Vertex Inspection Not Working

## Symptom
The UI displays the message "Click a chord vertex to inspect its tone" in the ToneInfoPanel, but clicking on chord vertices in the chromatic circle does not trigger the inspection panel to show tone information.

## Debug Logging Added
Console.log statements have been added to:
1. `ChromaticCircle.tsx` - both from and to vertex onClick handlers
   - Logs: `[DEBUG] From/To vertex clicked: {noteName}, {details}`
2. `ToneInfoPanel.tsx` - component render method
   - Logs: `[DEBUG] ToneInfoPanel rendered with selectedTone: {value}`

## Investigation Steps

1. **Open the app in browser** at http://localhost:5175
2. **Open browser DevTools Console** (F12 → Console tab)
3. **Click on a chord vertex** in the chromatic circle
4. **Check console output**:
   - If you see `[DEBUG] From/To vertex clicked:` → onClick handlers ARE firing ✓
   - If you DON'T see it → onClick handlers NOT firing ✗
5. **Check how ToneInfoPanel logs change**:
   - Initial: `[DEBUG] ToneInfoPanel rendered with selectedTone: null`
   - After clicking vertex: Should show `selectedTone: {note, role, interval, frequency, chordLabel}`
   - If still null → state update not persisting

## Expected Behavior When Working
1. Click on chord vertex (e.g., C note in From Chord triangle)
2. Console shows: `[DEBUG] From vertex clicked: C ...`
3. ToneInfoPanel logs: `[DEBUG] ToneInfoPanel rendered with selectedTone: {...}`
4. UI shows: Chord tone details (role, interval, frequency)
5. Vertex appears highlighted (yellow circle, larger radius)
6. Press Escape or click background to deselect

## Files Modified
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx` - Added debug logs to vertices' onClick handlers
- `client/src/features/chord-inspection/components/ToneInfoPanel.tsx` - Added debug log to render
- `BUG-INVESTIGATION.md` - This file (created)

## Branch
`bugfix/chord-vertex-inspection` (off develop)
