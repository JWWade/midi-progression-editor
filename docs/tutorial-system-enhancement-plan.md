# Tutorial System Enhancement Plan

## Status

Draft proposal for discussion only. No code changes are proposed in this document.

## Goal

Improve the tutorial system so it is easier to author, more predictable for users, measurable in production, and simpler to evolve without regressions.

## Why This Matters

The current tutorial feature already has strong foundations:

- Trigger model supports action, state, idle, and composite triggers.
- Tutorial content is versioned and persisted.
- Priority-based step resolution is deterministic.
- UI supports modal and tooltip tutorials.

The next stage is to move from a working onboarding system to a maintainable product system with stronger governance, diagnostics, and UX controls.

## Current Baseline (Observed)

Based on the current codebase:

- Data model and trigger types live in client tutorial types.
- Step definitions are hard-coded in a central tutorial data file.
- Trigger resolution is priority-first, then definition order on ties.
- Progress persistence uses a single localStorage key and a content version reset strategy.
- Tutorial engine is fed app context and action events from app-level integration.

This plan builds on that architecture rather than replacing it.

## Desired Outcomes

1. Tutorial content becomes easier to add/edit safely.
2. Users gain better control over pace and interruption level.
3. Product team can measure tutorial effectiveness with event telemetry.
4. Engineering can diagnose why a step did or did not appear.
5. Tutorial behavior remains stable across feature growth and refactors.

## Non-Goals (This Iteration)

- Rewriting the tutorial system from React context to another state library.
- Introducing backend persistence for tutorial progress.
- Building AI-generated tutorial content.
- Changing feature-level business logic outside tutorial integration points.

## Enhancement Themes

## 1) Content Authoring and Governance

Problem:
Tutorial definitions are centralized and code-heavy, which can slow iteration and increase risk of copy/trigger mistakes.

Plan:

- Define an authoring contract for tutorial steps (required fields, naming standards, target selector policy, priority bands).
- Add schema validation for tutorial definitions during development and tests.
- Introduce lint-like checks for common quality issues:
  - duplicate step ids
  - missing or invalid selectors for tooltip steps
  - out-of-range priority values
  - unreachable steps based on contradictory trigger combinations
- Document a content versioning policy and bump criteria.

Acceptance criteria:

- Invalid tutorial content fails fast in local development.
- A single command or test suite validates all tutorial definitions.
- Authoring conventions are documented and easy for contributors to follow.

## 2) Trigger Predictability and Conflict Resolution

Problem:
As step count grows, conflicts and accidental starvation become more likely.

Plan:

- Formalize trigger resolution semantics in docs and tests:
  - ordering
  - tie-break behavior
  - skip/completed precedence
  - event consumption behavior
- Add explicit cooldown/debounce concepts to reduce rapid re-surfacing.
- Add optional feature-scoped pacing rules (for example, max one interruption per time window).
- Add deterministic simulation tests for multi-step conflict scenarios.

Acceptance criteria:

- Trigger behavior is fully specified and test-covered.
- No ambiguous outcomes when multiple steps become eligible simultaneously.
- New steps can be added without unintentionally suppressing existing high-value steps.

## 3) User Experience Controls

Problem:
Current controls (dismiss/skip/skip all/reset) are useful but limited for different user learning styles.

Plan:

- Introduce tutorial intensity modes:
  - Guided (more proactive)
  - Standard (current behavior baseline)
  - Minimal (only critical help)
- Add snooze behavior (temporarily pause tutorials without permanent dismissal).
- Add clearer progression feedback:
  - optional "X of Y" for feature tutorial sequences
  - lightweight completion markers for visited areas
- Ensure all tutorial surfaces follow accessibility and reduced-motion preferences.

Acceptance criteria:

- Users can tune tutorial interruption level.
- Accessibility expectations are defined and testable.
- Return users are less likely to feel repeated friction.

## 4) Observability and Analytics

Problem:
No clear system-level signal exists for tutorial effectiveness.

Plan:

