# ISSUE-E7-09 — Unit Tests for Chord and Color-Language Utilities

## Objective
Add direct unit tests for the `chord` and `color-language` feature utility modules, both of which are entirely untested despite being used across the whole application.

## Background
The `chord` and `color-language` feature utilities are the data and presentation layer for every visual element in the app. A regression in any of them would silently corrupt chord rendering without a failing test.

**Utilities lacking direct tests:**

### `client/src/features/chord/utils/`
| File | Key exports |
|---|---|
| `transpose.ts` | `transposeChord`, `getDimIntervals`, `getAugIntervals` |
| `chordName.ts` | `getChordName`, `getChordNameWithQuality` |
| `chordNotes.ts` | `getChordNoteIndices` |
| `getChordPitchClasses.ts` | `getChordPitchClasses` (new, after E7-02) |

### `client/src/features/color-language/utils/`
| File | Key exports |
|---|---|
| `chordColorUtils.ts` | `getChordColor`, `getChordComplexity`, `getChordFillColor` |
| `harmonyOpacity.ts` | `getHarmonyOpacity` |

## Files To Add
- `client/src/features/chord/utils/__tests__/transpose.test.ts`
- `client/src/features/chord/utils/__tests__/chordName.test.ts`
- `client/src/features/chord/utils/__tests__/chordNotes.test.ts`
- `client/src/features/chord/utils/__tests__/getChordPitchClasses.test.ts` (after E7-02)
- `client/src/features/color-language/utils/__tests__/chordColorUtils.test.ts`
- `client/src/features/color-language/utils/__tests__/harmonyOpacity.test.ts`

## Files To Edit
None (tests only).

## Test Guidance

Follow the established pattern from `midiBuilder.test.ts` and `pairMetrics.test.ts`.

For `chordColorUtils.ts`, specifically test:
- `getChordComplexity` returns `"triad"` for major/minor/dim/aug and `"seventh"` for seventh types.
- `getChordColor` returns a valid CSS colour string for all 8 `ChordType` values.
- `getChordFillColor` returns a value with reduced alpha compared to `getChordColor` base.

For `harmonyOpacity.ts`, test:
- Chord tones always return the highest opacity value.
- Diatonic non-chord tones return `DIATONIC_OPACITY`.
- Chromatic tones return `CHROMATIC_OPACITY`.
- Chromatic chord tones return `CHORD_TONE_CHROMATIC_OPACITY`.

For `transpose.ts`, test all 12 root positions and confirm interval wrapping at the octave boundary.

## Acceptance Criteria
- [ ] At least one test file exists for each utility listed above.
- [ ] Each test file has ≥3 meaningful test cases.
- [ ] `getChordPitchClasses` tests cover named chords, custom chords, and all 8 chord types.
- [ ] `npm test` passes with all new tests green.
- [ ] `npm run lint` passes with `--max-warnings=0`.

## Verification Commands
```bash
cd client
npm test
npm run lint
```
