# SPIKE — Testing Strategy Deep Dive

> **Status:** Open  
> **Created:** 2026-03-30  
> **Related issue:** ISSUE-E9-10  

---

## Motivation

Several areas of the codebase have structural characteristics that make them difficult to test with the current pure unit-test approach. This SPIKE documents those areas, outlines investigation goals, and proposes concrete experiments to validate testing strategies before committing to an implementation.

---

## Area 1 — Property-Based Testing for Harmonic Algorithms

### Problem

The harmonic core (`chordDistance`, `findShortestVoiceLeading`, `ProgressionAnalyzer.Analyze`, `transposeChord`) contains mathematical invariants that should hold for *all valid inputs*, not just a handful of hand-chosen examples. Current tests exercise specific pitch-class sets (C major, G major, A minor, …) but do not systematically prove the invariants hold universally.

### Key Invariants to Validate

| Invariant | Description |
|---|---|
| `chordDistance(a, b) >= 0` | Distance is non-negative |
| `chordDistance(a, a) == 0` | Distance from a chord to itself is zero |
| `chordDistance(a, b) == chordDistance(b, a)` | Symmetry |
| All returned pitch classes are in [0, 11] | No out-of-range notes |
| `getScaleNotes` always returns 7 distinct pitches | Scale has exactly 7 degrees |
| `transposeChord(intervals, root)[i].index in [0..11]` | Transposition wraps correctly |
| `ProgressionAnalyzer.ContinuityScore in [0..1]` | Score is bounded |
| `TensionTrend[i] in [0..1]` | Tension is bounded |

### Investigation Goals