- Define a tutorial telemetry event model:
  - step_eligible
  - step_shown
  - step_completed
  - step_skipped
  - tutorial_dismissed_all
  - tutorial_reset
- Add metadata dimensions:
  - step id
  - feature
  - trigger type
  - tutorial content version
  - session timestamp bucket
- Build a privacy-safe approach that avoids collecting sensitive user data.
- Add a development diagnostics view for trigger traces and eligibility reasons.

Acceptance criteria:

- Product can answer: which steps are shown, skipped, and completed.
- Engineering can inspect per-step decision traces in development.
- Telemetry payload shape is documented before implementation.

## 5) Integration Architecture and Ownership

Problem:
Tutorial integration currently depends on app-level event wiring that can drift during feature work.

Plan:

- Define ownership boundaries:
  - tutorial engine core
  - feature event emitters
  - app context bridge
- Standardize event naming and ownership (which module emits which event).
- Add contract tests that fail if required events/context updates are removed.
- Publish a "how to integrate a new feature into tutorials" checklist.

Acceptance criteria:

- Integration points are explicit and test-enforced.
- Feature teams can add tutorial support using a repeatable template.

## 6) Testing and Quality Strategy

Plan:

- Keep unit tests for trigger evaluation and step resolution.
- Add scenario tests for realistic journeys (first-time user, return user, advanced user).
- Add UI tests for tooltip/modal rendering and focus management.
- Add regression snapshots for tutorial content integrity.

Acceptance criteria:

- Tutorial regressions are caught before merge.
- Test suite covers both logic and UX behavior.

## Delivery Roadmap (Phased)

## Phase 0: Alignment and Spec (1 iteration)

- Finalize glossary/terminology for tutorial semantics.
- Freeze resolution rules and event naming contract.
- Agree on UX mode requirements and telemetry schema.

Exit criteria:

- Approved design doc with clear implementation backlog.

## Phase 1: Foundations (1-2 iterations)

- Add content validation and authoring conventions.
- Add conflict-resolution tests and deterministic simulations.
- Add diagnostics logging contract.

Exit criteria:

- Content and trigger quality gates are green in CI.

## Phase 2: UX Controls (1-2 iterations)

- Implement intensity modes and snooze semantics.
- Improve accessibility behavior and focus handling.
- Add user-facing settings entry points.

Exit criteria:

- Usability checks pass and no major interruption regressions are reported.

## Phase 3: Observability (1 iteration)

- Implement telemetry events and dashboards/reports.
- Add developer trace tooling.

Exit criteria:

- Team can monitor tutorial funnel performance by step and feature.

## Phase 4: Hardening and Cleanup (1 iteration)

- Remove deprecated trigger/content paths.
- Consolidate docs and contributor workflow.
- Run full regression and performance checks.

Exit criteria:

- System is stable, documented, and operationally observable.

## Risks and Mitigations

- Risk: Tutorial fatigue from over-triggering.
  - Mitigation: Intensity modes, pacing rules, and cooldowns.
- Risk: Content drift during feature changes.
  - Mitigation: Contract tests and validation gates.
- Risk: Analytics noise from duplicate events.
  - Mitigation: Event idempotency strategy and schema review.
- Risk: Accessibility regressions in overlays/tooltips.
  - Mitigation: UI tests for focus order, keyboard behavior, and ARIA correctness.

## Open Questions for Iteration

1. Should tutorial progress remain local-only, or should we plan optional account sync later?
2. Which steps are considered "critical" and always allowed in Minimal mode?
3. Do we want feature-scoped completion states in addition to per-step completion?
4. What is the acceptable maximum tutorial interruption frequency per session?
5. Which analytics destination should receive tutorial telemetry first?

## Suggested Next Iteration (No Coding Yet)

Use this document as a planning artifact and iterate in this order:

1. Approve terminology and trigger semantics.
2. Finalize UX mode behavior matrix.
3. Finalize telemetry schema and privacy boundaries.
4. Break approved scope into implementable issues.
5. Start Phase 1 only after sign-off.
