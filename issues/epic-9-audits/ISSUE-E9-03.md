# ISSUE-E9-03 — Technical Debt Audit & Remediation

## Objective

Identify, document, and prioritize areas of technical debt across the codebase, then define actionable remediation tasks. This issue is based on the prior technical debt audit (date: unknown; see audit notes if available) and is intended to ensure the system remains maintainable, evolvable, and robust as new features are added.

## Background

Technical debt refers to expedient design or implementation choices that trade long-term maintainability for short-term delivery. While some debt is strategic, unmanaged debt can slow development, increase bug risk, and make onboarding harder. The prior audit (see SPIKE note) surfaced several recurring themes:

- Accumulated workarounds in core harmony logic and progression sidebar
- Inconsistent type boundaries between frontend and backend
- Legacy code paths (pre-ScaleContext, pre-HarmonySnapshot)
- Gaps in test coverage for edge-case behaviors
- Outdated or duplicated utility functions
- CSS/visual debt in retro and dark themes
- Lint disables and TODO comments left unaddressed

This issue tracks the process of cataloging, prioritizing, and remediating these debts. A SPIKE is permissible to re-run or update the audit if the original notes are unavailable.

---

## Tasks

### Task 1 — Catalog and Classify Technical Debt

**Priority:** High

- Review the codebase for TODO/FIXME comments, lint disables, and known workarounds
- Classify each debt item: critical (blocks new features), moderate (slows development), or minor (cosmetic/cleanup)
- Document all findings in a new audit file (see Files To Add)

**Acceptance criteria:**
- [ ] All TODO/FIXME/lint disables are cataloged
- [ ] Each item is classified and assigned an owner (if possible)
- [ ] Audit file is committed to `docs/tech-debt-audit.md`

---

### Task 2 — Prioritize and Plan Remediation

**Priority:** High

- For each critical or moderate debt item, define a concrete remediation plan (refactor, rewrite, add tests, etc.)
- Group related items into epics or sub-issues if needed
- Identify any debts that require a design SPIKE before remediation

**Acceptance criteria:**
- [ ] Remediation plans are documented for all critical/moderate items
- [ ] SPIKEs are created for any items needing design exploration
- [ ] Issue is updated with links to sub-issues or SPIKEs

---

### Task 3 — Address Legacy and Outdated Code Paths

**Priority:** Moderate

- Remove or refactor code paths that predate `ScaleContext`, `HarmonySnapshot`, or other major refactors
- Replace duplicated or outdated utility functions with shared, tested versions
- Update or remove deprecated API endpoints and DTOs

**Acceptance criteria:**
- [ ] No legacy code paths remain in active use
- [ ] Utilities are consolidated and tested
- [ ] API surface is up-to-date and documented

---

### Task 4 — Improve Test Coverage for Edge Cases

**Priority:** Moderate

- Identify areas with low or missing test coverage, especially for edge-case behaviors in harmony logic, progression editing, and MIDI export
- Add or update tests to cover these cases

**Acceptance criteria:**
- [ ] Test coverage reports show improvement in targeted areas
- [ ] All new/updated tests pass

---

### Task 5 — Clean Up Visual and CSS Debt

**Priority:** Low

- Review retro and dark theme overrides for consistency and maintainability
- Remove unused or redundant CSS rules
- Address any visual glitches or inconsistencies noted in the audit

**Acceptance criteria:**
- [ ] Visual presentation is consistent across all themes
- [ ] CSS is clean, DRY, and maintainable

---

## Files To Add

| File | Purpose |
|---|---|
| `docs/tech-debt-audit.md` | Catalog of all identified technical debt items |
| `docs/spikes/SPIKE-tech-debt-audit.md` | (optional) Updated audit notes if original is missing |

## Files To Edit

| File | Change |
|---|---|
| All source files with TODO/FIXME/lint disables | Catalog and address as needed |
| Legacy utility and API files | Refactor or remove |
| Test files | Add/expand edge-case coverage |
| CSS/theme files | Clean up and consolidate |

---

## Acceptance Criteria (overall)

- [ ] All technical debt items are cataloged and classified
- [ ] Remediation plans are defined for all critical/moderate items
- [ ] Legacy code paths are removed or refactored
- [ ] Test coverage is improved for edge cases
- [ ] Visual/CSS debt is addressed
- [ ] All new/updated code passes lint, build, and test checks

## Verification Commands

```bash
# Frontend
cd client
npm run lint
npm run build
npm test

# Backend
cd server/ParametricMusic.Tests
dotnet test
```
