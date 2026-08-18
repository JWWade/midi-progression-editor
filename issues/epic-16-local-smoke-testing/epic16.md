# Epic 16 — Local Smoke-Testing Workflow to Prevent CI Failures

## Purpose

Establish a reliable local smoke-testing workflow that mirrors the CI pipeline closely enough to catch the most common frontend, backend, integration, and environment issues before code is pushed.

This epic focuses on reducing avoidable CI failures, shortening feedback loops, and making contributor expectations explicit and repeatable.

## Current Baseline (Verified)

The repository already has a strong foundation for this work:

- frontend lint, test, and build commands are documented and used in CI
- backend build and test commands are documented and used in CI
- API client generation already exists through the frontend toolchain
- contributor documentation and PR templates are already present in the repo
- recent CI incidents have shown the value of earlier local verification for TypeScript, lint, lockfile, and environment-specific build issues

## Goals

1. Document a clear local smoke-test sequence for contributors.
2. Reduce preventable CI failures caused by skipped local validation.
3. Make frontend, backend, and API-client checks part of the expected dev workflow.
4. Add lightweight automation where it adds value without creating friction.
5. Preserve cross-platform usability for local contributors.

## Non-Goals

- Replacing the CI pipeline with local-only checks
- Introducing heavyweight local tooling that blocks normal development unnecessarily
- Requiring every contributor to run the full workflow on every tiny change regardless of scope
- Creating platform-specific scripts that only work on one development environment

## Sprint / Issue Breakdown

1. [ISSUE-E16-01](./ISSUE-E16-01.md) — Document the canonical local smoke-test workflow for contributors
2. [ISSUE-E16-02](./ISSUE-E16-02.md) — Add a lightweight local automation entry point for smoke testing
3. [ISSUE-E16-03](./ISSUE-E16-03.md) — Add optional pre-push safeguards for lint, test, and build validation
4. [ISSUE-E16-04](./ISSUE-E16-04.md) — Integrate API-client regeneration and lockfile hygiene into the local workflow
5. [ISSUE-E16-05](./ISSUE-E16-05.md) — Validate that the local workflow meaningfully reduces CI regressions

## Recommended Execution Order

1. ISSUE-E16-01
2. ISSUE-E16-02
3. ISSUE-E16-04
4. ISSUE-E16-03
5. ISSUE-E16-05

## Expected Outcome

At the end of this epic, contributors should have a simple, explicit, and repeatable process for verifying their work locally before opening or updating a PR.

The ideal result is fewer avoidable CI failures and more confidence that local success correlates with pipeline success.
