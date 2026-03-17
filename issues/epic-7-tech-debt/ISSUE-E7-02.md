# ISSUE-E7-02 — Extract Repeated Chord-Note Retrieval into a Shared Utility

## Objective
Replace a copy-pasted conditional that retrieves pitch classes from a `Chord` value with a single reusable utility function, removing the duplication from at least five files.

## Background
The following pattern appears verbatim (or near-verbatim) in multiple files across the codebase:

```ts
isCustomChord(chord) ? chord.customNotes : getChordNoteIndices(chord.root, chord.type)
```

**Known locations (non-exhaustive):**
- `client/src/features/current-chord/components/CurrentChordPanel.tsx`
- `client/src/features/progression-sidebar/components/ChordTile.tsx`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/midi-export/utils/midiBuilder.ts`
- `client/src/features/progression-sidebar/utils/pairMetrics.ts`

Each duplicate is a maintenance hazard: introducing a new chord variant (e.g., quartal chords) requires hunting down and updating every occurrence. A single function eliminates that risk.

## Proposed API
```ts
// client/src/features/chord/utils/getChordPitchClasses.ts
export function getChordPitchClasses(chord: Chord): number[]
```

The function should:
1. Check `isCustomChord(chord)` and return `chord.customNotes` if true.
2. Otherwise call `getChordNoteIndices(chord.root, chord.type)` and return the result.

## Files To Add
- `client/src/features/chord/utils/getChordPitchClasses.ts` — new utility function.

## Files To Edit
- `client/src/features/chord/utils/index.ts` — re-export `getChordPitchClasses`.
- All files listed in **Known locations** above — replace inline conditionals with a call to `getChordPitchClasses(chord)`.

## Acceptance Criteria
- [ ] `getChordPitchClasses(chord: Chord): number[]` exists in `client/src/features/chord/utils/`.
- [ ] No file outside `getChordPitchClasses.ts` contains the pattern `isCustomChord(chord) ? chord.customNotes`.
- [ ] All existing tests pass.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
npm test
```
