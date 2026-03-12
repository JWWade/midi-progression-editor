# ISSUE-E3-11 - Session persistence API (optional follow-up)

## Objective
Decide and document minimal persistence contract, optionally implement.

## Option A (implement)
- `POST /Sessions`
- `GET /Sessions`
- `GET /Sessions/{id}`

## Option B (defer)
- Add contract draft doc only: `docs/session-api-draft.md` with JSON schemas.

## Acceptance Criteria
- Clear recorded decision is committed.
- If implemented, frontend can round-trip a progression.
