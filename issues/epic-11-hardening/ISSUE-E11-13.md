# ISSUE-E11-13 — Eliminate Silent Audio Preview Failures and Add Diagnostics

## Objective

Make audio playback failures observable and recoverable instead of silently ignored.

## Title

Bridge preview swallows playback exceptions with no user or log signal

## Location

- `client/src/features/progression-sidebar/hooks/useBridgePreview.ts`

## Description

`startPreview` wraps playback loop in `try/catch` and fully suppresses errors in the catch block. Audio context failures (autoplay restrictions, device issues, API errors) produce no logs, no telemetry, and no user feedback.

## Risk & Impact

- Debugging audio failures is difficult and slow.
- Users receive no indication why preview did not play.
- Reliability issues can persist unnoticed in production.

## Reproduction / Detection Method

1. Force playback failure (e.g., simulate `playChord` throw or deny audio context).
2. Trigger bridge preview.
3. Observe no warning/error log and no surfaced failure state.

## Recommended Fix

1. Log caught errors with feature namespace and minimal safe metadata.
2. Expose a non-blocking UI failure indicator state (e.g., transient toast or status text).
3. Add telemetry event for preview playback failure classification.
4. Preserve existing cleanup behavior in `finally`.

## Verification Step

1. Unit test: mocked `playChord` throw emits log/telemetry and sets failure UI state.
2. Manual check: user sees brief failure message when preview cannot play.
3. Confirm normal success path behavior is unchanged.

## Severity

Medium

## Implementation Status

- [x] Bridge preview playback catch-path now logs errors via feature-scoped logger.
- [x] Hook now exposes `previewError` with non-blocking, auto-clearing user-facing message.
- [x] App now renders a dismissible toast when preview playback fails.
- [x] Unit test verifies playback failure logs diagnostics and sets preview failure state.
- [ ] Telemetry transport wiring to external analytics backend (future integration).
