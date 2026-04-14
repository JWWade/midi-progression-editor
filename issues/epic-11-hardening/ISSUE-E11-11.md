# ISSUE-E11-11 — Add Structured Server Exception Logging and Trace Correlation

## Objective

Improve production incident triage by logging unhandled exceptions with request correlation metadata.

## Title

Global exception handler suppresses root-cause telemetry

## Location

- `server/ParametricMusic.Api/Program.cs` (non-development `UseExceptionHandler` branch)

## Description

The global exception handler returns a generic `500` problem response but does not log the exception details server-side, nor include trace correlation data in a consistent format.

## Risk & Impact

- Production failures become difficult to investigate.
- No reliable linkage between client-reported failures and server logs.
- MTTD/MTTR increase because crashes are effectively silent in telemetry.

## Reproduction / Detection Method

1. Introduce/trigger an unhandled exception in a controller action.
2. Call endpoint in non-development environment.
3. Observe generic `500` response and absence of structured exception log with trace identifier.

## Recommended Fix

1. In exception handler, log exception with `ILogger` including request path, method, and `TraceIdentifier`.
2. Return `problem+json` containing `traceId` (non-sensitive) for support correlation.
3. Add explicit structured logging conventions for API error responses.

## Verification Step

1. Integration test triggers exception and asserts `500` response contains `traceId`.
2. Log assertions (or manual test) confirm exception stack and metadata are emitted.
3. Verify no sensitive payload data is logged by default.

## Severity

High

## Implementation Status

- [x] Global exception handler now logs unhandled exceptions with method, path, and trace identifier.
- [x] `500` problem response now includes `traceId` for client-to-server correlation.
- [x] Integration test verifies unhandled exception path returns `500` with `traceId` and `application/problem+json`.
- [ ] Optional log sink assertion (manual verification in runtime logging backend).
