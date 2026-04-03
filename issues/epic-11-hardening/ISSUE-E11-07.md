# ISSUE-E11-07 — Fix CI/Security Branch Coverage Blind Spot on develop

## Objective

Ensure quality and security gates run on the actual integration branch (`develop`), not only `main`.

## Title

CI and security workflows skip default branch activity

## Location

- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- Repository default branch: `develop`

## Description

Current workflow triggers are scoped to `main` only. The repository default branch is `develop`, so direct pushes and pull requests targeting `develop` can merge without required CI/security checks.

## Risk & Impact

- High risk of regressions reaching default branch undetected.
- Security scans (CodeQL, dependency audit) are bypassed for normal integration flow.
- Branch protection policies may provide false confidence.

## Reproduction / Detection Method

1. Open `.github/workflows/ci.yml` and `.github/workflows/security.yml`.
2. Confirm `on.push.branches` and `on.pull_request.branches` include only `main`.
3. Create a PR targeting `develop` and verify workflows do not auto-run.

## Recommended Fix

1. Update both workflows to trigger on `develop` (and optionally `main`) for push/PR events.
2. Add a short note in `CONTRIBUTING.md` documenting which branches are protected by required checks.
3. Align branch protection settings with the updated workflow trigger set.

## Verification Step

1. Open a test PR into `develop`.
2. Confirm frontend CI, backend CI, and security workflows all execute automatically.
3. Confirm merge is blocked when a required check fails.

## Severity

High

## Implementation Status

- [x] Workflow triggers updated in `.github/workflows/ci.yml` for `develop` and `main`.
- [x] Workflow triggers updated in `.github/workflows/security.yml` for `develop` and `main`.
- [x] `CONTRIBUTING.md` updated to document PR target branch and required-check expectations.
- [ ] Repository branch protection rules aligned (GitHub settings; manual repo admin action).
