# ISSUE-E11-08 — Add API Rate Limiting and Request-Size Guardrails

## Objective

Protect public API endpoints from abuse and resource exhaustion.

## Title

No server-side abuse throttling or request-size constraints

## Location

- `server/ParametricMusic.Api/Program.cs`
- `server/ParametricMusic.Api/Controllers/ProgressionController.cs`

## Description

API endpoints are publicly callable and currently lack ASP.NET Core rate limiting and explicit payload-size safeguards. `POST /Progression/analyze` accepts arbitrary `customNotes` array lengths inside each chord object and processes them without input-size caps.

## Risk & Impact

- Repeated high-volume requests can degrade availability.
- Very large JSON payloads can cause avoidable CPU and memory pressure.
- Single endpoint abuse can impact all users due to shared process resources.

## Reproduction / Detection Method

1. Confirm `Program.cs` does not call `AddRateLimiter`/`UseRateLimiter`.
2. Send burst traffic to `POST /Progression/analyze` (e.g., 500+ requests in short interval).
3. Send oversized chord payloads with very large `customNotes` arrays and observe latency/memory growth.

## Recommended Fix

1. Add ASP.NET Core fixed-window or token-bucket rate limiting policy in `Program.cs`.
2. Apply policy globally or at least to `/Progression/analyze`.
3. Add input caps with data annotations and/or explicit controller validation:
   - Maximum `customNotes` length per chord
   - Maximum request body size where appropriate
4. Return `429` for throttled calls and `400` for payload contract violations.

## Verification Step

1. Integration test: burst calls return `429` after threshold.
2. Integration test: oversized `customNotes` payload returns `400` with `application/problem+json`.
3. Observe stable memory/latency under stress test relative to baseline.

## Severity

High
