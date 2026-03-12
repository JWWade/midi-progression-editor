# ISSUE-E3-05 - Add scale unit + API contract tests

## Objective
Add deterministic test coverage for all scale modes and HTTP contract behavior.

## Files To Edit
- `server/ParametricMusic.Tests/ScaleGeneratorTests.cs`
- `server/ParametricMusic.Tests/ScaleControllerIntegrationTests.cs`
- `server/ParametricMusic.Tests/ParametricMusic.Tests.csproj` (if `Microsoft.AspNetCore.Mvc.Testing` is missing)

## Acceptance Criteria
- Unit tests assert expected pitch-class outputs for all 8 modes at root C.
- Unit tests assert transposition for at least 2 non-C roots.
- Integration test asserts 200 for valid request and 400 for invalid enum value.

## Verification Commands
- `dotnet test server/ParametricMusic.Tests`
