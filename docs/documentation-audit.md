# Documentation Audit — Parametric MIDI Sequencer

**Audit date:** 2026-04-02 (updated; original 2026-03-30)
**Auditor:** Copilot (automated audit via ISSUE-E9-08)
**Scope:** All documentation artefacts — Markdown files, inline docs, schema/model
definitions, code comments used as documentation, living documents.

---

## 1. Executive Summary

The Parametric MIDI Sequencer has a broad set of documentation artefacts spanning
root-level guides, a `/docs` folder with audit and reference files, a `/docs/spikes`
subdirectory for exploratory research, and inline documentation embedded directly
in source files.

Documentation is generally of high quality and well-structured. The initial audit
(2026-03-30) identified **two stale facts**, **two naming inconsistencies**, **two
undocumented features**, and **one missing navigation artefact**. All gaps from the
initial audit were resolved. A follow-up pass (2026-04-02) found four additional gaps
— two undocumented feature modules, two missing docs/README.md entries — and resolved
all of them.

| Category | Count | Action required |
|---|---|---|
| Canonical | 17 | Maintain — no changes |
| Derived | 4 | Keep in sync with upstream sources |
| Stale | 2 | ✅ Fixed (initial audit) |
| Redundant | 0 | None found |
| Missing | 7 | ✅ All fixed across both audit passes |

---

## 2. Documentation Inventory

### 2.1 Root-level Markdown files

| File | Classification | Description | Notes |
|---|---|---|---|
| `README.md` | Canonical | Project overview, quick start, feature list, troubleshooting | **Fixed (2026-04-02)**: removed BOM character, fixed double spaces, added `negative-harmony`, `tutorial`, `harmonic-graph`, `ii-v-suggestions` to feature list and project structure. |
| `ARCHITECTURE.md` | Canonical | Full system architecture, layer diagrams, feature module table | **Fixed (2026-04-02)**: added `negative-harmony/` and `tutorial/` to directory tree. |
| `CONTRIBUTING.md` | Canonical | Setup, testing, linting, PR workflow | Accurate. |

### 2.2 `/docs` — Reference and audit documents

| File | Classification | Description | Notes |
|---|---|---|---|
| `docs/feature-module-convention.md` | Canonical | Folder structure, barrel export rules, feature table | **Fixed (initial)**: corrected `easeInOutQuad, 350 ms` → `easeInOutCubic, 260 ms`; added `harmonic-graph`. **Fixed (2026-04-02)**: added `negative-harmony` and `tutorial`. |
| `docs/geometric-harmony-system.md` | Canonical | Coordinate system, intervals, polygon geometry, color schema, voice-leading formulas, animation rules, ii–V bridge model | Accurate and authoritative. Last updated 2026-03-21. |
| `docs/glossary.md` | Canonical | Normative vocabulary for code, UI, and music-theory concepts | **Previously missing from `docs/README.md`**. Added to Reference Documents table (2026-04-02). |
| `docs/accessibility-audit.md` | Canonical | WCAG compliance audit, keyboard navigation, screen reader gaps | Accurate. |
| `docs/architecture-audit.md` | Canonical | Structural risk assessment, layer analysis, architectural recommendations | Accurate. |
| `docs/data-model-audit.md` | Canonical | Schema inventory, six gap findings and fixes, stability assessment | Accurate. |
| `docs/design-system-audit.md` | Canonical | CSS architecture, design tokens, color system, component catalogue | Accurate. |
| `docs/dx-audit.md` | Canonical | Developer experience — setup, tooling, scripts, error handling, API evolution | Accurate. |
| `docs/performance-audit.md` | Canonical | Render bottlenecks, state management, optimization recommendations | Accurate. |
| `docs/tech-debt-audit.md` | Canonical | Technical debt inventory, refactoring candidates | Accurate. |
| `docs/testing-audit.md` | Canonical | Test coverage inventory, gap analysis, and recommended tests | **Previously missing from `docs/README.md`**. Added to Audit Reports table (2026-04-02). |

