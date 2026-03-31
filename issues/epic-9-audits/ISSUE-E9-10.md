# ISSUE-E9-10 — Testing Strategy & Coverage Audit

## Objective

Evaluate and improve the project's testing strategy and coverage, ensuring that tests are meaningful, robust, and comprehensive. This issue is based on the prior Testing Strategy & Coverage Audit (see audit notes below) and aims to identify gaps, brittle tests, and untested invariants, especially in generative and harmonic logic.

## Background

This audit is not just about the presence of tests, but their quality and scope:

- Do the tests actually test the right things?
- Are there missing categories (property tests, fuzz tests, integration tests)?
- Are tests brittle or overly tied to implementation details?
- Are there untested invariants in your harmonic model?

This is especially important for generative systems where correctness is emergent and subtle bugs can escape traditional test strategies.

---

## Tasks

### Task 1 — Inventory and Assess Current Test Coverage

**Priority:** High

- Generate and review test coverage reports for frontend and backend
- Identify untested or under-tested modules, especially in generative and harmonic logic
- Document findings in a new audit file (see Files To Add)

**Acceptance criteria:**
- [ ] Test coverage inventory and assessment summary are created
- [ ] All major gaps and brittle areas are documented

---

### Task 2 — Expand Test Categories and Strategies

**Priority:** High

- Add or improve property-based tests, fuzz tests, and integration tests where missing
- Reduce reliance on brittle, implementation-tied unit tests
- Propose SPIKEs for complex or ambiguous testing needs

**Acceptance criteria:**
- [ ] All major test categories are represented
- [ ] SPIKEs are created for complex or emergent test strategies

---

### Task 3 — Test Harmonic Model Invariants and Generative Logic

**Priority:** Medium

- Identify and encode invariants in the harmonic model (e.g., voice-leading constraints, chord progression rules)
- Add tests to ensure generative outputs remain musically valid and consistent

**Acceptance criteria:**
- [ ] Harmonic invariants are tested and enforced
- [ ] Generative logic is covered by robust tests

---

## Files To Add

| File | Purpose |
|---|---|
| `docs/testing-audit.md` | Test coverage inventory, gap analysis, strategy notes |
| `docs/spikes/SPIKE-testing-strategy.md` | (optional) Deep dives into complex or emergent testing needs |

## Files To Edit

| File | Change |
|---|---|
| Test files and suites | Add or improve tests as needed |
| Harmonic/generative modules | Add invariant and property-based tests |
| Documentation | Add or update testing strategy and coverage notes |

---

## Acceptance Criteria (overall)

- [ ] Test coverage inventory and gap analysis are complete
- [ ] All major test categories are represented
- [ ] Harmonic invariants and generative logic are robustly tested
- [ ] All new/updated code passes lint, build, and test checks

## Verification Commands

```bash
# Frontend
cd client
npm run lint
npm run build
npm test -- --coverage

# Backend
cd server/ParametricMusic.Tests
dotnet test
```
