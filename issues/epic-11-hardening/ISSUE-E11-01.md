# ISSUE-E11-01 — Freeze Hardening Contracts and Canonical Boundaries

## Objective

Define the explicit contracts and ownership boundaries that all geometry and identity hardening work must follow.

## Background

Recent regressions showed that functionally similar logic existed in multiple locations, and fixes landed on one path before others. This issue defines the canonical boundaries before broader refactoring.

## Scope

1. Define a canonical visual geometry contract.
2. Define a canonical custom-chord identity contract.
3. Define utility ownership boundaries (where logic is allowed to live).
4. Define migration constraints and non-goals.

## Files To Edit

- `ARCHITECTURE.md`
- `docs/feature-module-convention.md`
- Optionally add a focused hardening note under `docs/` if needed

## Requirements

### Visual Geometry Contract

Specify that rendered polygon input must be:

- normalized to pitch classes (0–11)
- deduplicated
- circularly ordered
- root-rotated when root context exists

### Identity Contract

Specify the canonical policy for custom note sets:

- exact-match path
- non-exact fallback path
- display formatting path

### Ownership Boundaries

Define which modules own:

- low-level pitch-class operations
- polygon ordering and geometry derivation
- identity scoring and policy
- display naming

## Acceptance Criteria

- [x] Contracts are written and discoverable in project docs.
- [x] Ownership boundaries are explicit enough to guide code review decisions.
- [x] Non-goals are documented to prevent scope creep.

## Verification

- [x] Team can identify one canonical module per responsibility without ambiguity.
