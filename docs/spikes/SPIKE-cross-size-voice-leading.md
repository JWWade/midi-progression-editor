# SPIKE: Cross-Size Voice-Leading (Flexible Chord Distance)

**Date:** 2026-03-30  
**Status:** Proposed  
**Author:** Copilot (codebase-grounded rewrite)

---

## 1. Executive Summary

**Verdict: Feasible with low-to-moderate effort by adding one new distance/matching pair and wiring it through existing `weightFn` hooks.**

This codebase already has most of the extension points needed:

- `buildChordGraph` already supports `sizes`, `maxWeight`, and `weightFn`.
- `findShortestVoiceLeading` already supports a custom `weightFn` when it builds a graph internally.
- Cross-size nodes already exist when `sizes: [3, 4]` is used.

What is missing is a distance function that returns finite values for unequal chord sizes. Today, default `chordDistance` returns `Infinity` for unequal sizes, so cross-size edges are absent even in mixed-size graphs.

---

## 2. Critique Of The Original Draft

The original draft is strong conceptually, but several parts do not align with current implementation details.

1. `allowCrossSize` on `buildChordGraph` is redundant in this codebase.
   - Cross-size edge inclusion is already controlled by `weightFn` returning finite values.
   - If `weightFn(a, b)` is finite across sizes, edges are created automatically.

2. `findShortestVoiceLeading` does not currently accept graph-construction options like `sizes`.
   - If no graph is provided, it calls `buildChordGraph` with only `maxWeight` and `weightFn`.
   - This means default internal graph build is triad-only (`sizes: [3]`).

3. Empty-input behavior in the draft conflicts with current metric behavior.
   - `chordDistance([], [])` currently returns `0`.
   - `findShortestVoiceLeading([], x)` throws because canonicalization rejects empty input.
   - A new flexible function should define this explicitly and match existing conventions where practical.

4. UI scope is optimistic.
   - There is no dedicated harmonic-graph UI surface in the current feature layout.
   - The spike should define API/store wiring points first, then UI as follow-up.

---

## 3. Goal

Add a **flexible, complexity-aware voice-leading distance** for unequal chord sizes and integrate it with existing graph/pathfinding hooks.

New function family:

- `chordDistanceFlexible(a, b, options?)`
- `chordMatchingFlexible(a, b, options?)`

Primary effect:

- Enables finite cross-size edge weights in `buildChordGraph({ sizes: [3,4], weightFn })`.
- Enables triad <-> seventh shortest paths when graph and weight function are configured accordingly.

---

## 4. Scope

### In Scope

- New distance: `chordDistanceFlexible`
- New mapping variant: `chordMatchingFlexible`
- Brute-force subset + permutation matching for small chord sizes (3 and 4)
- Integration via existing `weightFn` hooks
- Tests for flexible distance, graph edges, and shortest paths
- Optional small API expansion for `findShortestVoiceLeading` auto-built graph options

### Out Of Scope

- Replacing strict `chordDistance`
- Hungarian algorithm or advanced optimization
- Backend parity implementation in this spike
- Full production UI controls in this spike

---

## 5. Existing Codebase Baseline

Relevant current behavior:

- `chordDistance(a, b)` returns `Infinity` when `a.length !== b.length`.
- `buildChordGraph` adds edges when `isFinite(weight) && weight <= maxWeight`.
- `buildChordGraph({ sizes: [3,4] })` already creates mixed-size node sets.
- Existing tests explicitly assert that cross-size edges are absent under default `chordDistance`.

Implication:

- No graph structural rewrite is required.
- The key change is introducing a finite cross-size weight function and using it intentionally.

---

## 6. Proposed Metric

Let:

- `m = |a|`, `n = |b|`, `k = min(m, n)`
- `penalty >= 0`

Define:

$$
 d_{flex}(a,b) = \min_{matching\ of\ k\ voices}\sum_{i=1}^{k} d_{pc}(a_i,b_{\sigma(i)}) + penalty \cdot |m-n|
$$

Where:

$$
 d_{pc}(x,y)=\min(|x-y|, 12-|x-y|)
$$

### Option Type

```ts
type FlexibleOptions = {
  penalty?: number; // default: 2
};
```

### API

```ts
function chordDistanceFlexible(
  a: number[],
  b: number[],
  options?: FlexibleOptions,
): number;

function chordMatchingFlexible(
  a: number[],
  b: number[],
  options?: FlexibleOptions,
): {
  distance: number;
  mapping: { fromIdx: number; toIdx: number }[];
};
```

Notes:

