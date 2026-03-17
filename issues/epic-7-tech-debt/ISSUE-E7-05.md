# ISSUE-E7-05 — Separate Auto-Generated API Types from Hand-Written Client Wrappers

## Objective
Ensure that `client/src/api/client/index.ts` contains only hand-written code so that running `npm run generate:api` can never overwrite manual endpoint wrappers.

## Background
`client/src/api/client/index.ts` currently mixes two categories of code:
1. **Auto-generated type bindings** — should live exclusively in `client/src/api/generated/index.ts` (marked "do not edit").
2. **Hand-written endpoint wrappers** — `getHealth()`, `getScaleFromRoot()`, and the `createClient` configuration. These are manually maintained.

If a developer runs `npm run generate:api`, the generated file is overwritten. If the generation script ever targets `client/src/api/client/index.ts` instead of (or in addition to) the generated file, hand-written logic would be silently lost.

Additionally:
- `getScaleFromRoot()` hard-codes the scale type to `"Major"` with no parameter, making the function inflexible.
- The `VITE_API_BASE_URL` fallback hard-codes `http://localhost:5110`, which should be documented as a dev-only default.

## Files To Edit
- `client/src/api/client/index.ts` — remove any type re-declarations that duplicate `generated/index.ts`; ensure all type imports come from `../generated`; document the `VITE_API_BASE_URL` fallback; give `getScaleFromRoot` a `scaleType` parameter with a sensible default.

## Files Not To Edit
- `client/src/api/generated/index.ts` — auto-generated; never edit manually.

## Acceptance Criteria
- [ ] `client/src/api/client/index.ts` imports all API types exclusively from `../generated`.
- [ ] No type definition in `client/src/api/client/index.ts` duplicates one from `generated/index.ts`.
- [ ] `getScaleFromRoot` accepts an optional `scaleType` parameter (default `"Major"` to preserve existing behaviour).
- [ ] `npm run generate:api` (when backend is running) does not touch `client/src/api/client/index.ts`.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
