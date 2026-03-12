# ISSUE-E3-08 - Add full backend integration test coverage

## Objective
Cover all public API endpoints through HTTP tests.

## Scope
Happy path + one failure path each for:
- `GET /Health`
- `POST /Scale/from-root`
- `POST /Chord/from-root`
- `POST /Progression/analyze`

## Files To Add/Edit
- Add/expand `*IntegrationTests.cs` under `server/ParametricMusic.Tests`.

## Acceptance Criteria
- Tests run with `WebApplicationFactory<Program>`.
- No external running server required.

## Verification Commands
- `dotnet test server/ParametricMusic.Tests`
