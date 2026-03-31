# ISSUE-E9-07 — Design System & Visual Consistency Audit

## Objective

Evaluate and enhance the project's design system and visual consistency, ensuring a unified, expressive, and composer-friendly UI. This issue is based on the prior Design System & Visual Consistency Audit (see audit notes below) and aims to surface and address inconsistencies in component styling, layout, and iconography.

## Background

A strong design system is essential for a composer-facing UI. The audit focused on:

- Are components visually consistent?
- Are spacing, typography, and color rules coherent?
- Does the chromatic circle and progression sidebar feel unified?
- Are icons consistent in geometry, metaphor, and color?

This aligns with the project's preference for playful, expressive iconography and a visually inviting interface.

---

## Tasks

### Task 1 — Inventory and Document Current Visual System

**Priority:** High

- Catalog all major UI components, their visual styles, and icon usage
- Identify inconsistencies in spacing, typography, color, and iconography
- Document findings in a new audit file (see Files To Add)

**Acceptance criteria:**
- [ ] Visual inventory and summary are created
- [ ] All major inconsistencies are documented

---

### Task 2 — Define and Document Design System Standards

**Priority:** High

- Establish or update standards for spacing, typography, color palette, and icon usage
- Create reference documentation or style guides as needed
- Propose SPIKEs for areas needing deeper design exploration

**Acceptance criteria:**
- [ ] Design system standards are documented and accessible
- [ ] SPIKEs are created for complex or ambiguous design issues

---

### Task 3 — Remediate Visual Inconsistencies

**Priority:** Medium

- Update components, styles, and icons to align with the documented standards
- Ensure the chromatic circle and progression sidebar feel visually unified
- Replace or update icons for consistency in geometry, metaphor, and color

**Acceptance criteria:**
- [ ] All major components conform to design system standards
- [ ] Chromatic circle and progression sidebar are visually unified
- [ ] Iconography is consistent and expressive

---

## Files To Add

| File | Purpose |
|---|---|
| `docs/design-system-audit.md` | Visual inventory, inconsistency catalog, style guide notes |
| `docs/spikes/SPIKE-design-system.md` | (optional) Deep dives into complex design or iconography issues |

## Files To Edit

| File | Change |
|---|---|
| UI component and style files | Update for consistency and adherence to standards |
| Icon assets | Update or replace for visual coherence |
| Documentation | Add or update style guides and visual references |

---

## Acceptance Criteria (overall)

- [ ] Visual inventory and inconsistency catalog are complete
- [ ] Design system standards are defined and documented
- [ ] All major components and icons conform to standards
- [ ] Chromatic circle and progression sidebar are visually unified
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
