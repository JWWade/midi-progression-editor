# ISSUE-E11-05 — Add Geometry/Identity Parity Regression Test Net

## Objective

Add a durable regression net that catches geometry and identity drift between rendering surfaces before merge.

## Background

Unit tests exist for individual utilities, but parity regressions can still slip through when one surface updates and another does not.

## Scope

1. Extend utility-level tests for edge cases.
2. Add parity tests for circle/panel geometry consistency.
3. Add parity tests for custom-chord identity labeling consistency.

## Files To Edit

- `client/src/features/chromatic-circle/utils/__tests__/geometry.test.ts`
- `client/src/features/chord/utils/__tests__/chordName.test.ts`
- `client/src/features/current-chord/**/__tests__/*` (new or existing)
- Additional test files under `client/src/features/` as needed

## Requirements

Test coverage should include:

- out-of-range note indices
- negative indices
- duplicated note arrays
- out-of-order note arrays
- root-rotation behavior
- exact vs non-exact custom identity resolution
- circle/panel parity for representative triad, seventh, quartal-like, and custom sets

## Acceptance Criteria

- [x] New tests fail on known drift scenarios and pass after hardening.
- [x] Circle/panel parity assertions exist for both geometry and identity.
- [x] Test suite remains deterministic and stable.
- [x] `npm test` passes.

## Verification Commands

```bash
cd client
npm test
```