### 2.3 `/docs/spikes` — Exploratory research documents

| File | Classification | Description | Notes |
|---|---|---|---|
| `docs/spikes/SPIKE-architecture-boundaries.md` | Canonical | Service layer patterns, cross-cutting concerns | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/SPIKE-audiocontext-currenttime-sequencing.md` | Canonical | Web Audio API timing strategies | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/SPIKE-cross-size-voice-leading.md` | Canonical | Cross-size chord distance for flexible voice-leading paths | **Previously missing from `docs/README.md`**. Added to Spike Investigations table (2026-04-02). |
| `docs/spikes/SPIKE-design-system.md` | Canonical | Open design questions: icons, tokens, motion | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/SPIKE-dx-setup.md` | Canonical | Prerequisite-check scripts and `generate:api` hardening | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/SPIKE-ii-v-bridges.md` | Canonical | ii–V bridge and tritone substitution investigation | **Naming fixed (initial)**: renamed from `ii-v-bridges.md`. |
| `docs/spikes/SPIKE-performance-hotspots.md` | Canonical | Critical bottleneck identification | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/SPIKE-quartal-diatonic.md` | Canonical | Quartal harmony theory and diatonic generation | **Naming fixed (initial)**: renamed from `quartal-diatonic.md`. |
| `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` | Canonical | Synchronized polygon morphing design | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/negative-harmony.md` | Canonical | Architectural readiness and prototype for negative harmony transform | **Previously missing from `docs/README.md`**. Added to Spike Investigations table (2026-04-02). Does not follow SPIKE- naming convention — noted but not renamed. |
| `docs/spikes/security-audit.md` | Canonical | Security vulnerability assessment | **Placement**: this is an audit document, not a spike. Noted but not moved — no consumers depend on its location. |

### 2.4 Sub-project README files

| File | Classification | Description | Notes |
|---|---|---|---|
| `client/README.md` | Derived | Frontend tech stack, scripts, project structure, API client, testing | **Fixed (initial)**: corrected `easeInOutQuad, 350 ms` → `easeInOutCubic, 260 ms`; added `harmonic-graph`. **Fixed (2026-04-02)**: added `negative-harmony` and `tutorial`. |
| `server/README.md` | Canonical | Backend scope, controllers, domain capabilities, architecture notes | Accurate. |
| `server/CONTROLLER-REVIEW.md` | Canonical | Live controller walkthrough plan and session log | Working document; intentionally incomplete. |

### 2.5 Inline documentation (code comments)

| Location | Classification | Notes |
|---|---|---|
| `client/src/features/chord-animation/hooks/useChordMorphing.ts` | Canonical | JSDoc comment accurately describes hook behavior. |
| `client/src/features/voice-leading/utils/voicing.ts` | Canonical | Inline comments explain voicing formulas. |
| `client/src/features/ii-v-suggestions/utils/suggestBridges.ts` | Canonical | Inline comments explain scoring logic. |
| `server/ParametricMusic.Api/Controllers/*.cs` | Derived | XML doc comments feed Swagger; accurate. |
| `server/ParametricMusic.Api/Services/*.cs` | Canonical | Inline comments explain harmonic algorithms. |
| `server/ParametricMusic.Api/Models/*.cs` | Derived | `[JsonPropertyName]` and property docs feed OpenAPI schema. |

### 2.6 Generated and toolchain documentation

| File | Classification | Notes |
|---|---|---|
| `client/swagger.json` | Derived | Auto-generated from backend; regenerate with `npm run generate:api`. **Never edit manually.** |
| `client/src/api/generated/index.ts` | Derived | Auto-generated from `swagger.json`. **Never edit manually.** |

---

## 3. Gap Analysis

### 3.1 ~~Missing: Central documentation index~~ — **Fixed**

`docs/README.md` was created as a linked table of all documents serving as a
navigation entry point for the `/docs` folder.

### 3.2 ~~Stale: Animation easing and duration in `docs/feature-module-convention.md`~~ — **Fixed**

Line 74 read: `"drives an animation loop (easeInOutQuad, 350 ms)"`.

