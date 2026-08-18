# ISSUE-E16-01 — Document the Canonical Local Smoke-Test Workflow for Contributors

## Objective

Create clear contributor-facing guidance that defines the expected local smoke-test workflow before pushing code.

## Background

The repo already documents development, testing, linting, and build commands, but recent CI issues have shown that contributors benefit from a more explicit checklist-driven smoke-test flow that mirrors what the pipeline is actually enforcing.

## Scope

1. Document the recommended smoke-test order for common change types.
2. Cover frontend, backend, API-client, and general repo hygiene checks.
3. Keep the instructions concise, scannable, and easy to follow.
4. Make clear when a reduced set of checks is acceptable and when a full smoke test is required.

## Candidate Workflow

### Frontend
- `npm install`
- `npm run lint`
- `npm run test`
- `npm run build`
- quick browser smoke test with console review

### Backend
- `dotnet build`
- `dotnet test`
- API health check

### Integration / General
- regenerate API client when backend contracts change
- resolve merge conflicts
- ensure lockfiles are current
- verify a clean working tree before push

## Files To Update

- `CONTRIBUTING.md`
- `README.md` if a shorter quick-check section belongs there
- any CI or workflow docs that should cross-reference the process

## Acceptance Criteria

- [ ] The local smoke-test workflow is documented in contributor guidance.
- [ ] The sequence mirrors the repo’s real CI expectations.
- [ ] The instructions are clear about when each check is required.
- [ ] Contributors can follow the workflow without needing tribal knowledge.
