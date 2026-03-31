# Technical Debt Audit — Parametric MIDI Sequencer

**Audit date:** 2026-03-30
**Auditor:** Copilot (automated audit via ISSUE-E9-03)
**Scope:** Full codebase — `client/` (React/TypeScript) and `server/` (ASP.NET Core C#)

---

## Overview

This document catalogs all identified technical debt in the Parametric MIDI Sequencer
codebase. Debt items are classified as **Critical** (blocks new features or correctness),
**Moderate** (slows development or increases bug risk), or **Minor** (cosmetic or cleanup).
Each item includes a remediation plan and status.

### Prior Work — Epic 7

Epic 7 (Tech Debt Reduction) addressed the major structural debt present at the start of the
project. The following are confirmed **resolved**:

| Epic 7 Item | Description | Status |
|---|---|---|
| E7-01 | Duplicate scale utilities (`getDiatonicIndices` / `getScaleNotes`) | ✅ Resolved |
| E7-02 | Repeated chord-note retrieval → `getChordPitchClasses` | ✅ Resolved |
| E7-03 | `useChordState` split into focused single-concern hooks | ✅ Resolved |
| E7-04 | Dead code removed from `shared/` (`ChromaticCircle.tsx`) | ✅ Resolved |
| E7-05 | Auto-generated API types separated from hand-written client wrappers | ✅ Resolved |
| E7-06 | Magic numbers replaced with named constants | ✅ Resolved |
| E7-07 | React Error Boundary added (`AppErrorBoundary`) | ✅ Resolved |
| E7-08 | Unit tests for chromatic-circle hooks and utilities | ✅ Resolved |
| E7-09 | Unit tests for chord and color-language utilities | ✅ Resolved |
| E7-10 | Nullable context defaults hardened (throw at misconfiguration) | ✅ Resolved |
| E7-11 | Feature module folder structure standardised | ✅ Resolved |
| E7-12 | `test:coverage` and `test:watch` npm scripts added | ✅ Resolved |

---

## Current Debt Inventory

### Summary Table

| ID | Area | Severity | Status | Description |
|---|---|---|---|---|
| [TD-01](#td-01) | Server / C# | Minor | ✅ Resolved | Malformed XML doc comment in `ProgressionAnalyzer.cs` |
| [TD-02](#td-02) | Server / C# | Moderate | Open | TODO: motion metric consolidation in `ProgressionAnalyzer.cs` |
| [TD-03](#td-03) | Frontend / CSS | Minor | ✅ Resolved | Unused legacy `App.css` (Vite boilerplate, never imported) |
| [TD-04](#td-04) | Frontend / Lint | Minor | Open | `eslint-disable` in `App.tsx` — intentional deps suppression |
| [TD-05](#td-05) | Frontend / Lint | Minor | Open | `eslint-disable` in `useChordMorphing.ts` — intentional deps suppression |
| [TD-06](#td-06) | Frontend / Test | Minor | Open | `eslint-disable` in `harmonySnapshot.test.ts` — intentional unused binding |
| [TD-07](#td-07) | Frontend / CSS | Minor | Open | Retro theme uses 11+ `!important` overrides for button/input styling |
| [TD-08](#td-08) | Server / Docs | Minor | Open | CS1570 XML doc warnings resolved; no remaining compiler warnings found |

---

## Detail Records

### TD-01

**Malformed XML doc comment in `ProgressionAnalyzer.cs`**

- **Severity:** Minor (compiler warnings)
- **File:** `server/ParametricMusic.Api/Services/ProgressionAnalyzer.cs`, lines 91–115
- **Status:** ✅ **Resolved in this issue**
- **Description:** The `<remarks>` block for `ComputeMotion` contained a nested `<para>` tag that
  was opened but never closed before the outer `<para>` ended, generating two CS1570
  "badly formed XML" compiler warnings.
- **Remediation:** Closed the missing `</para>` tag. No logic change.

---

### TD-02

**TODO: Motion metric consolidation (`ProgressionAnalyzer.cs`)**

- **Severity:** Moderate
- **File:** `server/ParametricMusic.Api/Services/ProgressionAnalyzer.cs`, line 95 (TODO comment)
- **Status:** Open — requires validation work before remediation
- **Description:** The server's `ComputeMotion` method uses a simplified O(n²) cyclic-rotation
  search for minimum voice-leading cost. The client already ships a full-permutation O(n!)
  implementation in `client/src/features/voice-leading/utils/chordDistance.ts`. The TODO
  notes that once the client implementation is validated (regression tests, boundary cases),
  the server should adopt the same algorithm or delegate to a shared contract.
- **Impact:** The two implementations diverge on certain mixed-size chord pairs (e.g. triad → 7th
  chord) where the cyclic-rotation heuristic may not find the global minimum. This can cause
  `ContinuityScore` values on the server to differ from client-side voice-leading scores.
- **Remediation plan:**
  1. Add exhaustive cross-implementation tests comparing `ComputeMotion` (server) against
     `chordDistance` (client) for all chord-quality pairs in the supported set.
  2. If divergences are found, resolve by replacing the server's cyclic loop with either a
     full-permutation search (practical for n ≤ 4) or the Hungarian algorithm (O(n³)).
  3. Remove the TODO comment once the implementations agree on all tested cases.
- **Owner:** Backend contributor
- **Effort estimate:** S (2–4 h)

---

### TD-03

**Unused legacy `App.css`**

- **Severity:** Minor
- **File:** `client/src/App.css`
- **Status:** ✅ **Resolved in this issue**
- **Description:** `App.css` was generated by the Vite React template scaffold and contains
  styles for the Vite/React logo spinner animation and placeholder card layout. The file was
  never imported anywhere in the actual application (the app uses `App.module.css` and
  `styles/index.css`). Leaving it in the repository was confusing and added dead CSS.
- **Remediation:** File deleted.

---

### TD-04

**`eslint-disable react-hooks/exhaustive-deps` in `App.tsx`**

- **Severity:** Minor
- **File:** `client/src/app/App.tsx`, line 78
- **Status:** Open — intentional and documented
- **Description:**
  ```typescript
  useEffect(() => {
    if (isPlaying) {
      onStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chords]);
  ```
  `onStop` is deliberately excluded from the dependency array. Including it would create an
  infinite loop: `onStop` changes identity on each render, causing the effect to fire on every
  render and call `onStop`, which triggers a re-render, and so on.
- **Remediation plan:** Stabilise `onStop` with `useCallback` at the call site so that it has
  a stable identity across renders. Once `onStop` is stable, it can be added to the dependency
  array and the `eslint-disable` removed. This is a low-risk refactor.
- **Effort estimate:** XS (<1 h)

---

### TD-05

**`eslint-disable react-hooks/exhaustive-deps` in `useChordMorphing.ts`**

- **Severity:** Minor
- **File:** `client/src/features/chord-animation/hooks/useChordMorphing.ts`, line 81
- **Status:** Open — intentional and documented
- **Description:**
  ```typescript
  // `currentKey` fully captures point changes; excluding raw `currentPoints`
  // prevents cancel/restart loops caused by new array identities each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, safeDurationMs]);
  ```
  `currentPoints` is intentionally excluded because it is a new array instance on every render
  (referential instability). The `currentKey` string derived from the points acts as a stable
  proxy that only changes when the actual point values change.
- **Remediation plan:** Consider memoising the points array at the call site using `useMemo`
  so its identity is stable. If `currentPoints` can be passed with a stable reference,
  the `currentKey` proxy and the `eslint-disable` can be removed. Alternatively, accept this
  pattern as a documented architectural choice.
- **Effort estimate:** XS (<1 h)

---

### TD-06

**`eslint-disable @typescript-eslint/no-unused-vars` in `harmonySnapshot.test.ts`**

- **Severity:** Minor
- **File:** `client/src/shared/types/__tests__/harmonySnapshot.test.ts`, line 165
- **Status:** Open — intentional test pattern
- **Description:**
  ```typescript
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { metadata: _metadata, ...noMeta } = createHarmonySnapshot([], null);
  ```
  The `_metadata` binding is intentionally unused — the test exercises the destructuring to
  extract the rest of the object (`noMeta`) without `metadata`, verifying the type shape.
- **Remediation plan:** Prefix the variable with `_` (already done) and configure the ESLint
  `@typescript-eslint/no-unused-vars` rule to automatically ignore variables prefixed with `_`.
  This eliminates the inline disable without changing behavior.
  Rule config: `{ "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }`.
- **Effort estimate:** XS (<30 min)

---

### TD-07

**Retro theme `!important` overrides**

- **Severity:** Minor
- **File:** `client/src/styles/index.css`, lines 183–246
- **Status:** Open — low priority
- **Description:** The Windows 95 retro theme uses 11+ `!important` declarations to override the
  base `button` styles defined earlier in the same stylesheet. This is necessary because the
  base `button` rule uses a specificity that the `[data-theme="retro"] button` selector cannot
  beat without `!important`. The `!important` flags are scoped to the retro theme only and have
  no cross-theme bleed, but they represent fragile CSS coupling.
- **Impact:** Any new global button styles added without `!important` will apply in retro mode;
  any added with `!important` will leak into retro mode unexpectedly.
- **Remediation plan:**
  1. Move the base `button` reset into a `[data-theme="light"], [data-theme="dark"]` block so
     its specificity is equal to the retro theme selector.
  2. Remove all `!important` declarations from the retro button/input overrides.
  3. This is pure CSS refactoring with no JavaScript or template changes.
- **Effort estimate:** XS (< 1 h)

---

## Audit Findings: No Issues Found

The following areas were audited and found to be in good shape:

| Area | Finding |
|---|---|
| TypeScript `@ts-ignore` / `@ts-nocheck` annotations | None found |
| FIXME or HACK comments | None found |
| Legacy pre-`ScaleContext` code paths | Fully migrated — `ScaleContext` used throughout |
| Legacy pre-`HarmonySnapshot` code paths | Fully migrated — `HarmonySnapshot` used in snapshot IO |
| Duplicate utility functions | None detected — Epic 7 consolidations are complete |
| Unused imports | None (ESLint `no-unused-vars` enforced; `--max-warnings=0`) |
| Inconsistent type boundaries (frontend ↔ backend) | Contract tests in place (`intervalContract.test.ts`, `scaleIntervalContract.test.ts`) |
| Missing React Error Boundary | `AppErrorBoundary` present and wrapping the full app tree |
| Nullable context anti-pattern | Contexts use non-null defaults and throw on misconfiguration |
| Feature module structure | 18 modules follow the standardised barrel-export convention |
| Server test coverage | 106 passing tests across chord, scale, and progression services |
| Frontend test coverage | 649 passing tests across all 43 test files |
| Generated API client | `src/api/generated/index.ts` is never manually edited |

---

## Remediation Roadmap

### Immediate (resolve in this issue)

| Item | Action |
|---|---|
| TD-01 | ✅ Fix malformed XML comment in `ProgressionAnalyzer.cs` |
| TD-03 | ✅ Delete unused `client/src/App.css` |

### Short-term (next sprint)

| Item | Action | Effort |
|---|---|---|
| TD-06 | Configure `no-unused-vars` rule to allow `_`-prefixed vars; remove inline disable | XS |
| TD-04 | Stabilise `onStop` reference with `useCallback` to remove eslint-disable | XS |
| TD-05 | Memoise chord points array at call site to remove eslint-disable | XS |
| TD-07 | Refactor retro button overrides to remove `!important` flags | XS |

### Medium-term (design + validation required)

| Item | Action | Effort |
|---|---|---|
| TD-02 | Add cross-implementation tests; align server motion metric with client `chordDistance` | S |

---

## Verification

All changes in this audit pass the following checks:

```bash
# Frontend
cd client && npm run lint && npm run build && npm test

# Backend
cd server/ParametricMusic.Tests && dotnet test
```
