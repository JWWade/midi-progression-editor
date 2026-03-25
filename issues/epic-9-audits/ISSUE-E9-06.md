# ISSUE-E9-06 — Cognitive Load & Information Architecture Audit

## Objective

Evaluate and improve the system's cognitive load and information architecture, ensuring the UI and workflows align with the composer's mental model and support creative flow. This issue is based on the prior Cognitive Load & Information Architecture Audit (see audit notes below) and aims to surface and address friction points that force users to think about implementation details instead of music.

## Background

This audit focuses on the user's experience as a composer:

- Does the UI reflect your mental model?
- Are musical concepts surfaced at the right level?
- Are you exposing too much engine detail?
- Are there places where the UI forces you to think about implementation instead of music?

The goal is to protect and enhance creative flow by minimizing unnecessary complexity and surfacing musical concepts intuitively.

---

## Tasks

### Task 1 — Map Current Information Architecture and User Flows

**Priority:** High

- Diagram the current UI structure and user flows for core tasks (e.g., building a progression, exporting MIDI, inspecting chords)
- Identify areas where the UI or terminology diverges from the composer's mental model
- Document findings in a new audit file (see Files To Add)

**Acceptance criteria:**
- [ ] Information architecture diagram and user flow summaries are created
- [ ] All major friction points and mismatches are documented

---

### Task 2 — Identify and Prioritize Cognitive Load Hotspots

**Priority:** High

- Analyze the UI for places where users are forced to think about implementation details (e.g., engine internals, technical jargon, non-musical abstractions)
- Prioritize hotspots based on their impact on creative flow
- Propose SPIKEs for ambiguous or complex issues

**Acceptance criteria:**
- [ ] All major cognitive load hotspots are listed and prioritized
- [ ] SPIKEs are created for issues needing deeper exploration

---

### Task 3 — Plan and Implement Remediation Actions

**Priority:** Medium

- For each high-priority hotspot, define a concrete remediation plan (UI redesign, terminology update, abstraction, etc.)
- Group related actions into sub-issues or epics if needed
- Update the issue with links to SPIKEs or sub-issues

**Acceptance criteria:**
- [ ] Remediation plans are documented for all high-priority hotspots
- [ ] Issue is updated with links to SPIKEs or sub-issues

---

### Task 4 — Align UI and Terminology with Musical Concepts

**Priority:** Medium

- Review all UI labels, tooltips, and documentation for alignment with musical concepts and user expectations
- Replace technical or implementation-centric terms with intuitive, music-focused language
- Ensure that advanced features are discoverable but do not clutter the core creative workflow

**Acceptance criteria:**
- [ ] UI and documentation use intuitive, music-focused terminology
- [ ] Advanced features are accessible but not intrusive

---

## Files To Add

| File | Purpose |
|---|---|
| `docs/cognitive-load-audit.md` | Information architecture diagrams, user flow analysis, hotspot catalog |
| `docs/spikes/SPIKE-cognitive-load-hotspots.md` | (optional) Deep dives into complex cognitive load issues |

## Files To Edit

| File | Change |
|---|---|
| UI components and labels | Update terminology and abstractions as needed |
| Documentation | Add or update user flow diagrams and terminology guides |

---

## Acceptance Criteria (overall)

- [ ] Information architecture and user flows are mapped and documented
- [ ] All major cognitive load hotspots are identified and prioritized
- [ ] Remediation plans are defined for high-priority hotspots
- [ ] UI and terminology are aligned with musical concepts
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
