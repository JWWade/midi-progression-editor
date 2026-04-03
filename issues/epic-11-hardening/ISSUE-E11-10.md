# ISSUE-E11-10 — Add Frontend API Timeout and Cancellation Controls

## Objective

Prevent indefinite hangs and stale responses during API failures or slow networks.

## Title

Client API calls have no timeout or cancellation path

## Location

- `client/src/api/client/index.ts`

## Description

`getHealth` and `getScaleFromRoot` call the generated client without timeout or abort semantics. Slow or stalled requests can remain unresolved and update UI late, with no standardized cancellation behavior.

## Risk & Impact

- Poor UX on degraded networks (spinners or dependent interactions may stall).
- Stale responses can race newer user actions.
- Error handling is inconsistent because transport-level timeout is not explicitly modeled.

## Reproduction / Detection Method

1. Use network throttling or block API responses.
2. Trigger scale fetch calls repeatedly while changing context.
3. Observe unresolved requests and delayed/out-of-order response handling.

## Recommended Fix

1. Introduce shared request helper with `AbortController` + timeout.
2. Pass abort signals through openapi-fetch calls.
3. Normalize timeout and abort errors to predictable app-level error types.
4. Add call-site cancellation for stale requests in consuming hooks/components.

## Verification Step

1. Unit tests for timeout path assert deterministic error shape.
2. Integration-style test simulates slow endpoint and confirms in-flight request cancellation.
3. Confirm no stale response updates state after newer request is issued.

## Severity

Medium
