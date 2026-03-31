# Documentation Audit — Parametric MIDI Sequencer

**Audit date:** 2026-03-30
**Auditor:** Copilot (automated audit via ISSUE-E9-08)
**Scope:** All documentation artefacts — Markdown files, inline docs, schema/model
definitions, code comments used as documentation, living documents.

---

## 1. Executive Summary

The Parametric MIDI Sequencer has a broad set of documentation artefacts spanning
root-level guides, a `/docs` folder with audit and reference files, a `/docs/spikes`
subdirectory for exploratory research, and inline documentation embedded directly
in source files.

Documentation is generally of high quality and well-structured. This audit
identified **two stale facts**, **two naming inconsistencies**, **two undocumented
features**, and **one missing navigation artefact** (a central docs index). All
gaps are catalogued below with recommended actions.

| Category | Count | Action required |
|---|---|---|
| Canonical | 15 | Maintain — no changes |
| Derived | 4 | Keep in sync with upstream sources |
| Stale | 2 | Fix immediately (inaccurate facts) |
| Redundant | 0 | None found |
| Missing | 3 | Create or update |

---

## 2. Documentation Inventory

### 2.1 Root-level Markdown files

| File | Classification | Description | Notes |
|---|---|---|---|
| `README.md` | Canonical | Project overview, quick start, feature list, troubleshooting | Accurate and complete. Feature list does not include `harmonic-graph` module. |
| `ARCHITECTURE.md` | Canonical | Full system architecture, layer diagrams, feature module table | Accurate. Matches implementation. |
| `CONTRIBUTING.md` | Canonical | Setup, testing, linting, PR workflow | Accurate. |

### 2.2 `/docs` — Reference and audit documents

| File | Classification | Description | Notes |
|---|---|---|---|
| `docs/feature-module-convention.md` | Canonical | Folder structure, barrel export rules, feature table | **Fixed**: corrected `easeInOutQuad, 350 ms` → `easeInOutCubic, 260 ms`; added `harmonic-graph` to feature table. |
| `docs/geometric-harmony-system.md` | Canonical | Coordinate system, intervals, polygon geometry, color schema, voice-leading formulas, animation rules, ii–V bridge model | Accurate and authoritative. Last updated 2026-03-21. |
| `docs/accessibility-audit.md` | Canonical | WCAG compliance audit, keyboard navigation, screen reader gaps | Accurate. |
| `docs/architecture-audit.md` | Canonical | Structural risk assessment, layer analysis, architectural recommendations | Accurate. |
| `docs/data-model-audit.md` | Canonical | Schema inventory, six gap findings and fixes, stability assessment | Accurate. |
| `docs/design-system-audit.md` | Canonical | CSS architecture, design tokens, color system, component catalogue | Accurate. |
| `docs/performance-audit.md` | Canonical | Render bottlenecks, state management, optimization recommendations | Accurate. |
| `docs/tech-debt-audit.md` | Canonical | Technical debt inventory, refactoring candidates | Accurate. |

### 2.3 `/docs/spikes` — Exploratory research documents

| File | Classification | Description | Notes |
|---|---|---|---|
| `docs/spikes/SPIKE-architecture-boundaries.md` | Canonical | Service layer patterns, cross-cutting concerns | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/SPIKE-audiocontext-currenttime-sequencing.md` | Canonical | Web Audio API timing strategies | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/SPIKE-design-system.md` | Canonical | Open design questions: icons, tokens, motion | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/SPIKE-performance-hotspots.md` | Canonical | Critical bottleneck identification | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` | Canonical | Synchronized polygon morphing design | Accurate. Follows SPIKE- naming convention. |
| `docs/spikes/ii-v-bridges.md` | Canonical | ii–V bridge and tritone substitution investigation | **Naming fixed**: renamed to `SPIKE-ii-v-bridges.md`. |
| `docs/spikes/quartal-diatonic.md` | Canonical | Quartal harmony theory and diatonic generation | **Naming fixed**: renamed to `SPIKE-quartal-diatonic.md`. |
| `docs/spikes/security-audit.md` | Canonical | Security vulnerability assessment | **Placement**: this is an audit document, not a spike. Noted but not moved — no consumers depend on its location. |

### 2.4 Sub-project README files

| File | Classification | Description | Notes |
|---|---|---|---|
| `client/README.md` | Derived | Frontend tech stack, scripts, project structure, API client, testing | **Fixed**: corrected `easeInOutQuad, 350 ms` → `easeInOutCubic, 260 ms`; added `harmonic-graph` to feature list. |
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

---

## 4. Conflicts Identified

No conflicts (two documents asserting different canonical facts about the same
concept) were found. The stale items in §3.2 and §3.3 are redundancies between
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
    ├── accessibility-audit.md
    ├── architecture-audit.md
    ├── data-model-audit.md
    ├── design-system-audit.md
    ├── documentation-audit.md
    ├── performance-audit.md
    ├── tech-debt-audit.md
    └── spikes/
        ├── SPIKE-architecture-boundaries.md
        ├── SPIKE-audiocontext-currenttime-sequencing.md
        ├── SPIKE-design-system.md
        ├── SPIKE-ii-v-bridges.md
        ├── SPIKE-performance-hotspots.md
        ├── SPIKE-quartal-diatonic.md
        ├── SPIKE-synchronized-chromatic-circle-animation.md
        └── security-audit.md  # placement mismatch noted; not moved
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
| Medium | Rename ii-v-bridges spike to follow convention | ✅ Done | `docs/spikes/SPIKE-ii-v-bridges.md` |
| Medium | Rename quartal-diatonic spike to follow convention | ✅ Done | `docs/spikes/SPIKE-quartal-diatonic.md` |
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

**Last Updated:** 2026-03-30
