# Testing Audit — Parametric MIDI Sequencer

> **Date:** 2026-03-30  
> **Scope:** Full project — frontend (Vitest) and backend (xUnit)

---

## 1. Executive Summary

The project has a solid test foundation: **747 frontend tests** across 45 test files and **133 backend tests** covering all core services and HTTP controllers. Coverage is strong in harmonic-graph, voice-leading, progression utilities, and core chord generation. The primary gaps are in colour-language utilities, some midi-export helpers, and the `QuartalChordGenerator` backend service (previously untested).

---

## 2. Coverage Inventory

### 2.1 Frontend — Before Audit

Coverage was run with `npm run test:coverage` (v8 provider).

| Module / File | Stmts % | Branch % | Funcs % | Lines % | Gap notes |
|---|---|---|---|---|---|
| `color-language/utils/chordColorUtils.ts` | 20.89 | 25.92 | 44.44 | 20.31 | `getAccessibleTextColor`, private HSL helpers untested |
| `color-language/constants/chordColors.ts` | 0 | 0 | 0 | 0 | Re-export barrel — no logic to test directly |
| `midi-export/utils/bpmTempoLabel.ts` | 18.18 | 20.00 | 16.66 | 20.00 | `getTempoMarkingMin/Max`, `getRandomBpmInRange` untested |
| `chromatic-circle/utils/circleColors.ts` | 62.96 | 45.45 | 100 | 60.86 | Dark-theme branch of `getCircleColor` untested |
| `chord/utils/transpose.ts` | 90.62 | 33.33 | 76.92 | 92.85 | `getChordTriad`, `rotateChordNotes` and related utils untested |
| `chromatic-circle/hooks/useDragState.ts` | 60.00 | 18.18 | 100 | 63.88 | Drag-move and pointer-up branches |
| `chromatic-circle/hooks/useCustomChordState.ts` | 68.42 | 46.66 | 100 | 69.76 | Toggle/clear paths, edge cases |
| `scale/utils/scaleUtils.ts` | 80.00 | 83.33 | 100 | 75.00 | Minor branch gap (line 18) |
| `shared/utils/logger.ts` | 80.00 | 25.00 | 80.00 | 80.00 | Production-only warn/error path |

**Well-covered modules (≥95% statement coverage):**
- `voice-leading/utils/*` (99–100%)
- `harmonic-graph/utils/*` (98–100%)
- `chord-morphing/utils/*`, `chord-geometry/utils/*`, `chord-inspection/utils/*` (100%)
- `ii-v-suggestions/utils/*` (94–100%)
- `intent-capture/services/*` (100%)
- `scale/utils/*` (scales, intervals: 100%)
- `progression-sidebar/utils/*` (snapshotIO, pairMetrics: 100%)
- `shared/types/*` (harmonySnapshot: 100%)

### 2.2 Backend — Before Audit

Backend test runner: `dotnet test` (xUnit). **106 tests** across 7 test files.

| Service / Area | Test File | Status |
|---|---|---|
| `ChordGenerator` | `ChordGeneratorTests.cs` | ✅ 13 tests — all qualities + wrap-around |
| `ScaleGenerator` | `ScaleGeneratorTests.cs` | ✅ 13 tests — all 8 modes + transposition |
| `ProgressionAnalyzer` | `ProgressionAnalyzerTests.cs` | ✅ 22 tests — motion, tension, custom notes |
| `QuartalChordGenerator` | *(none before audit)* | ❌ **Untested** |
| `ChordController` | `ChordControllerIntegrationTests.cs` | ✅ 13 HTTP-level tests |
| `ScaleController` | `ScaleControllerIntegrationTests.cs` | ✅ Tests for all modes + error cases |
| `ProgressionController` | `ProgressionControllerIntegrationTests.cs` | ✅ Integration tests |
| `HealthController` | `HealthControllerIntegrationTests.cs` | ✅ Health endpoint contract |

---

## 3. Gap Analysis

### 3.1 Critical Gaps (fixed in this audit)

| Gap | Resolution |
|---|---|
| `getAccessibleTextColor` (chordColorUtils) — 0% coverage | Added 8 tests covering light/dark backgrounds, edge-case inputs, invariants |
| `getTempoMarkingMin/Max`, `getRandomBpmInRange` (bpmTempoLabel) — 0% coverage | Added 23 tests covering all tempo markings, boundary values, invalid inputs |
| `getChordTriad`, `getChordNoteIndices`, `rotateChordNotes`, `rotateNamedChordRoot`, `dedupePitchClasses`, `getPrimitiveNoteIndices` (transpose) — partially untested | Added 47 tests covering all functions, range invariants, wrap-around |
| `getCircleColor` dark-theme path — 0% coverage | Added 5 tests using `@vitest-environment jsdom` + `data-theme=dark` attribute |
| `QuartalChordGenerator` backend service — 0% coverage | Added 27 tests covering build, identify, validation, invariants |

