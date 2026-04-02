# Epic 10 — Enhance Tutorial System

## Purpose

Improve the tutorial system so it is safer to author, more accessible, more user-controlled, observable in production, and easier to maintain as the application grows.

This epic is derived from the planning proposal in [docs/tutorial-system-enhancement-plan.md](../../docs/tutorial-system-enhancement-plan.md) and converts that direction into sprint-sized implementation issues.

## Current Baseline (Verified)

The repository already contains a functioning tutorial feature under `client/src/features/tutorial/` with these capabilities:

- Trigger model supports `onAction`, `onState`, `onIdle`, and `composite` triggers.
- Tutorial content is centrally defined in `client/src/features/tutorial/data/tutorials.ts`.
- Step resolution is deterministic by priority, then definition order.
- Tutorial progress is persisted in localStorage with version-based reset behavior.
- UI currently supports tooltip and modal tutorial surfaces.
- The app feeds tutorial state through `useTutorial()` integration in `client/src/app/App.tsx`.

## Goals

1. Add authoring governance and validation so invalid tutorial content fails early.
2. Make tutorial behavior deterministic, accessible, and testable.
3. Give users control over interruption level and pacing.
4. Add observability and diagnostics for both product analytics and engineering debugging.
5. Harden ownership boundaries and integration contracts so feature work does not silently break tutorials.

## Non-Goals

- Replacing the tutorial system with a different state-management approach.
- Moving tutorial progress to the backend.
- Introducing AI-authored or runtime-generated tutorial content.
- Refactoring unrelated product logic outside tutorial integration points.

## Sprint / Issue Breakdown

1. [ISSUE-E10-01](./ISSUE-E10-01.md) — Foundations, governance, validation, and deterministic trigger rules
2. [ISSUE-E10-02](./ISSUE-E10-02.md) — UX controls, accessibility, and scenario coverage
3. [ISSUE-E10-03](./ISSUE-E10-03.md) — Observability, analytics, privacy guardrails, and diagnostics
4. [ISSUE-E10-04](./ISSUE-E10-04.md) — Integration ownership, contract tests, accessibility hardening, and documentation

## Recommended Execution Order

1. ISSUE-E10-01
2. ISSUE-E10-02
3. ISSUE-E10-03
4. ISSUE-E10-04

## Expected Outcome

At the end of this epic, the tutorial system should be:

- Governed by explicit authoring and validation rules
- Accessible and keyboard-operable
- Configurable by users according to interruption tolerance
- Observable through diagnostics and telemetry
- Protected by integration and contract tests

## Optional Follow-Up Work

Potential follow-on work after Epic 10:

- Cross-device progress sync
- Analytics sink integration with a selected platform
- Minimal-mode refinement and policy tuning
- Advanced trigger simulation and replay tools
