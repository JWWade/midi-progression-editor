# ISSUE-E7-04 — Remove Dead Code in `shared/`

## Objective
Delete the unused `ChromaticCircle` component from `client/src/shared/` and clean up the otherwise-empty placeholder directory.

## Background
`client/src/shared/ChromaticCircle.tsx` is a copy of the main chromatic-circle component that is not imported anywhere in the application. It was likely created as an intermediate step during an earlier refactor and was never cleaned up.

The `shared/` directory contains only this file plus `.gitkeep` placeholders:

```
client/src/shared/
├── ChromaticCircle.tsx   ← unused duplicate
├── components/.gitkeep
├── hooks/.gitkeep
├── types/.gitkeep
└── utils/.gitkeep
```

Having an unreferenced component that mirrors the real one creates confusion about which is canonical and may mislead future contributors into editing the wrong file.

## Files To Delete
- `client/src/shared/ChromaticCircle.tsx`

## Files To Edit
None. The `.gitkeep` files may remain as placeholders for future shared utilities; if the project convention is to remove empty directories, they can be removed too — that decision is left to the implementer.

## Acceptance Criteria
- [ ] `client/src/shared/ChromaticCircle.tsx` no longer exists in the repository.
- [ ] No other file imports from `client/src/shared/ChromaticCircle`.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
