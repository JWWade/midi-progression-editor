# ISSUE-E11-12 — Remove Insecure HTTP API Fallback Outside Local Development

## Objective

Prevent accidental plaintext API transport in non-local environments.

## Title

Client defaults to HTTP localhost API URL without environment guard

## Location

- `client/src/api/client/index.ts`

## Description

The API client falls back to `http://localhost:5110` whenever `VITE_API_BASE_URL` is absent. This is safe for local development but can leak into misconfigured preview/staging deployments and force insecure transport assumptions.

## Risk & Impact

- Misconfigured deployments can silently use non-TLS API endpoints.
- Security posture depends on environment correctness rather than code-level guardrails.
- Harder to detect configuration mistakes before release.

## Reproduction / Detection Method

1. Build/run client without `VITE_API_BASE_URL` in a non-local environment.
2. Inspect network calls and observe fallback URL usage.
3. Confirm no startup validation error is raised.

## Recommended Fix

1. Keep localhost fallback only when `import.meta.env.DEV === true`.
2. In non-dev modes, require explicit `VITE_API_BASE_URL` and fail fast with clear startup error.
3. Add config validation test for production/preview build modes.

## Verification Step

1. Dev mode without env var still works with localhost fallback.
2. Production/preview mode without env var fails fast with actionable error.
3. Production/preview mode with HTTPS base URL succeeds.

## Severity

Medium

## Implementation Status

- [x] API client fallback to `http://localhost:5110` is now restricted to development mode only.
- [x] Non-development startup now fails fast when `VITE_API_BASE_URL` is missing or blank.
- [x] Added unit tests covering dev fallback, explicit URL usage, and non-dev failure paths.
- [ ] Manual preview/prod deployment validation using environment-specific build pipeline.
