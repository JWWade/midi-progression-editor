# ISSUE-E7-08 — Unit Tests for Chromatic-Circle Hooks and Utilities

## Objective
Add direct unit tests for the chromatic-circle feature's utility functions and, after E7-03, for the decomposed chord-state hooks.

## Background
The chromatic-circle feature is the most complex in the frontend: it drives the main visualisation, chord selection, drag interactions, and scale display. Despite this, it has zero direct unit tests. All coverage is incidental — exercised only when `midiBuilder.test.ts` or `voicing.test.ts` happen to call into shared utilities.

The utilities most in need of testing are:

| File | Key exports to test |
|---|---|
| `chromatic-circle/utils/geometry.ts` | `getPolygonVertices`, `CHORD_SHAPES` |
| `chromatic-circle/utils/scaleUtils.ts` | `getDiatonicIndices` (or its canonical equivalent after E7-01) |
| `chromatic-circle/utils/noteStyles.ts` | `getNoteStyle` |
| `chromatic-circle/utils/circleColors.ts` | `getCircleColor` |
| `chromatic-circle/hooks/useDragState.ts` | (after E7-03) drag state transitions |
| `chromatic-circle/hooks/useCustomChordState.ts` | (after E7-03) toggle/clear behaviour |

## Files To Add
- `client/src/features/chromatic-circle/utils/__tests__/geometry.test.ts`
- `client/src/features/chromatic-circle/utils/__tests__/scaleUtils.test.ts`
- `client/src/features/chromatic-circle/utils/__tests__/noteStyles.test.ts`
- `client/src/features/chromatic-circle/utils/__tests__/circleColors.test.ts`
- `client/src/features/chromatic-circle/hooks/__tests__/useDragState.test.ts` (after E7-03)
- `client/src/features/chromatic-circle/hooks/__tests__/useCustomChordState.test.ts` (after E7-03)

## Files To Edit
None (tests only).

## Test Guidance

Follow the existing test style established in `client/src/features/midi-export/utils/__tests__/midiBuilder.test.ts` and `client/src/features/progression-sidebar/utils/__tests__/pairMetrics.test.ts`:
- Use `describe` / `it` blocks.
- Prefer explicit `expect(...).toBe(...)` / `toEqual(...)` assertions over snapshots.
- Test boundary conditions: all 12 root notes, all supported chord types, empty inputs.

Hook tests should use `renderHook` from `@testing-library/react`. Check whether `@testing-library/react` is already listed in `client/package.json`; if not, add it as a `devDependency` before writing the tests. Do not add it if the package is already present.

## Acceptance Criteria
- [ ] At least one test file exists for each utility listed above.
- [ ] Each test file has ≥3 meaningful test cases.
- [ ] Hook tests (post E7-03) cover: initial state, toggling, clearing, and drag-state transitions.
- [ ] `npm test` passes with all new tests green.
- [ ] `npm run lint` passes with `--max-warnings=0`.

## Verification Commands
```bash
cd client
npm test
npm run lint
```
