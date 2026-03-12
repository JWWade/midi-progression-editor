# ISSUE-E3-09 - Standardize Problem Details responses

## Objective
Ensure all error responses are predictable for clients.

## Required Behavior
- Validation failures return `application/problem+json`.
- Unhandled exceptions produce non-leaking 500 Problem Details in non-development.

## Files To Edit
- `server/ParametricMusic.Api/Program.cs`
- Controllers as needed for consistent behavior.

## Acceptance Criteria
- Integration tests assert content type and schema for 400 paths.

## Verification Commands
- `dotnet test server/ParametricMusic.Tests`