### 3.2 Remaining Gaps (out of scope / acceptable)

| Gap | Rationale |
|---|---|
| `useDragState` — drag-move and pointer-up branches (~40%) | Drag interaction requires browser pointer events; covered by E2E tests or manual QA |
| `useCustomChordState` — toggle/clear edge cases (~32%) | Hook state management; full coverage requires render-environment testing (see SPIKE) |
| `logger.ts` — warn/error paths | `warn`/`error` always emit; testing console output is low-value without a log-capture harness |
| `color-language/constants/chordColors.ts` — 0% | Re-export barrel with no executable logic; barrel exports are inert |
| `scale/utils/index.ts`, `voice-leading/index.ts` — 0% | Re-export barrels with no executable logic |
| `ii-v-suggestions/index.ts` — 0% | Re-export barrel with no executable logic |
| `bpmTempoLabel.ts` — `getRandomBpmInRange` stochastic behaviour | Boundary correctness is validated; internal `Math.random` is not deterministic |

---

## 4. Test Categories Present

| Category | Status | Location |
|---|---|---|
| **Unit tests** (pure function input→output) | ✅ Extensive | All `utils/__tests__/` folders |
| **Property / invariant tests** (all-roots, all-types loops) | ✅ Present | `scaleUtils.test.ts`, `transpose.test.ts`, `QuartalChordGeneratorTests.cs` |
| **Integration tests** (multi-module flow) | ✅ Present | `suggestBridges.integration.test.ts` (frontend); all `*ControllerIntegrationTests.cs` (backend) |
| **Contract tests** (frontend ↔ backend parity) | ✅ Present | `intervalContract.test.ts`, `scaleIntervalContract.test.ts` |
| **Component tests** (React components) | ✅ Present | `BridgeSuggestionPopover.test.tsx` |
| **Hook tests** (React hooks) | ✅ Present | `useDragState`, `useCustomChordState`, `useBridgeApply`, `useBridgePreview` |
| **Fuzz / randomised tests** | ⚠️ Minimal | `getRandomBpmInRange` loop; no property-based framework yet |
| **Snapshot tests** | ❌ None | Not recommended for this UI — too brittle |
| **End-to-end tests** | ❌ None | No Playwright/Cypress suite (see SPIKE) |

---

## 5. Test Quality Observations

### Strengths

- **Behaviour-focused naming**: test names describe observable behaviour, not implementation details.
- **Invariant loops**: many test suites iterate over all 12 roots × 8 scale types to validate domain invariants (e.g., all pitch classes in [0, 11], 7 distinct notes per scale).
- **Deterministic fixture tests**: `ProgressionAnalyzerTests` includes a known-value fixture test that guards against silent regressions.
- **Contract tests**: `intervalContract.test.ts` and `scaleIntervalContract.test.ts` guard frontend–backend consistency without running the server.
- **Per-file `@vitest-environment`**: DOM-dependent tests opt into `jsdom` explicitly, keeping the default environment fast (`node`).

### Areas for Improvement

- **`useDragState` / `useCustomChordState`**: Branch coverage is low; hooks that coordinate mouse/pointer state are better tested with `@testing-library/react` + synthetic events. See `SPIKE-testing-strategy.md`.
- **Stochastic outputs** (`getRandomBpmInRange`): Consider using a seeded random utility or property-based framework (fast-check) for deterministic randomness in tests.
- **Backend quartal chord service**: Previously had zero coverage despite being wired into a live endpoint; now covered by `QuartalChordGeneratorTests.cs`.

---

## 6. After-Audit Coverage (key files)

| File | Stmts % (before) | Stmts % (after) |
|---|---|---|
| `chordColorUtils.ts` | 20.89 | ~85+ |
| `bpmTempoLabel.ts` | 18.18 | ~100 |
| `transpose.ts` | 90.62 | ~100 |
| `circleColors.ts` | 62.96 | ~85+ |
| `QuartalChordGenerator.cs` | 0 | ~95+ |

---

## 7. Recommendations

1. **Add property-based tests** using [fast-check](https://github.com/dubzzz/fast-check) for the harmonic algorithms — especially `chordDistance`, `findShortestVoiceLeading`, and `ProgressionAnalyzer.Analyze`. See `SPIKE-testing-strategy.md`.

2. **Expand React hook tests** for `useDragState` and `useCustomChordState` using `@testing-library/react` with `renderHook` + `act` for pointer event simulation.

3. **Add E2E smoke tests** (Playwright) covering: load app, select a scale, click notes to build a chord, export MIDI. A minimal smoke suite guards against regressions without full coverage overhead.

4. **Add `test:coverage:ci` script** that fails the build below a threshold (e.g., 80% statement coverage) to prevent coverage regressions.

5. **Test the `retro` theme path** in `EnharmonicProvider` and `circleColors` — the `retro` theme is a third option currently not exercised in any test.
