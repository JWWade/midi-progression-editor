# ISSUE-E16-04 — Integrate API-Client Regeneration and Lockfile Hygiene into the Local Workflow

## Objective

Make API-client regeneration and dependency/lockfile hygiene an explicit part of local smoke testing so environment drift and integration mismatches are caught earlier.

## Background

Recent failures have shown that CI issues are not always caused by app logic alone. Problems can also come from stale generated clients, unresolved merge conflicts, outdated lockfiles, or cross-platform dependency mismatches.

## Scope

1. Define when API-client regeneration is required.
2. Add lockfile and dependency hygiene guidance to the smoke-test workflow.
3. Ensure contributors understand how to validate environment-sensitive frontend dependencies.
4. Reduce the risk of source changes landing with stale generated artifacts.

## Requirements

### Workflow expectations

- If backend endpoints change, API client regeneration must be part of the local verification path.
- Contributors should verify that lockfiles are current and merge conflicts are fully resolved.
- The workflow should call out environment-sensitive dependency risks clearly.

## Acceptance Criteria

- [ ] API-client regeneration is included in the documented workflow when applicable.
- [ ] Lockfile hygiene expectations are explicitly documented.
- [ ] Contributors have clear guidance for dependency-related CI issues.
- [ ] The risk of stale generated code reaching CI is reduced.
