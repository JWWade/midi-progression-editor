# ISSUE-E11-04 — Consolidate Chord Identity Scoring and Policy

## Objective

Unify custom-chord identity inference and display policy so all UI surfaces produce consistent labels and quality interpretation.

## Background

Root-anchored inference, global nearest inference, and display-layer fallback logic currently overlap. This increases drift risk and can surface inconsistent labels across features.

## Scope

1. Centralize shared scoring logic.
2. Define one policy entry point for display identity.
3. Update call sites to consume canonical policy.

## Files To Edit

- `client/src/features/chord/utils/rerootChord.ts`
- `client/src/features/chord/utils/findNearestChord.ts`
- `client/src/features/current-chord/utils/chordName.ts`
- Any call sites in:
  - `client/src/features/chromatic-circle/`
  - `client/src/features/current-chord/`
  - other display surfaces using direct inference

## Requirements

- Shared scoring logic extracted and reused.
- Canonical policy clearly defines exact-match and non-exact fallback behavior.
- Display call sites use canonical policy rather than ad hoc inference.
- Quartal/non-quartal ambiguity handling remains deterministic and tested.

## Acceptance Criteria

- [ ] Identity inference behavior is consistent across circle and panel displays.
- [ ] Duplicate scoring implementations are reduced to one shared core.
- [ ] Regression tests cover exact and non-exact custom-note scenarios.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes for chord naming and identity suites.

## Verification Commands

```bash
cd client
npm run lint
npm test -- chordName rerootChord findNearestChord
```
