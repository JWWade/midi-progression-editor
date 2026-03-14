# ISSUE-E5-04 — Expose octave control in MIDI export

## Objective
Allow users to choose the starting octave for the exported MIDI file. `closeVoiceChord` already accepts `startOctave?: number` as an optional second argument — this issue threads that parameter through the export UI.

## Background
`buildMidiFile` calls `closeVoiceChord(pitchClasses)` without a `startOctave` argument, defaulting to octave 4 (root at C4 = MIDI 60). For many use cases a higher or lower register is desirable, but there is currently no way to change this without editing source code.

`closeVoiceChord` requires **zero modification** — the parameter already exists. This issue is purely about threading the value from UI → hook → builder.

## Files To Edit
- `client/src/features/midi-export/utils/midiBuilder.ts` — add `startOctave` to `MidiExportOptions`; pass to `closeVoiceChord`
- `client/src/features/midi-export/hooks/useMidiExport.ts` — add `startOctave` state (default 4)
- `client/src/features/midi-export/components/MidiExportControls.tsx` — add octave `<select>`
- `client/src/features/midi-export/utils/midiBuilder.test.ts` — add one test for octave shift

## Contract Changes

### `MidiExportOptions`
```ts
interface MidiExportOptions {
  bpm: number;           // 40–240, default 120
  beatsPerChord: number; // 1 | 2 | 4, default 2
  startOctave: number;   // 2–6, default 4
}
```

### `buildMidiFile` — internal change only
```ts
// Before:
const midiNotes = index === 0
  ? closeVoiceChord(pitchClasses)
  : minimalMotionVoicing(prevMidi, pitchClasses);

// After:
const midiNotes = index === 0
  ? closeVoiceChord(pitchClasses, startOctave)
  : minimalMotionVoicing(prevMidi, pitchClasses);
```
`minimalMotionVoicing` is unaffected — it anchors to the previous chord's MIDI notes.

### Range guard (consistent with BPM guard pattern)
```ts
const MIN_OCTAVE = 2;
const MAX_OCTAVE = 6;
if (startOctave < MIN_OCTAVE || startOctave > MAX_OCTAVE) {
  throw new RangeError(`startOctave must be between ${MIN_OCTAVE} and ${MAX_OCTAVE}, got ${startOctave}`);
}
```

### `useMidiExport` additions
```ts
const [startOctave, setStartOctave] = useState(4);
// include startOctave/setStartOctave in return value
// pass startOctave into buildMidiFile call
```

### `MidiExportControls` — new select
Add between BPM input and beats-per-chord select:
```tsx
<label htmlFor="midi-octave">Octave</label>
<select id="midi-octave" value={startOctave} onChange={(e) => setStartOctave(Number(e.target.value))}>
  <option value={2}>2</option>
  <option value={3}>3</option>
  <option value={4}>4</option>
  <option value={5}>5</option>
  <option value={6}>6</option>
</select>
```

## New Test Case
```ts
it("exports first chord notes at the specified startOctave", () => {
  // C3 = 48, E3 = 52, G3 = 55
  const result = buildMidiFile([C_MAJOR], { startOctave: 3 });
  const midi = parseMidi(result);
  const pitches = midi.tracks.flatMap(t => t.notes.map(n => n.midi)).sort((a, b) => a - b);
  expect(pitches).toEqual([48, 52, 55]);
});
```

## Acceptance Criteria
- [ ] `MidiExportControls` renders an "Octave" selector with options 2–6, defaulting to 4
- [ ] Exported file at octave 3 places C major as MIDI notes 48, 52, 55 (C3 E3 G3)
- [ ] Exported file at octave 5 places C major as MIDI notes 72, 76, 79 (C5 E5 G5)
- [ ] `buildMidiFile` throws `RangeError` for `startOctave` outside 2–6
- [ ] New test passes; existing midiBuilder tests are unaffected
- [ ] `npm run lint` passes with `--max-warnings=0`

## Verification Commands
```bash
cd client
npx vitest run src/features/midi-export
npm run lint
```