1. Evaluate [fast-check](https://github.com/dubzzz/fast-check) (TypeScript) and [FsCheck](https://github.com/fscheck/FsCheck) (C# / xUnit) as property-based test frameworks.
2. Prototype a property test for `chordDistance` symmetry in TypeScript.
3. Prototype a property test for `ProgressionAnalyzer.ContinuityScore` bounds in C#.
4. Measure test execution overhead (property tests can be slow with many shrink iterations).

### Proposed Experiment

```typescript
// TypeScript — fast-check prototype
import * as fc from "fast-check";
import { chordDistance } from "@/features/voice-leading/utils/chordDistance";
import { canonicalizeChord } from "@/features/voice-leading/utils/canonicalizeChord";

const pitchClassSet = fc.uniqueArray(fc.integer({ min: 0, max: 11 }), { minLength: 2, maxLength: 7 });

describe("chordDistance invariants (property-based)", () => {
  it("is non-negative for any two pitch-class sets", () => {
    fc.assert(fc.property(pitchClassSet, pitchClassSet, (a, b) => {
      const ca = canonicalizeChord(a, "T").pcs;
      const cb = canonicalizeChord(b, "T").pcs;
      expect(chordDistance(ca, cb)).toBeGreaterThanOrEqual(0);
    }));
  });

  it("is symmetric", () => {
    fc.assert(fc.property(pitchClassSet, pitchClassSet, (a, b) => {
      const ca = canonicalizeChord(a, "T").pcs;
      const cb = canonicalizeChord(b, "T").pcs;
      expect(chordDistance(ca, cb)).toBe(chordDistance(cb, ca));
    }));
  });
});
```

### Decision Criteria

- ✅ Adopt fast-check if: overhead < 500 ms per suite, shrink output is readable, integration with Vitest is seamless.
- ⚠️ Defer if: property tests duplicate existing invariant loops without new failure modes.

---

## Area 2 — React Hook Testing for Interaction State

### Problem

`useDragState` and `useCustomChordState` manage pointer/mouse interaction state for the chromatic circle. Branch coverage is 18–46% because the drag-start, drag-move, and pointer-up code paths require browser pointer events. These hooks are not easily tested with pure function calls.

### Key Scenarios to Cover

- Drag starts at a note node → `isDragging=true`, `dragStartIndex` set
- Pointer moves to a different note → `dragTargetIndex` updates
- Pointer up / leave → state resets to idle
- Note click (no drag) → chord note selected / deselected
- Toggle: selecting an already-selected note removes it
- Clear: `clearCustomChord` resets the full selection

### Investigation Goals

1. Evaluate `@testing-library/react`'s `renderHook` + `act` for simulating pointer events on hooks.
2. Determine whether `fireEvent.pointerDown/pointerMove/pointerUp` is sufficient or if `userEvent.pointer` from `@testing-library/user-event` is needed.
3. Assess whether the hooks need to be restructured (e.g., separating event handlers from state logic) to improve testability.

### Proposed Experiment

```typescript
// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { useDragState } from "../useDragState";

it("sets isDragging=true when pointerDown fires on a note index", () => {
  const { result } = renderHook(() => useDragState());
  act(() => {
    result.current.handlers.onPointerDown({ noteIndex: 3 });
  });
  expect(result.current.isDragging).toBe(true);
  expect(result.current.dragStartIndex).toBe(3);
});
```

### Decision Criteria

- ✅ Adopt `@testing-library/react` renderHook approach if hooks can be invoked without a full component tree.
- ⚠️ Defer to integration/E2E if hooks are tightly coupled to the SVG DOM structure.

---

## Area 3 — End-to-End Smoke Tests

### Problem

There is no E2E test suite. Core user flows (load app → select scale → click notes → build chord → export MIDI) are validated only manually. A minimal smoke suite would catch regressions that unit tests cannot — especially rendering, routing, and API integration issues.

### Key Flows to Smoke-Test

1. App loads without JavaScript errors.
2. Scale selector renders all 8 modes; selecting a mode updates the chromatic circle.
3. Clicking a note on the chromatic circle highlights it as the chord root.
4. Selecting 3 notes forms a triad and displays chord info.
5. Adding chord to progression sidebar succeeds (max 8 chords).
6. MIDI export triggers a file download.
7. Health endpoint returns `{ status: "ok" }`.

### Investigation Goals

1. Evaluate Playwright (preferred) vs Cypress for E2E test runner.
2. Determine whether the backend must be running, or if the frontend can be tested in isolation with MSW (Mock Service Worker).
3. Prototype a single Playwright smoke test covering flows 1 and 7.

### Proposed Experiment

```typescript
// playwright/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("app loads without errors", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await expect(page.locator("h1, [data-testid=app-title]")).toBeVisible();
});

test("health endpoint is available", async ({ request }) => {
  const response = await request.get("http://localhost:5110/health");
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.status).toBe("ok");
});
```

### Decision Criteria

- ✅ Adopt Playwright if: setup takes < 1 day, tests run reliably in CI, flakiness is manageable.
- ⚠️ Defer if: requires significant infrastructure changes (Docker, wait-for-server scripts).

---

## Area 4 — Stochastic / Randomised Output Testing

### Problem

`getRandomBpmInRange` and any future randomised chord selection utilities (e.g., `selectRandomDiatonicStartupChord`) produce non-deterministic output. Current tests loop 10–20 times to probabilistically validate bounds, but this is not mathematically rigorous.

### Options

| Approach | Pros | Cons |
|---|---|---|
| Loop N times | Simple, no new dependencies | Can miss tail-case failures |
| Seed `Math.random` via `vi.spyOn` | Deterministic | Tightly coupled to implementation |
| Property-based (fast-check) with bounded range | Rigorous | Requires fast-check adoption |
| Statistical bounds test (Chi-squared) | Mathematically sound | Complex to write and interpret |

### Recommendation

For simple bounded-range functions like `getRandomBpmInRange`, the current loop-and-assert pattern is acceptable. For more complex stochastic generators, prefer fast-check (see Area 1) over manual loops.

---

## Area 5 — Backend QuartalChordGenerator Integration

### Problem

The `QuartalChordGenerator` was untested despite being wired into a live HTTP endpoint. This has been addressed in this audit. However, no HTTP-level integration test exists for the quartal endpoint.

### Investigation Goals

1. Add `QuartalControllerIntegrationTests.cs` covering:
   - `GET /Chord/quartal/diatonic?root=C&scaleType=Major&degree=1` → 200 with expected pitch classes
   - Invalid degree (0 or 8) → 400 with ProblemDetails
   - Invalid scaleType → 400 with ProblemDetails

### Decision Criteria

- ✅ Add immediately — this follows the same pattern as existing controller integration tests and closes a gap in HTTP contract coverage.

---

## Summary and Priority

| Area | Priority | Effort | Recommendation |
|---|---|---|---|
| Property-based tests (fast-check) | High | Medium | Prototype in next sprint |
| React hook tests (`useDragState`, `useCustomChordState`) | High | Medium | Restructure hooks + add tests |
| Quartal endpoint integration test | Medium | Low | Add alongside service tests |
| E2E smoke suite (Playwright) | Medium | High | Spike before committing |
| Stochastic output testing | Low | Low | Adopt fast-check for consistency |
