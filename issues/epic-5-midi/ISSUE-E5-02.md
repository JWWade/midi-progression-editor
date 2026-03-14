# ISSUE-E5-02 — Wire audio playback to the Current Chord panel

## Objective
Add a "Play ▶" button to `CurrentChordPanel` that previews the selected chord through the browser using the existing Web Audio API infrastructure (`useAudioPlayback`). This is the highest-value gap in the current product: audio synthesis is fully built but completely unreachable by users.

## Background
`useAudioPlayback()` in `client/src/features/audio/` is complete and returns `{ isPlaying, play, stop }`. `playChord(notes, options)` accepts `ChordNoteInfo[]`, not MIDI numbers. `transposeChord()` produces `ChordNoteInfo[]` from intervals and a root index.

`CurrentChordPanel` already:
- Holds `noteIndices` (pitch classes for the current chord)
- Has access to `pitchClasses` via `useEnharmonic()`
- Uses `useCallback`/`useState` patterns consistent with this change

`playChord` uses oscillator synthesis with an ADSR envelope; default duration is `1200ms` (1.2s). The `play` call returns a `Promise` that resolves on completion.

## Files To Edit
- `client/src/features/current-chord/components/CurrentChordPanel.tsx`
- `client/src/features/current-chord/components/CurrentChordPanel.module.css`

## Files NOT Changed
- `audioUtils.ts` — no changes needed
- `useAudioPlayback.ts` — no changes needed

## Implementation Notes

### Getting `ChordNoteInfo[]` for playback
`transposeChord` is already available from `@/features/chord/utils/transpose`. Use it to build the notes array:

```ts
import { transposeChord, CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import { useAudioPlayback } from "@/features/audio";

// Named chord:
const notes = transposeChord(CHORD_INTERVALS[chord.quality], chord.root, pitchClasses);

// Custom chord:
const notes = chord.customNotes.map((idx) => ({
  index: idx,
  name: pitchClasses[idx],
  role: "root" as const,
}));
```

### Play button behaviour
- Calls `play(notes)` on press; button label becomes "■ Stop" while `isPlaying === true`
- Pressing while playing calls `stop()`
- Only rendered when `chord !== null`
- Separate from "Add to Progression" — secondary style, placed alongside the "Copy notes" button added in the previous sprint

### Button placement
Place the play button alongside the existing "Copy notes" button in a shared action row below the `rootQualityRow`:

```tsx
<div className={styles.actionRow}>
  <button className={styles.playButton} onClick={...}>▶ Play</button>
  <button className={styles.copyButton} onClick={...}>Copy notes</button>
</div>
```

## New CSS Classes Needed
```css
.actionRow   { display: flex; gap: 8px; justify-content: center; margin-top: 8px; }
.playButton  { /* same secondary pill style as .copyButton */ }
.playButtonActive { /* tinted while isPlaying */ }
```

The `.copyButton` margin-top added in the previous sprint should be moved to `.actionRow`.

## Acceptance Criteria
- [ ] Selecting a chord on the circle and clicking "▶ Play" plays the chord through the browser
- [ ] Button label changes to "■ Stop" while audio is playing
- [ ] Clicking "■ Stop" while playing stops audio immediately
- [ ] Audio stops automatically when the 1.2s duration elapses (no stuck `isPlaying` state)
- [ ] Play button is not rendered when `chord === null`
- [ ] Custom/dragged chords play the correct (custom) pitches
- [ ] Works in both light and dark themes
- [ ] `npm run lint` passes with `--max-warnings=0`

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
