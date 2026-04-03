# ISSUE-E11-06 — Document Hardening Ownership and Add Guardrails

## Objective

Document long-term ownership and add lightweight guardrails so future hardening work scales without reintroducing drift.

## Background

This is the sustainability layer for E11: after refactors and tests are in place, ownership and review guidance must be explicit.

## Scope

1. Document canonical ownership for geometry and identity logic.
2. Add contributor guidance for extending chord rendering paths.
3. Add practical guardrails for detecting future duplication.

## Files To Edit

- `ARCHITECTURE.md`
- `docs/feature-module-convention.md`
- `README.md` and/or `client/README.md` (if contributor guidance belongs there)

## Requirements

- Document where pitch-class normalization logic belongs.
- Document where polygon ordering logic belongs.
- Document where custom-chord identity policy belongs.
- Add review checklist bullets for geometry/identity parity changes.
- Add optional guardrail recommendations (for example, CI grep checks or lint rules) to discourage inline normalization duplication.

## Acceptance Criteria

- [x] Documentation clearly identifies single-source ownership boundaries.
- [x] Contributors have a concise checklist for extending chord rendering logic safely.
- [x] Guardrail recommendations are actionable and repository-appropriate.

## Verification

- [x] A new contributor can identify canonical modules for geometry and identity logic in under five minutes from docs alone.
