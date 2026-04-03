# ISSUE-E11-02 — Centralize Pitch-Class Normalization and Deduplication

## Objective

Replace duplicated pitch-class normalization patterns with one shared utility boundary.

## Background

Equivalent formulas and deduplication behavior currently appear in multiple modules, increasing maintenance risk and creating subtle divergence in edge cases.

## Scope

1. Introduce canonical pitch-class utility helpers.
2. Replace inline normalization formulas with utility calls.
3. Align deduplication semantics across callers.

## Files To Edit

- `client/src/features/chord/utils/transpose.ts`
- New utility file(s) under `client/src/features/chord/utils/`
- Callers in:
  - `client/src/features/chromatic-circle/utils/geometry.ts`
  - `client/src/features/current-chord/utils/chordName.ts`
  - other direct normalization call sites discovered in scope

## Files To Add

Suggested:

- `client/src/features/chord/utils/pitchClass.ts`
- `client/src/features/chord/utils/__tests__/pitchClass.test.ts`

## Requirements

- Shared helper(s) for normalize and normalized dedupe behavior.
- Existing logic updated to consume shared helper(s).
- Behavioral equivalence maintained for in-range inputs.
- Edge-case behavior explicitly tested for negative and out-of-range note indices.

## Acceptance Criteria

- [x] No duplicated inline pitch-class normalization formulas remain in targeted paths.
- [x] Deduplication behavior is consistent across geometry and identity call paths.
- [x] Unit tests cover normalization and dedupe edge cases.
- [x] `npm run lint` passes.
- [x] `npm test` passes for affected suites.

## Verification Commands

```bash
cd client
npm run lint
npm test -- pitchClass geometry chordName
```
