# ISSUE-E8-01 — Implement `suggestBridges` Engine

**Epic:** Epic 8 — ii–V Bridge Suggestions  
**Priority:** High  
**Estimate:** 2–3 story points  
**Depends on:** —

---

## Summary

Create the `ii-v-suggestions` feature module: the core engine that generates, scores, deduplicates, and ranks ii–V bridge candidates between any two adjacent chords.

---

## Background

A ii–V bridge is a one-to-four-chord insertion between any two chords in the progression that creates directed harmonic motion toward the target chord. The algorithm is rule-based, deterministic, and completes in < 2 ms per pair. It reuses existing utilities — no new API call is required.

Spike document: `docs/spikes/SPIKE-ii-v-bridges.md`

---

## Files to Create

```
client/src/features/ii-v-suggestions/
├── index.ts
├── types/
│   └── index.ts
└── utils/
    ├── buildBridge.ts
    ├── scoreCandidate.ts
    ├── suggestBridges.ts
    └── __tests__/
        └── suggestBridges.test.ts
```

---

## Requirements

### `types/index.ts`

```typescript
import type { Chord } from "@/features/current-chord/types";

export type BridgeType =
  | "diatonic-ii-v"
  | "tritone-sub-ii-v"
  | "chromatic-ii-v"
  | "incomplete-ii"
  | "incomplete-v"
  | "tritone-sub"
  | "backchain-vi-ii-v"
  | "backchain-iii-vi-ii-v";

export interface BridgeSuggestion {
  /** Ordered list of chords to insert between source and target. */
  bridge: Chord[];
  /** Normalized score 0–1 (higher = more recommended). */
  score: number;
  /** Musical bridge type classification. */
  type: BridgeType;
  /**
   * Short human-readable label, e.g. "ii–V into G".
   * Uses root indices only — enharmonic resolution happens at render time.
   */
  label: string;
  /** Longer harmonic explanation, e.g. "Diatonic ii–V of G7; Am7 shares E with Dm7" */
  explanation: string;
}

export interface BridgeRequest {
  sourceChord: Chord;
  targetChord: Chord;
  insertAfterIndex: number;
  contextScale?: { root: number; mode: string } | null;
  maxBridgeLength?: number;
  topN?: number;
}
```

### `utils/buildBridge.ts`

Implement `buildDiatonicIIV(target: Chord)` and `generateCandidates(source, target, maxBridgeLength)`.

**`buildDiatonicIIV` rules:**
- `iiRoot = (target.root + 2) % 12`
- `VRoot = (target.root + 7) % 12`
- `iiQuality = "halfdim7"` when `target.quality` is `"minor"` or `"min7"`, otherwise `"min7"`
- `VQuality = "dom7"` always

**Candidate types generated:**
| Type | Length | Rule |
|---|---|---|
| `diatonic-ii-v` | 2 | `[ii, V]` from `buildDiatonicIIV` |
| `incomplete-v` | 1 | `[V]` only |
| `incomplete-ii` | 1 | `[ii]` only |
| `tritone-sub-ii-v` | 2 | `[ii, tritoneV]` where `tritoneRoot = (VRoot + 6) % 12` |
| `tritone-sub` | 1 | `[tritoneV]` only |
| `chromatic-ii-v` | 2 | `[chrII, chrV]` where roots are each 1 semitone below diatonic roots |
| `backchain-vi-ii-v` | 3 | `[vi, ii, V]` where `viRoot = (iiRoot + 9) % 12`, `viQuality = "min7"` |
| `backchain-iii-vi-ii-v` | 4 | `[III, vi, ii, V]` where `IIIRoot = (viRoot + 4) % 12`, `IIIQuality = "dom7"` |

Candidates of length > `maxBridgeLength` are not generated.

### `utils/scoreCandidate.ts`

Implement these helpers and the combined scorer. All reuse existing utilities:

| Helper | Existing utility |
|---|---|
| `voiceLeadingCost(from, to)` | `closeVoiceChord`, `minimalMotionVoicing` from `@/features/voice-leading` |
| `totalVoiceLeadingCost(source, bridge[], target)` | sums `voiceLeadingCost` across the full chain |
| `sharedNoteBonus(source, bridge[], target)` | `computeSharedNotes` from `@/features/progression-sidebar/utils/pairMetrics` |
| `diatonicBonus(bridge[], scale)` | `getDiatonicIndices` from `@/features/scale/utils` |
| `complexityPenalty(bridge[])` | `{ 1: 0, 2: 0.25, 3: 0.5, 4: 1.0 }[length]` |

**Combined scorer:**

```
raw = sharedNoteBonus * 0.30
    + diatonicBonus * 0.20
    - normalizeVL(totalVoiceLeadingCost) * 0.40
    - complexityPenalty * 0.10

score = clamp(raw / 0.50, 0, 1)
```

`normalizeVL(cost) = Math.min(cost / 24, 1)`

### `utils/suggestBridges.ts`

Top-level function signature:

```typescript
export function suggestBridges(
  source: Chord,
  target: Chord,
  scale: { root: number; mode: string } | null = null,
  maxBridgeLength = 2,
  topN = 3,
): BridgeSuggestion[]
```

Steps:
1. Return `[]` immediately if `source.root === target.root && source.quality === target.quality`.
2. Call `generateCandidates(source, target, maxBridgeLength)`.
3. Filter trivial candidates (bridge where first === source and last === target).
4. Score each candidate using `scoreCandidate`.
5. Deduplicate by chord root+quality sequence.
6. Sort descending by score; return top `topN` as `BridgeSuggestion[]`.

`label` and `explanation` fields on each suggestion: use root indices (e.g. `"ii–V into root 7"`). Enharmonic name resolution is deferred to ISSUE-E8-06.

---

## Tests (`__tests__/suggestBridges.test.ts`)

All test vectors are specified in the spike document §9. Required tests:

**`buildDiatonicIIV`:**
- `target = Cmaj7 (root=0)` → `{ iiRoot: 2, VRoot: 7, iiQuality: "min7", VQuality: "dom7" }`
- `target = Dm7 (root=2)` → `{ iiRoot: 4, VRoot: 9, iiQuality: "halfdim7", VQuality: "dom7" }`

**`suggestBridges`:**
- `Dm7 → G7` in C major: top suggestion is `type: "diatonic-ii-v"` with bridge `[Am7 (root=9), D7 (root=2)]`
- `G7 → Cmaj`: diatonic-ii-v candidate has bridge `[Dm7 (root=2), G7 (root=7)]`
- Returns ≤ `topN` suggestions
- Never returns a bridge where `first === source && last === target`
- Identical source and target returns `[]`

**Transposition invariance property test:**
- Transposing both chords by +5 semitones preserves relative ranking order

---

## Acceptance Criteria

- [ ] All types in `types/index.ts` are exported from `index.ts`
- [ ] `suggestBridges` is exported from `index.ts`
- [ ] All test vectors from §9 of the spike pass
- [ ] Transposition invariance property test passes
- [ ] `npm run lint` passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
- [ ] No new API calls — entirely frontend computation
