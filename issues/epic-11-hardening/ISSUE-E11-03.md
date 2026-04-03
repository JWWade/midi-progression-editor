# ISSUE-E11-03 — Unify Visual Polygon Derivation Across Circle and Panel

## Objective

Ensure circle and current-chord panel thumbnail always render polygon geometry from the same derivation path.

## Background

Recent regressions showed that circle and panel paths could drift when only one side received ordering/normalization fixes.

## Scope

1. Consolidate polygon note ordering for all chord polygon renderers.
2. Standardize root-anchored rotation behavior.
3. Remove redundant caller-specific preprocessing where possible.

## Files To Edit

- `client/src/features/chromatic-circle/utils/geometry.ts`
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`
- `client/src/features/current-chord/components/ChordThumbnail.tsx`
- `client/src/features/current-chord/components/CurrentChordPanel.tsx`

## Requirements

- One canonical ordering utility is used by both renderers.
- Root context is passed where available for deterministic orientation.
- Out-of-order and duplicated note arrays still produce stable non-self-intersecting polygons.

## Acceptance Criteria

- [x] Circle and panel render identical polygon topology for identical chord input.
- [x] No caller bypasses canonical ordering for polygon rendering.
- [x] Geometry tests cover root-rotation and out-of-order input cases.
- [x] `npm run lint` passes.
- [x] `npm test` passes for geometry and affected rendering tests.

## Verification Commands

```bash
cd client
npm run lint
npm test -- geometry
```