- `mapping` contains only matched pairs.
- Unmatched voices are represented only through penalty.

---

## 7. Integration Plan

### 7.1 Voice-Leading Module

File targets:

- `client/src/features/voice-leading/utils/chordDistance.ts`
- `client/src/features/voice-leading/index.ts`

Plan:

1. Add helper(s) for combinations and restricted permutations locally.
2. Add `chordDistanceFlexible` and `chordMatchingFlexible`.
3. Preserve strict `chordDistance` and `chordMatching` behavior unchanged.
4. Export the new functions from `voice-leading/index.ts`.

### 7.2 Harmonic Graph

No required signature change in `buildChordGraph`.

Use existing options:

```ts
const penalty = 2;
const flexWeight: WeightFn = (a, b) => chordDistanceFlexible(a, b, { penalty });

const graph = buildChordGraph({
  sizes: [3, 4],
  weightFn: flexWeight,
});
```

This should naturally create cross-size edges because finite weights are now returned.

### 7.3 Pathfinding

Current pathfinding already supports `weightFn`, but graph auto-build uses default `sizes: [3]`.

Two viable paths:

1. Preferred near-term: pre-build graph and pass it in.
2. Optional API extension: add `graphOptions?: Pick<BuildChordGraphOptions, "sizes" | "canonicalization" | "maxWeight">` to `FindShortestVoiceLeadingOptions` and forward to `buildChordGraph` when `graph` is omitted.

---

## 8. UI / Product Wiring (Incremental)

There is no dedicated harmonic-graph UI module currently, so wire in stages.

1. Add a lightweight state value for `complexityCost` (default `2`).
2. Use this value to build `flexWeight` for graph and path calls.
3. Expose control only where harmonic path exploration already surfaces, or defer UI to a follow-up issue.

Suggested label:

- "Complexity Cost"

Interpretation:

- Low value: favors adding/removing notes.
- High value: discourages size changes.

---

## 9. Test Plan

### 9.1 New Unit Tests (`voice-leading`)

- Same-size parity:
  - `chordDistanceFlexible([0,4,7], [0,3,7]) === chordDistance([0,4,7], [0,3,7])`
- Cross-size no-motion:
  - `d([0,4,7], [0,4,7,11]) === penalty`
- Cross-size with motion:
  - `d([0,4,7], [0,3,7,10]) === 1 + penalty`
- Symmetry:
  - `d(a,b) === d(b,a)`
- Mapping integrity:
  - mapping length is `min(m,n)`
  - mapping indices are unique on both sides

### 9.2 Graph Tests (`harmonic-graph`)

- With default `chordDistance`, mixed-size graph has no cross-size edges (existing behavior, keep).
- With flexible weight function, mixed-size graph includes at least one cross-size edge.
- `maxWeight` still prunes edges as expected.

### 9.3 Path Tests (`harmonic-graph`)

- Given mixed-size graph + flexible weight, triad -> seventh can return non-null path.
- Given strict graph/weight, same query remains null.
- Penalty sensitivity:
  - larger penalty should not reduce triad->seventh direct cost.

---

## 10. Acceptance Criteria

- [ ] `chordDistanceFlexible` and `chordMatchingFlexible` implemented and exported.
- [ ] Existing strict distance behavior unchanged.
- [ ] Mixed-size graph with flexible `weightFn` creates finite cross-size edges.
- [ ] Shortest-path queries can traverse cross-size edges when graph/weights allow.
- [ ] Tests added for metric, graph, and path behavior.
- [ ] Documentation includes how penalty affects exploration.

---

## 11. Risks And Mitigations

1. Risk: Combinatorial blow-up if larger chord sizes are added later.
   - Mitigation: keep scope to sizes 3 and 4; document complexity assumptions.

2. Risk: User confusion between strict and flexible metrics.
   - Mitigation: keep strict default; explicit naming and clear UI label.

3. Risk: Inconsistent behavior if graph is auto-built without sizes `[3,4]`.
   - Mitigation: document required call pattern and consider optional `graphOptions` extension.

---

## 12. Recommended Implementation Order

1. Add flexible distance/matching in `voice-leading`.
2. Add unit tests for flexible metric.
3. Add graph tests using `weightFn: chordDistanceFlexible`.
4. Add path tests for triad <-> seventh traversal.
5. Optionally extend `findShortestVoiceLeading` options for graph build sizes.
6. Add minimal UI control in follow-up.

---

## 13. Why This Matters

This change adds a controllable bridge between chord-cardinality layers without breaking existing strict behavior. It improves harmonic exploration while preserving backward compatibility and existing API shape.
