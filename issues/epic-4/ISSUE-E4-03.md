# ISSUE-E4-03 - Add MIDI export controls and sidebar integration

## Objective
Expose the MIDI export capability (built in E4-02) through a UI that lives in the footer of the existing `ProgressionSidebar`. The user configures BPM and beats-per-chord, then clicks "Export .mid" to download the file.

## Dependencies
- E4-01 (voicing utilities) must be merged first.
- E4-02 (`buildMidiFile` + `@tonejs/midi`) must be merged first.

## New Components and Hooks

### `MidiExportControls`
```
client/src/features/midi-export/components/MidiExportControls.tsx
```
- Props:
  ```ts
  interface MidiExportControlsProps {
    disabled: boolean;
  }
  ```
- Renders:
  - A labelled number input for BPM (range 40–240, default 120, step 1).
  - A labelled `<select>` for beats per chord (options: 1, 2, 4; default 2).
  - An "Export .mid" `<button>`.
- When `disabled` is `true`, the button is disabled and visually indicates no progression is available.
- Calls `useMidiExport` internally to retrieve the download handler and current options state.

### `useMidiExport`
```
client/src/features/midi-export/hooks/useMidiExport.ts
```
- Signature:
  ```ts
  function useMidiExport(chords: Chord[]): {
    bpm: number;
    setBpm: (v: number) => void;
    beatsPerChord: number;
    setBeatsPerChord: (v: number) => void;
    exportMidi: () => void;
  }
  ```
- `exportMidi` calls `buildMidiFile(chords, { bpm, beatsPerChord })`, wraps the result in a `Blob` (`type: "audio/midi"`), creates a transient `<a>` element, sets `download="progression.mid"`, clicks it, then revokes the object URL.
- Does not throw if `chords` is empty (guard is handled in the component via `disabled`).

## ProgressionSidebar Changes
```
client/src/features/progression-sidebar/components/ProgressionSidebar.tsx
```
- Import and mount `MidiExportControls` at the bottom of the `<aside>`, after the `fullIndicator` block.
- Pass `disabled={chords.length === 0}`.
- Pass `chords` down to `useMidiExport` inside `MidiExportControls` (or lift invocation into the sidebar — whichever keeps the component boundary clean without prop drilling `chords` through two layers).

Preferred approach: `MidiExportControls` accepts `chords: Chord[]` as a prop and calls `useMidiExport(chords)` internally, so the sidebar just passes `chords={chords} disabled={chords.length === 0}`.

Revised props:
```ts
interface MidiExportControlsProps {
  chords: Chord[];
  disabled: boolean;
}
```

## Files To Add
- `client/src/features/midi-export/components/MidiExportControls.tsx`
- `client/src/features/midi-export/hooks/useMidiExport.ts`

## Files To Edit
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` — mount `MidiExportControls` in footer

## Files NOT Changed
- `client/src/app/App.tsx` — export controls live inside the sidebar; no layout changes at the app level.

## Acceptance Criteria
- With 0 chords in the progression: the "Export .mid" button is present but disabled.
- With 1+ chords: the button is enabled; clicking it triggers a `.mid` file download named `progression.mid`.
- Changing BPM from 120 to 60 produces a file with proportionally longer note durations.
- Changing beats-per-chord from 2 to 4 doubles the chord duration in the exported file.
- The controls are visually part of the sidebar footer — they do not appear in the main canvas area.
- BPM input rejects values outside 40–240 (browser validation or guarded state update).
- `npm run lint` passes with zero warnings.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
Manual verification:
1. Add 4 chords to the progression.
2. Set BPM to 120, beats-per-chord to 2.
3. Click "Export .mid".
4. Open the downloaded file in a MIDI player or DAW — 4 chords should each be 1 bar at 120 BPM.
5. Repeat with beats-per-chord = 4 — each chord should occupy 2 bars.
