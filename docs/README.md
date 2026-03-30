# Documentation Index — Parametric MIDI Sequencer

This folder contains architecture references, audit reports, and spike
investigations for the Parametric MIDI Sequencer project.

For the project overview and quick-start guide, see the
[root README](../README.md). For the full system architecture, see
[ARCHITECTURE.md](../ARCHITECTURE.md). For contribution guidelines, see
[CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Reference Documents

| Document | Purpose |
|---|---|
| [feature-module-convention.md](feature-module-convention.md) | Canonical folder structure and barrel-export rules for every frontend feature module |
| [geometric-harmony-system.md](geometric-harmony-system.md) | Authoritative reference for coordinate systems, chord/scale intervals, polygon geometry, color language, opacity model, animation rules, and voice-leading formulas |

---

## Audit Reports

Each audit document catalogues findings for a specific quality dimension.

| Document | Dimension | Issue |
|---|---|---|
| [accessibility-audit.md](accessibility-audit.md) | WCAG compliance, keyboard navigation, screen reader support | — |
| [architecture-audit.md](architecture-audit.md) | Layer boundaries, feature module structure, structural risks | ISSUE-E9-04 |
| [data-model-audit.md](data-model-audit.md) | Schema stability, expressiveness, ML-readiness; all six gap findings and fixes | — |
| [design-system-audit.md](design-system-audit.md) | CSS architecture, design tokens, color system, component catalogue | ISSUE-E9-07 |
| [documentation-audit.md](documentation-audit.md) | Documentation inventory, gap analysis, classification of all docs | ISSUE-E9-08 |
| [performance-audit.md](performance-audit.md) | Render bottlenecks, state management efficiency, optimization candidates | ISSUE-E9-05 |
| [tech-debt-audit.md](tech-debt-audit.md) | Technical debt inventory, refactoring candidates, code smell analysis | ISSUE-E9-03 |

---

## Spike Investigations

Spike documents capture open-ended research, design explorations, and technical
investigations that informed (or will inform) feature development.

| Document | Topic | Status |
|---|---|---|
| [spikes/SPIKE-architecture-boundaries.md](spikes/SPIKE-architecture-boundaries.md) | Feature/service/controller layer boundaries and cross-cutting concerns | Open |
| [spikes/SPIKE-audiocontext-currenttime-sequencing.md](spikes/SPIKE-audiocontext-currenttime-sequencing.md) | Web Audio API timing, `AudioContext.currentTime` sequencing strategies | Open |
| [spikes/SPIKE-design-system.md](spikes/SPIKE-design-system.md) | Icon systems, design token expansion, motion/animation standards | Open |
| [spikes/SPIKE-ii-v-bridges.md](spikes/SPIKE-ii-v-bridges.md) | Automatic ii–V bridge and tritone substitution suggestions | Complete |
| [spikes/SPIKE-performance-hotspots.md](spikes/SPIKE-performance-hotspots.md) | Critical performance bottleneck identification | Open |
| [spikes/SPIKE-quartal-diatonic.md](spikes/SPIKE-quartal-diatonic.md) | Quartal harmony theory and diatonic quartal chord generation | Complete |
| [spikes/SPIKE-synchronized-chromatic-circle-animation.md](spikes/SPIKE-synchronized-chromatic-circle-animation.md) | Synchronized polygon morphing animation between chord transitions | Open |
| [spikes/security-audit.md](spikes/security-audit.md) | XSS prevention, CORS, input validation, API security | Complete |

---

## Quick Reference

**"Where does this number/color/shape come from?"**
→ [geometric-harmony-system.md](geometric-harmony-system.md)

**"How should I structure a new feature module?"**
→ [feature-module-convention.md](feature-module-convention.md)

**"What data models and schemas exist?"**
→ [data-model-audit.md](data-model-audit.md) §4 — Schema Inventory

**"What are the known architectural risks?"**
→ [architecture-audit.md](architecture-audit.md)

**"What documentation exists and what's missing?"**
→ [documentation-audit.md](documentation-audit.md)
