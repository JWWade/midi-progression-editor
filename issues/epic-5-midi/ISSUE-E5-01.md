# ISSUE-E5-01 — Add tests for voice-leading voicing utilities

## Objective
Add a dedicated Vitest test file for `closeVoiceChord` and `minimalMotionVoicing` in `client/src/features/voice-leading/`. These are the musically critical functions in the MIDI export pipeline and currently have no direct test coverage.

## Background
`voicing.ts` was implemented as part of E4-01. It is exercised indirectly via `midiBuilder.test.ts` for simple cases, but the acceptance criteria from E4-01 were never verified in isolation. Edge cases (seventh chords, octave wrapping, mismatched voice counts) are untested.

MIDI note formula used throughout (must be reflected in expected values):
```
midiNote = 12 * (octave + 1) + pitchClass
```
- C4 = 60, E4 = 64, G4 = 67, B4 = 71
- F4 = 65, A4 = 69, C5 = 72

## Files To Add
- `client/src/features/voice-leading/utils/voicing.test.ts`

## Files To Edit
None.

## Test Cases

### `closeVoiceChord`

| Input | Expected Output | Notes |
|---|---|---|
| `([0, 4, 7])` (default octave) | `[60, 64, 67]` | C4 E4 G4 — basic major triad |
| `([0, 4, 7, 11])` (default octave) | `[60, 64, 67, 71]` | C4 E4 G4 B4 — major seventh |
| `([0, 4, 7], 3)` (octave 3) | `[48, 52, 55]` | C3 E3 G3 — octave shift |
| `([7, 11, 2])` (default octave) | `[67, 71, 74]` | G4 B4 D5 — wraps past octave boundary |
| `([0])` | `[60]` | Single note |
| `([])` | `[]` | Empty input returns empty output |

### `minimalMotionVoicing`

| `prevMidi` | `nextPitchClasses` | Assertion | Notes |
|---|---|---|---|
| `[60, 64, 67]` | `[5, 9, 0]` | Each voice moves ≤ 6 semitones | C→F, E→A, G→C — verify motion minimised |
| `[60, 64, 67]` | `[7, 11, 2]` | Total movement ≤ naive same-octave placement | G is 7 semitones up or 5 down |
| `[60, 64, 67]` | `[0, 4, 7]` | `[60, 64, 67]` | Same chord, zero movement |
| `[60, 64, 67, 71]` | `[0, 4, 7]` | 3 notes returned | Seventh → triad truncates to min voice count |
| `[60, 64, 67]` | `[0, 4, 7, 11]` | 3 notes returned | Triad → seventh truncates to min voice count |

For the semitone-movement tests, assert the total movement (sum of `|prevMidi[i] - result[i]|`) is ≤ the total movement of a naive same-octave placement rather than asserting exact note values (since ties may resolve either way per the tie-break rule).

## Acceptance Criteria
- [ ] All `closeVoiceChord` cases pass with exact expected MIDI note numbers
- [ ] `minimalMotionVoicing` produces verified minimal-motion voicings for all cases
- [ ] Voice-count truncation behaviour is explicitly asserted
- [ ] Tests run with: `cd client && npx vitest run src/features/voice-leading`
- [ ] `npm run lint` passes with `--max-warnings=0`

## Verification Commands
```bash
cd client
npx vitest run src/features/voice-leading
npm run lint
```
