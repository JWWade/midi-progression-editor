# ISSUE-E4-02 - Add @tonejs/midi and MIDI file builder

## Objective
Install `@tonejs/midi` and implement a pure function that converts a chord progression into a downloadable `.mid` binary. This is the core engine behind the export feature.

## Background
All pitch-class resolution is client-side:
- Named chords: `getChordNoteIndices(root, quality)` from `client/src/features/chord/utils/transpose.ts`.
- Custom / primitive-shape chords: `chord.customNotes` (already contains pitch classes — no quality lookup needed).

Voicing is provided by the utilities from E4-01 (`closeVoiceChord`, `minimalMotionVoicing`).

No quality name mapping from frontend camelCase to backend PascalCase is required — this module makes no backend calls.

## Dependency
```bash
cd client
npm install @tonejs/midi
```
Verify Vite ESM compatibility before proceeding with implementation.

## Export Options Type
```ts
interface MidiExportOptions {
  bpm: number;          // 40–240, default 120
  beatsPerChord: number; // 1 | 2 | 4, default 2
}
```

## Function Contract
```ts
buildMidiFile(chords: Chord[], options: MidiExportOptions): Uint8Array
```
- Returns raw MIDI bytes suitable for creating a `Blob` with `type: "audio/midi"`.
- Single track output.
- Pitch-class resolution per chord:
  - If `chord.customNotes` is non-empty → use those pitch classes directly.
  - Otherwise → `getChordNoteIndices(chord.root, chord.quality)`.
- Voicing:
  - First chord → `closeVoiceChord(pitchClasses)`.
  - Each subsequent chord → `minimalMotionVoicing(prevMidi, pitchClasses)`.
- All notes in a chord start at the same tick, duration = one chord slot (tick length derived from BPM and `beatsPerChord`).
- Velocity: 100 for all notes.

## Files To Add
- `client/src/features/midi-export/utils/midiBuilder.ts` — `MidiExportOptions` interface, `buildMidiFile` function

## Files To Edit
- `client/package.json` — adds `@tonejs/midi` dependency

## Acceptance Criteria
- `buildMidiFile` called with a C major then G major chord (default options) returns a non-empty `Uint8Array` beginning with the MIDI header magic bytes `4D 54 68 64`.
- The output for a CMaj7 chord contains exactly 4 note-on events on the track.
- The output for a plain C major triad contains exactly 3 note-on events.
- A chord whose `customNotes = [0, 4, 8]` exports those exact pitch classes, ignoring the chord's `quality` field.
- BPM changes in `MidiExportOptions` produce different tick timings in the output.
- `npm run build` from `client/` passes with zero errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
