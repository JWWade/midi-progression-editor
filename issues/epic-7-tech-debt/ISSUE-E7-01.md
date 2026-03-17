# ISSUE-E7-01 — Consolidate Duplicate Scale Utilities

## Objective
Remove the duplicated scale-computation logic that exists across two separate feature modules and establish a single authoritative implementation.

## Background
Two distinct utility files compute the same diatonic pitch-class set:

| File | Export | Return type |
|---|---|---|
| `client/src/features/chromatic-circle/utils/scaleUtils.ts` | `getDiatonicIndices(root, mode)` | `Set<number>` |
| `client/src/features/scale/utils/scaleUtils.ts` | `getScaleNotes(rootIndex, scaleType)` | `number[]` |

Both accept a root pitch class (0–11) and a scale/mode identifier and return the same set of diatonic notes. Having two implementations means any bug fix or new mode must be applied in two places, and callers in different features may silently diverge.

The `scale` feature module is the natural owner of scale-computation logic. `chromatic-circle` should depend on it, not maintain a parallel copy.

## Files To Edit

- `client/src/features/scale/utils/scaleUtils.ts` — if needed, expose a `Set<number>`-typed variant so callers in `chromatic-circle` do not need to convert.
- `client/src/features/chromatic-circle/utils/scaleUtils.ts` — replace the implementation body with a re-export or thin wrapper that delegates to the `scale` feature utility.
- Any file that currently imports from `chromatic-circle/utils/scaleUtils` — update to import from the canonical location once the API is unified.

## Files To Add
None.

## Acceptance Criteria
- [ ] Scale computation logic exists in exactly one place (`client/src/features/scale/utils/scaleUtils.ts`).
- [ ] `client/src/features/chromatic-circle/utils/scaleUtils.ts` either re-exports from `scale` or is deleted (no duplicate algorithm body).
- [ ] All existing callers compile without TypeScript errors.
- [ ] All existing unit tests pass.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
npm test
```
