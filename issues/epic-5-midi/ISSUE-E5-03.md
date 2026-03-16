# ISSUE-E5-03 — Add progression playback sequencer

## Objective
Add a "▶ Play All" button to `ProgressionSidebar` that plays through every chord in the progression in sequence, with per-chord highlighting as each chord sounds. Uses the existing `useAudioPlayback` infrastructure — no new audio primitives needed.

## Dependencies
- E5-02 should be merged first (confirms `useAudioPlayback` wiring pattern in context)

## Background
`useAudioPlayback` returns `{ isPlaying, play, stop }`, where `play(notes)` resolves after the chord's duration (default 1200ms). A sequencer chains chords by `await`-ing each `play()` call inside an async loop. `ProgressionSidebar` already holds `chords: Chord[]` and uses `useRef` for tile DOM references.

## Files To Add
- `client/src/features/audio/hooks/useProgressionPlayback.ts` — sequencer hook

## Files To Edit
- `client/src/features/audio/index.ts` — export new hook
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` — mount play button + pass `isPlaying` to tiles
- `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css` — button styles
- `client/src/features/progression-sidebar/components/ChordTile.tsx` — accept `isPlaying?: boolean` prop
- `client/src/features/progression-sidebar/components/ChordTile.module.css` — `.tilePlaying` highlight class

## New Hook: `useProgressionPlayback`

```ts
interface UseProgressionPlaybackResult {
  isPlaying: boolean;
  playingIndex: number | null; // index of chord currently sounding; null when stopped
  play: () => void;
  stop: () => void;
}

function useProgressionPlayback(chords: Chord[]): UseProgressionPlaybackResult
```

### Sequencer loop logic
- Use a `cancelledRef = useRef(false)` for stop-signal
- On `play()`: set `cancelledRef.current = false`, iterate chords with `for` loop using `await`
- Each iteration: set `playingIndex = i`, call `await playChord(notes, { duration: 1200 })`, check `cancelledRef` before continuing
- On `stop()`: set `cancelledRef.current = true`, call `stopChord()`, reset state
- Clean up (`cancelledRef.current = true`) on component unmount via `useEffect` return

### `ChordNoteInfo[]` construction (same pattern as E5-02)
```ts
// Named chord:
transposeChord(CHORD_INTERVALS[chord.quality], chord.root, pitchClasses)
// Custom chord:
chord.customNotes.map((idx) => ({ index: idx, name: pitchClasses[idx], role: "root" as const }))
```
Consume `pitchClasses` from `useEnharmonic()` inside the hook.

## ProgressionSidebar Changes

Add play/stop button to the header row, beside the chord count:
```tsx
<button
  className={styles.playAllButton}
  onClick={isPlaying ? stop : play}
  disabled={chords.length === 0}
  aria-label={isPlaying ? "Stop playback" : "Play all chords"}
>
  {isPlaying ? "■ Stop" : "▶ Play All"}
</button>
```

Pass `isPlaying={playingIndex === i}` to each `ChordTile`.

## ChordTile Changes

Add optional prop:
```ts
isPlaying?: boolean; // default false
```

When `true`, apply `styles.tilePlaying` — a subtle pulsing border or background tint:
```css
.tilePlaying {
  outline: 2px solid var(--accent-color);
  background-color: color-mix(in srgb, var(--accent-color) 12%, transparent);
}
```

## Acceptance Criteria
- [ ] "▶ Play All" button appears in sidebar header; disabled when progression is empty
- [ ] Clicking plays each chord from index 0 in sequence
- [ ] The currently-sounding tile is visually highlighted
- [ ] Clicking "■ Stop" halts playback — no next chord starts
- [ ] Playback completes naturally at the end of the last chord
- [ ] Component unmount during playback does not throw errors or leave state stuck
- [ ] `npm run lint` passes with `--max-warnings=0`

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
