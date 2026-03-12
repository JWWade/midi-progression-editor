# ISSUE-E3-07 - Regenerate frontend API client after API work

## Objective
Sync generated TypeScript client with final backend OpenAPI contract.

## Prerequisites
- E3-01, E3-02, E3-03, and E3-06 complete.
- Backend running locally at `http://localhost:5110`.

## Files To Edit
- Generated only: `client/src/api/generated/index.ts`

## Acceptance Criteria
- Generated client includes new endpoints and DTO shapes.
- Frontend builds and lints without manual generated-file edits.

## Verification Commands
- `npm run generate:api` (from `client/`)
- `npm run build` (from `client/`)
- `npm run lint` (from `client/`)
