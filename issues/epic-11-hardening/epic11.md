# Epic 11 — Hardening

## Purpose

Create a repeatable hardening lane for cross-feature quality and consistency work.

This first E11 batch focuses on geometry and chord-identity consistency, prompted by drift between the chromatic circle and current chord panel rendering paths.

## Theme

- Eliminate duplicated normalization and scoring logic
- Enforce single-source geometry derivation
- Enforce single-source identity inference policy
- Add regression tests that protect cross-surface parity

## Current Baseline (Verified)

The codebase currently has working but partially duplicated logic across:

- Polygon note ordering and geometry derivation
- Pitch-class normalization and deduplication
- Chord identity inference for custom note sets
- Display naming call sites across multiple features

Recent fixes addressed immediate user-visible issues, but this epic hardens the architecture so the same class of regressions does not recur.

## Goals

1. Make circle and panel geometry derive from one canonical path.
2. Make custom chord identity inference derive from one canonical policy.
3. Remove duplicated low-level pitch-class and scoring logic.
4. Add robust regression tests for parity and edge cases.
5. Document ownership boundaries so future hardening work has a stable template.

## Non-Goals

- New chord categories or theory model changes
- Backend contract changes
- UI redesign
- Tutorial feature enhancements (covered in Epic 10)

## Issue Breakdown

1. [ISSUE-E11-01](./ISSUE-E11-01.md) — Freeze hardening contracts and canonical boundaries
2. [ISSUE-E11-02](./ISSUE-E11-02.md) — Centralize pitch-class normalization and deduplication
3. [ISSUE-E11-03](./ISSUE-E11-03.md) — Unify visual polygon derivation across circle and panel
4. [ISSUE-E11-04](./ISSUE-E11-04.md) — Consolidate chord identity scoring and policy
5. [ISSUE-E11-05](./ISSUE-E11-05.md) — Add parity and edge-case regression test net
6. [ISSUE-E11-06](./ISSUE-E11-06.md) — Document hardening ownership and guardrails
7. [ISSUE-E11-07](./ISSUE-E11-07.md) — Fix CI/security branch coverage blind spot on develop
8. [ISSUE-E11-08](./ISSUE-E11-08.md) — Add API rate limiting and request-size guardrails
9. [ISSUE-E11-09](./ISSUE-E11-09.md) — Reject invalid customNotes instead of silently discarding values
10. [ISSUE-E11-10](./ISSUE-E11-10.md) — Add frontend API timeout and cancellation controls
11. [ISSUE-E11-11](./ISSUE-E11-11.md) — Add structured server exception logging and trace correlation
12. [ISSUE-E11-12](./ISSUE-E11-12.md) — Remove insecure HTTP API fallback outside local development
13. [ISSUE-E11-13](./ISSUE-E11-13.md) — Eliminate silent audio preview failures and add diagnostics

## Recommended Execution Order

1. ISSUE-E11-01
2. ISSUE-E11-02
3. ISSUE-E11-03
4. ISSUE-E11-04
5. ISSUE-E11-05
6. ISSUE-E11-06
7. ISSUE-E11-07
8. ISSUE-E11-09
9. ISSUE-E11-08
10. ISSUE-E11-11
11. ISSUE-E11-12
12. ISSUE-E11-10
13. ISSUE-E11-13

## Expected Outcome

At completion of this E11 batch:

- Geometry consistency is enforced by architecture rather than convention.
- Identity labeling consistency is enforced by shared policy.
- Regression risk from duplicated utility logic is reduced.
- Future hardening work can follow a repeatable issue template.

## Follow-On Hardening Candidates (Future E11 batches)

- Accessibility hardening pass for complex SVG interactions
- Performance hardening for hot rendering paths
- State ownership hardening across cross-feature hooks
- Contract hardening between frontend and backend inference outputs
