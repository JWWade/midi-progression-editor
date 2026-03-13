# ISSUE-E4-01 - Add voice-leading voicing utilities

## Objective
Populate the empty `voice-leading` feature directory with close-voicing and minimal-motion-voicing algorithms. These utilities are the pitch-placement foundation used by the MIDI builder in E4-02.

## Background
`client/src/features/voice-leading/` currently exists as an empty placeholder. The MIDI formula in use throughout the app is `midiNote = 12 * (octave + 1) + pitchClass` (from `audioUtils.ts`), which must be kept consistent here.

## Algorithm Contracts

### `closeVoiceChord`
```ts
closeVoiceChord(pitchClasses: number[], startOctave?: number): number[]
```
- `pitchClasses`: array of pitch classes (0–11), first element is treated as the root.
- `startOctave`: the octave in which the root is placed (default: 4).
- Returns absolute MIDI note numbers.
- Each subsequent note is placed at the nearest pitch class at or above the previous MIDI note (close position, no drops).

### `minimalMotionVoicing`
```ts
minimalMotionVoicing(prevMidi: number[], nextPitchClasses: number[]): number[]
```
- `prevMidi`: the MIDI note numbers from the immediately preceding voiced chord.
- `nextPitchClasses`: pitch classes (0–11) for the next chord.
- Returns absolute MIDI note numbers.
- Minimises total MIDI distance from the previous chord by selecting the best octave placement per voice.
- Tie-break: prefer lower MIDI note number.

## Files To Add
- `client/src/features/voice-leading/utils/voicing.ts` — `closeVoiceChord`, `minimalMotionVoicing`
- `client/src/features/voice-leading/index.ts` — barrel export for both functions

## Files To Edit
None — this is a greenfield module.

## Acceptance Criteria
- `closeVoiceChord([0, 4, 7])` with default octave 4 returns `[60, 64, 67]` (C4 E4 G4).
- `closeVoiceChord([0, 4, 7, 11])` returns `[60, 64, 67, 71]` (C4 E4 G4 B4).
- `minimalMotionVoicing([60, 64, 67], [5, 9, 0])` returns notes that minimise total semitone movement from C4 E4 G4 toward F major (F E A / F A C variants — lowest total motion wins).
- No runtime dependency on the backend or any external library.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
