# ISSUE-E10-03 — Tutorial Observability, Analytics, and Accessibility Diagnostics

## Objective

Make the tutorial system measurable and debuggable by defining an event model, capturing useful metadata, introducing accessibility diagnostics, and adding privacy guardrails.

## Background

The current tutorial engine can resolve and display steps, but it does not yet expose a structured event stream that answers product and engineering questions such as:

- Which steps become eligible?
- Which steps are shown, skipped, or completed?
- Which triggers cause friction or immediate dismissal?
- Where are accessibility failures occurring during tutorial display?

## Scope

1. Define the tutorial telemetry event model.
2. Capture metadata needed for funnel analysis and debugging.
3. Add accessibility diagnostics around focus and dismissal behavior.
4. Add privacy guardrails to prevent sensitive-data leakage.
5. Add reporting, simulation, or diagnostics tooling for development.

## Files To Edit

Expected touch points:

- `client/src/features/tutorial/context/TutorialProvider.tsx`
- `client/src/features/tutorial/types/index.ts`
- `client/src/features/tutorial/utils/triggerManager.ts`
- `client/src/features/tutorial/components/TutorialTooltip.tsx`
- `client/src/features/tutorial/components/TutorialModal.tsx`
- Shared logger or diagnostics utilities under `client/src/shared/`
- Any developer diagnostics surface used in dev mode

## Requirements

### Event Model

Define at minimum:

- `step_eligible`
- `step_shown`
- `step_completed`
- `step_skipped`
- `tutorial_dismissed_all`
- `tutorial_reset`

### Event Metadata

Capture at minimum:

- step ID
- feature
- trigger type
- tutorial content version
- timestamp bucket or equivalent session-safe timing metadata

### Accessibility Diagnostics

Track or expose diagnostics for:

- focus success/failure on open
- input method where practical
- immediate dismissals or abnormal close patterns

### Privacy Guardrails

- Do not emit sensitive content or user-entered data.
- Keep telemetry payloads bounded and documented.
- Align with repository privacy standards and future analytics portability.

### Tooling

Provide at least one of:

- a diagnostics panel in development
- a structured debug log stream
- a simulation/reporting tool for trigger and accessibility outcomes

## Acceptance Criteria

- [ ] Tutorial funnel analysis is possible from the emitted event model.
- [ ] Trigger outcomes are debuggable in development.
- [ ] Accessibility-related failures are visible through diagnostics.
- [ ] Privacy guardrails are explicit and enforced by design.
- [ ] Event payload shape is documented and stable.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] `npm test` passes.

## Verification Commands

```bash
cd client
npm run lint
npm run build
npm test
```
