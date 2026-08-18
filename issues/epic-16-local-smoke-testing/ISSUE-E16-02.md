# ISSUE-E16-02 — Add a Lightweight Local Automation Entry Point for Smoke Testing

## Objective

Provide a simple, repeatable command or script that helps contributors run the most important local smoke tests with minimal friction.

## Background

Documentation helps, but a low-friction automation entry point makes the workflow more consistent and easier to adopt. The current repo already has launcher scripts and clear frontend/backend commands, so this work should build on that style.

## Scope

1. Define a local smoke-test command or script for common verification paths.
2. Keep the workflow cross-platform where practical.
3. Ensure the script runs only stable, meaningful checks.
4. Avoid introducing brittle or slow automation that discourages usage.

## Requirements

### UX of the command

- Should be easy to discover and run.
- Should clearly report which phase failed.
- Should not hide useful command output.
- Should be safe for local development.

### Candidate checks

- frontend install / lint / test / build
- backend build / test
- optional health-check validation if the backend is already running

## Acceptance Criteria

- [ ] A documented automation entry point exists for smoke testing.
- [ ] It works reliably on supported contributor environments.
- [ ] It surfaces failures clearly.
- [ ] It complements the contributor docs rather than replacing them.