The actual implementation (`useChordMorphing.ts`) uses:
- Easing: `easeInOutCubic`
- Duration: `DEFAULT_MORPH_DURATION_MS = 260`

Updated to reference `easeInOutCubic, 260 ms`.

### 3.3 ~~Stale: Animation comment in `client/README.md`~~ — **Fixed**

Line 71 read: `"chord-animation/    # Animated chord shape transitions (easeInOutQuad, 350 ms)"`.

Updated to `easeInOutCubic, 260 ms`.

### 3.4 ~~Missing: `harmonic-graph` in feature lists~~ — **Fixed**

One feature module that existed in `client/src/features/` was absent from the
feature tables in `docs/feature-module-convention.md` and `client/README.md`:

- `harmonic-graph/` — Harmonic relationship graph; exposes
  `findShortestVoiceLeading` (Dijkstra's on a 19-node T-canonical chord graph).
The module was added to both feature tables.

### 3.5 ~~Naming inconsistency: Two spike files lacked SPIKE- prefix~~ — **Fixed**

All files in `docs/spikes/` now follow the `SPIKE-*.md` naming convention:

- `docs/spikes/ii-v-bridges.md` → renamed to `SPIKE-ii-v-bridges.md`
- `docs/spikes/quartal-diatonic.md` → renamed to `SPIKE-quartal-diatonic.md`

Cross-references in `issues/epic-8-bridges/ISSUE-E8-01.md` were updated.

### 3.6 Placement: `docs/spikes/security-audit.md` is an audit, not a spike

Security audits are thematically consistent with the other audit files in `docs/`.
Placing this file in `docs/spikes/` is technically a classification mismatch,
though no functional harm results.

**Action:** Note the mismatch here; leave the file in place to avoid breaking
any existing links. Consider moving it to `docs/` in a future cleanup pass.

### 3.7 ~~Missing: `negative-harmony` and `tutorial` feature modules in all documentation~~ — **Fixed (2026-04-02)**

Two feature modules existed in `client/src/features/` but were not documented
anywhere:

- `negative-harmony/` — Negative harmony pitch-class reflection transform.
  Implements `reflectPitchClass(p, centre) = ((2*centre - p) % 12 + 12) % 12`
  with axis `centre = tonicRoot + 3.5`. Exports `reflectPitchClasses`,
  `applyNegativeHarmonyToChord`, `applyNegativeHarmony`.
- `tutorial/` — Interactive first-use tutorial. Provides `TutorialProvider`,
  `useTutorial()` hook, trigger manager (action/state/idle/composite), localStorage
  persistence, and `TutorialTooltip` / `TutorialModal` UI components.

Both modules were added to:
- `README.md` — feature list (About section) and Project Structure
- `ARCHITECTURE.md` — directory tree
- `docs/feature-module-convention.md` — Feature Overview table
- `client/README.md` — project structure

### 3.8 ~~Missing: `testing-audit.md`, `glossary.md`, two spikes from `docs/README.md`~~ — **Fixed (2026-04-02)**

Four documents existed on disk but were not linked from `docs/README.md`:

- `docs/testing-audit.md` — Added to Audit Reports table.
- `docs/glossary.md` — Added to Reference Documents table.
- `docs/spikes/SPIKE-cross-size-voice-leading.md` — Added to Spike Investigations table.
- `docs/spikes/negative-harmony.md` — Added to Spike Investigations table.
  Note: this file does not follow the `SPIKE-*.md` naming convention. The mismatch
  is noted but the file is not renamed to avoid breaking existing links.

### 3.9 ~~Stale: Root `README.md` formatting issues~~ — **Fixed (2026-04-02)**

Two cosmetic issues in `README.md` were corrected:
- UTF-8 BOM character (`\uFEFF`) at the start of the file — removed.
- Section headers "Terminal 1  Backend" and "Terminal 2  Frontend" used double
  spaces instead of an em dash — corrected to `Terminal 1 — Backend` / `Terminal 2 — Frontend`.

---

## 4. Conflicts Identified

No conflicts (two documents asserting different canonical facts about the same
concept) were found. The stale items in §3.2, §3.3, and §3.9 are redundancies between
documentation and the source of truth in code — not conflicts between two
documentation sources.

---

## 5. Orphaned / Unused Documentation

No orphaned documents were found. Every file in `docs/` is either:
- Linked from `CONTRIBUTING.md`, `README.md`, or `ARCHITECTURE.md`, or
- A self-contained spike investigation that is internally referenced.

`server/CONTROLLER-REVIEW.md` is a working document — it is intentionally
incomplete and referenced from `server/README.md`.

---

## 6. Documentation Structure Assessment

The current structure is clear and should be preserved:

```
<root>/
├── README.md              # Project entry point
├── ARCHITECTURE.md        # System design reference
├── CONTRIBUTING.md        # Contributor guide
└── docs/
    ├── README.md          # Central docs index
    ├── feature-module-convention.md
    ├── geometric-harmony-system.md
    ├── glossary.md
    ├── accessibility-audit.md
    ├── architecture-audit.md
    ├── data-model-audit.md
    ├── design-system-audit.md
    ├── documentation-audit.md
    ├── dx-audit.md
    ├── performance-audit.md
    ├── tech-debt-audit.md
    ├── testing-audit.md
    └── spikes/
        ├── SPIKE-architecture-boundaries.md
        ├── SPIKE-audiocontext-currenttime-sequencing.md
        ├── SPIKE-cross-size-voice-leading.md
        ├── SPIKE-design-system.md
        ├── SPIKE-dx-setup.md
        ├── SPIKE-ii-v-bridges.md
        ├── SPIKE-performance-hotspots.md
        ├── SPIKE-quartal-diatonic.md
        ├── SPIKE-synchronized-chromatic-circle-animation.md
        ├── negative-harmony.md  # naming mismatch noted; not renamed
        └── security-audit.md   # placement mismatch noted; not moved
```

No structural changes (new top-level categories, moved directories) are required.
The existing two-level layout (root-level audits + `/spikes/` for exploratory
research) is an adequate and intuitive separation.

---

## 7. Recommended Actions Summary

| Priority | Action | Status | File(s) |
|---|---|---|---|
| High | Create central docs index | ✅ Done | `docs/README.md` (created) |
| High | Fix stale easing/duration in feature-module-convention | ✅ Done | `docs/feature-module-convention.md` |
| High | Fix stale easing/duration in client README | ✅ Done | `client/README.md` |
| High | Add `harmonic-graph` to feature tables | ✅ Done | `docs/feature-module-convention.md`, `client/README.md` |
| High | Add `negative-harmony` and `tutorial` to all feature tables | ✅ Done | `README.md`, `ARCHITECTURE.md`, `docs/feature-module-convention.md`, `client/README.md` |
| High | Add missing docs to `docs/README.md` index | ✅ Done | `docs/README.md` (glossary, testing-audit, 2 spikes) |
| High | Fix BOM and formatting in root `README.md` | ✅ Done | `README.md` |
| Medium | Rename ii-v-bridges spike to follow convention | ✅ Done | `docs/spikes/SPIKE-ii-v-bridges.md` |
| Medium | Rename quartal-diatonic spike to follow convention | ✅ Done | `docs/spikes/SPIKE-quartal-diatonic.md` |
| Low | Consider renaming `negative-harmony.md` to `SPIKE-negative-harmony.md` | ⬜ Deferred | `docs/spikes/negative-harmony.md` |
| Low | Consider moving security-audit to `docs/` | ⬜ Deferred | `docs/spikes/security-audit.md` |

---

## 8. Verification

All documentation must remain consistent with:

```bash
# Frontend lint and build
cd client
npm run lint
npm run build
npm test

# Backend tests
cd server/ParametricMusic.Tests
dotnet test
```

Documentation-only changes do not affect test output, but all code changes
made alongside this audit must pass all checks above.

---

**Last Updated:** 2026-04-02
