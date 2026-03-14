# Epic 5 — MIDI Playback & Export Polish

## Theme
Close the gap between MIDI infrastructure and user-facing experience. All issues are frontend-only; no new libraries, no backend changes.

## Motivation
Epic 4 delivered a complete MIDI foundation: voice-leading algorithms, a MIDI file builder, an export hook, and export controls. However, two large gaps remain:

1. **Audio is silent.** `useAudioPlayback` and `audioUtils` are fully implemented but wired to no UI component — clicking any chord produces no sound.
2. **Export settings are limited.** Octave is hardcoded at 4 with no user control.

A secondary quality gap exists: the voice-leading functions that power all MIDI output have no direct unit tests, making them risky to modify.

## Baseline State (start of Epic 5)

| Capability | Status |
|---|---|
| Voice-leading algorithms (`closeVoiceChord`, `minimalMotionVoicing`) | ✅ Implemented |
| MIDI file builder (`buildMidiFile`) | ✅ Implemented + tested |
| MIDI export hook + UI (`useMidiExport`, `MidiExportControls`) | ✅ Implemented |
| WebAudio synthesis (`audioUtils`, `useAudioPlayback`) | ✅ Implemented |
| **Play button on CurrentChordPanel** | ❌ Missing |
| **Progression playback sequencer** | ❌ Missing |
| **Octave control in MIDI export** | ❌ Missing — hardcoded to 4 |
| **Voice-leading unit tests** | ❌ Missing — indirect coverage only |

## Issues

| ID | Title | Effort | Value |
|---|---|---|---|
| [E5-01](./ISSUE-E5-01.md) | Unit tests for voice-leading utilities | Small | Safety / foundation |
| [E5-02](./ISSUE-E5-02.md) | Play button on CurrentChordPanel | Small | High — enables audio |
| [E5-03](./ISSUE-E5-03.md) | Progression playback sequencer | Medium | High — enables playback |
| [E5-04](./ISSUE-E5-04.md) | Expose octave control in MIDI export | Small | Medium — UX polish |

## Execution Order

```
E5-01 ──────────────────────────────► (can be done any time, no deps)
E5-04 ──────────────────────────────► (can be done any time, no deps)
E5-02 ──► E5-03                        (E5-03 builds on E5-02's play hook usage)
```

E5-01 and E5-04 are independent of each other and of E5-02/E5-03. E5-02 should land before E5-03 because E5-03 reuses the audio hook integration pattern established in E5-02.

## Architecture Notes

### Audio pipeline shape
`useAudioPlayback.play()` accepts `ChordNoteInfo[]`, not raw MIDI numbers:
```ts
interface ChordNoteInfo {
  index: number;       // 0-11 pitch class
  isCustom?: boolean;  // affects timbre (not yet used)
}
```

### How to build `ChordNoteInfo[]` from the store
```ts
// Named chord (from store.selectedChord):
const notes: ChordNoteInfo[] = chord.notes.map(n => ({ index: n }));

// Custom chord (from store.customNotes):
const notes: ChordNoteInfo[] = customNotes.map(n => ({ index: n, isCustom: true }));
```

### MIDI note formula
```
midiNote = 12 * (octave + 1) + pitchClass
```
C4 (middle C) = `12 * 5 + 0` = 60. This is used consistently in `audioUtils.ts` and `voicing.ts`.

## Scope Boundaries (intentionally excluded)
- Instrument / timbre selection
- Per-note velocity / dynamics control
- Multi-track MIDI export
- Backend MIDI generation endpoint
- Tempo-sync between playback and export BPM

## Done Definition
Epic 5 is complete when:
- Every voice-leading algorithm has direct unit tests (E5-01)
- Clicking the play button on `CurrentChordPanel` produces audio (E5-02)
- A progression can be played back chord-by-chord with stop/sequential controls (E5-03)
- The MIDI export octave is user-configurable 2–6 (E5-04)
- `npm run lint` passes with `--max-warnings=0` throughout
