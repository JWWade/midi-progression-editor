# ISSUE-E3-06 - OpenAPI contract hardening

## Objective
Make Swagger/OpenAPI an unambiguous source for client generation.

## Requirements
- Add explicit `[ProducesResponseType]` models on active endpoints.
- Ensure enum display/serialization consistency.
- Ensure all new DTO schemas are visible.

## Files To Edit
- Controllers and DTOs added by E3-01/E3-02/E3-03.
- `server/ParametricMusic.Api/Program.cs` if swagger config updates are needed.

## Acceptance Criteria
- OpenAPI includes all endpoint request/response schemas.
- 400 schemas represented for invalid payloads.

## Verification Commands
- Run backend and inspect Swagger UI.
- `dotnet build server/ParametricMusic.Api`
