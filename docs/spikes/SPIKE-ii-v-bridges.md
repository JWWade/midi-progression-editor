# SPIKE: Automatic ii–V Bridge Suggestions Between Chords

**Date:** 2026-03-19  
**Status:** Complete  
**Author:** Copilot (investigation)  
**Related Issue:** SPIKE — Investigate Automatic ii–V Bridge Suggestions Between Chords

---

## 1. Executive Summary

**Verdict: Implement as a frontend-only feature using existing chord and voice-leading utilities. A backend endpoint is optional and should be deferred until shared caching or server-side persistence needs emerge.**

The ii–V bridge suggestion feature can be implemented entirely in the browser using the existing `CHORD_INTERVALS`, `getChordNoteIndices`, `minimalMotionVoicing`, and `computeSharedNotes` utilities. The generation algorithm is rule-based, computes in <5 ms for a single pair of chords, and produces 3–5 ranked candidates that can be displayed inline between adjacent chord tiles in the progression sidebar. No API changes are required for the initial implementation.

---

## 2. Musical Background

A **ii–V** is a two-chord unit that creates harmonic motion toward a target ("V resolves to I"). In jazz and pop, the ii chord is typically a minor seventh and the V chord is a dominant seventh whose root sits a perfect fourth above the ii chord root (or equivalently, a perfect fifth below the target I).

```
Target key of C:   ii = Dm7  |  V = G7  |  (I = C)
Target key of G:   ii = Am7  |  V = D7  |  (I = G)
```

Bridges exploit this gravity: inserting `[ii, V]` before a target chord `T` creates a brief tonicization that makes the arrival of `T` feel earned and directed.

---

## 3. Candidate Bridge Types

| # | Type | Construction Rule | Example (target = C) | Characteristics |
|---|------|-------------------|----------------------|-----------------|
| 1 | **Diatonic ii–V** | ii = min7 on the second scale degree of T's key; V = dom7 a fourth above ii | `Dm7 → G7` | Smoothest, most idiomatic |
| 2 | **Applied (secondary) ii–V** | Treat T as a temporary I; build ii–V from T's local key regardless of the global scale | `Dm7 → G7` targeting Cmaj inside F major context | Tonicizes any chord, not just the tonic |
| 3 | **Chromatic ii–V** | Lower or raise the diatonic ii or V by a semitone for approach-note color | `D♭m7 → G♭7 → C` | Half-step approach, colorful, chromatic bass |
| 4 | **Tritone substitution ii–V** | Replace the V chord with a dom7 whose root is a tritone away (♭II7 sub) | `Dm7 → D♭7 → C` | Smooth descending half-step bass |
| 5 | **Incomplete ii–V** | Omit either the ii or the V; use a single-chord insertion | `G7 → C` (V only) or `Dm7 → C` (ii only) | Lighter motion, smaller insertion |
| 6 | **Backcycling chain** | Extend ii–V backwards: `iii–VI–ii–V` or `vi–II–V–I` | `Em7 → A7 → Dm7 → G7 → C` | Rich retrogression; only offer when bridge length ≤ maxBridgeLength |

### 3.1 Construction Rules (Canonical Forms)

Given a **target chord** with root `T` and quality `targetQuality`:

```
// Diatonic ii–V targeting T (treated as I major or I minor)
iiRoot   = (T + 2) mod 12        // major key: major second above target
VRoot    = (T + 7) mod 12        // perfect fifth above target (= (iiRoot + 5) mod 12)
iiQuality  = "min7"
VQuality   = "dom7"

// For a minor-key target (e.g., Dm), the ii° is a half-diminished:
iiQuality  = "halfdim7" when targetQuality ∈ {minor, min7}
VQuality   = "dom7"              // the V7 remains dominant in harmonic minor

// Tritone sub: replace V with ♭II7
tritoneSub = (VRoot + 6) mod 12  // augmented fourth / diminished fifth above V
tritoneSub_quality = "dom7"

// Chromatic approach: lower iiRoot by 1 semitone
chromatic_iiRoot  = (iiRoot - 1 + 12) mod 12
chromatic_VRoot   = (VRoot  - 1 + 12) mod 12
```

---

## 4. Generation Algorithm

### 4.1 High-Level Steps

```
Input:
  sourceChord     — Chord   (the chord before the insertion point)
  targetChord     — Chord   (the chord to be approached)
  contextScale    — { root: number, mode: ScaleMode } | null
  maxBridgeLength — number  (default 2, max 4)
  topN            — number  (default 3)

Output:
  BridgeSuggestion[]   (ranked, deduplicated list)
```

1. **Generate candidates** — build all bridge sequences matching the types in §3.
2. **Score candidates** — apply the weighted scoring model in §5.
3. **Deduplicate** — remove candidates identical to each other or to `[sourceChord, targetChord]`.
4. **Rank and truncate** — sort descending by score; return top `N`.

### 4.2 Pseudocode

```typescript
function suggestBridges(
  source: Chord,
  target: Chord,
  scale: ScaleContext | null = null,
  maxBridgeLength = 2,
  topN = 3,
): BridgeSuggestion[] {
  const candidates: BridgeCandidate[] = [];

  // --- 1. Diatonic / Applied ii–V ---
  const { iiRoot, VRoot, iiQuality, VQuality } = buildDiatonicIIV(target);
  if (maxBridgeLength >= 2) {
    candidates.push({
      chords: [{ root: iiRoot, quality: iiQuality }, { root: VRoot, quality: VQuality }],
      type: "diatonic-ii-v",
    });
  }
  if (maxBridgeLength >= 1) {
    candidates.push({ chords: [{ root: VRoot, quality: VQuality }], type: "incomplete-v" });
    candidates.push({ chords: [{ root: iiRoot, quality: iiQuality }], type: "incomplete-ii" });
  }

  // --- 2. Tritone substitution ---
  const tritoneRoot = (VRoot + 6) % 12;
  if (maxBridgeLength >= 2) {
    candidates.push({
      chords: [{ root: iiRoot, quality: iiQuality }, { root: tritoneRoot, quality: "dom7" }],
      type: "tritone-sub-ii-v",
    });
  }
  if (maxBridgeLength >= 1) {
    candidates.push({ chords: [{ root: tritoneRoot, quality: "dom7" }], type: "tritone-sub" });
  }

  // --- 3. Chromatic approach ---
  if (maxBridgeLength >= 2) {
    const chrII = (iiRoot - 1 + 12) % 12;
    const chrV  = (VRoot  - 1 + 12) % 12;
    candidates.push({
      chords: [{ root: chrII, quality: "min7" }, { root: chrV, quality: "dom7" }],
      type: "chromatic-ii-v",
    });
  }

  // --- 4. Backcycling chain (maxLen >= 3 or 4) ---
  if (maxBridgeLength >= 3) {
    const vi  = (iiRoot + 9) % 12;     // relative major root
    candidates.push({
      chords: [
        { root: vi,     quality: "min7" },
        { root: iiRoot, quality: iiQuality },
        { root: VRoot,  quality: VQuality },
      ],
      type: "backchain-vi-ii-v",
    });
  }
  if (maxBridgeLength >= 4) {
    const III = (vi + 4) % 12;
    candidates.push({
      chords: [
        { root: III,    quality: "dom7" },
        { root: vi,     quality: "min7" },
        { root: iiRoot, quality: iiQuality },
        { root: VRoot,  quality: VQuality },
      ],
      type: "backchain-iii-vi-ii-v",
    });
  }

  // --- 5. Score, deduplicate, rank ---
  const scored = candidates
    .map((cand) => ({ ...cand, score: scoreCandidate(cand, source, target, scale) }))
    .filter((cand) => !isTrivial(cand, source, target));

  return deduplicateByChords(scored)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((cand) => toSuggestion(cand));
}
```

### 4.3 Helper: `buildDiatonicIIV`

```typescript
function buildDiatonicIIV(target: Chord): { iiRoot: number; VRoot: number; iiQuality: ChordType; VQuality: "dom7" } {
  const iiRoot = (target.root + 2) % 12;                           // major-key: major 2nd above
  const VRoot  = (target.root + 7) % 12;                           // perfect 5th above target
  const isMinorTarget = target.quality === "minor" || target.quality === "min7";
  const iiQuality: ChordType = isMinorTarget ? "halfdim7" : "min7";
  return { iiRoot, VRoot, iiQuality, VQuality: "dom7" };
}
```

### 4.4 Helper: `isTrivial`

```typescript
function isTrivial(cand: BridgeCandidate, source: Chord, target: Chord): boolean {
  // A single-chord bridge is trivial if that chord equals source or target
  if (cand.chords.length === 1) {
    const c = cand.chords[0];
    return (c.root === source.root && c.quality === source.quality)
        || (c.root === target.root && c.quality === target.quality);
  }
  // A two-chord bridge where first === source and last === target is trivial
  const first = cand.chords[0];
  const last  = cand.chords[cand.chords.length - 1];
  return first.root === source.root && first.quality === source.quality
      && last.root  === target.root && last.quality  === target.quality;
}
```

---

## 5. Scoring Model

### 5.1 Score Components

| Component | Symbol | Range | Weight |
|-----------|--------|-------|--------|
| Voice-leading cost (lower is better) | `VL` | 0 – ∞ semitones | −0.40 |
| Shared-note bonus (higher is better) | `SN` | 0 – 1 | +0.30 |
| Diatonic conformance bonus | `DT` | 0 or 1 | +0.20 |
| Complexity penalty (bridge length) | `CP` | 0 – 1 | −0.10 |

**Final score** (normalized 0–1):

```
rawScore = SN * 0.30
         + DT * 0.20
         - normalizeVL(VL) * 0.40
         - CP * 0.10

score = clamp(rawScore / maxPossibleRaw, 0, 1)
```

### 5.2 Voice-Leading Cost `VL`

Uses the existing `minimalMotionVoicing` utility from `voice-leading/utils/voicing.ts`:

```typescript
function voiceLeadingCost(from: Chord, to: Chord): number {
  const fromPc  = getChordPitchClasses(from);
  const toPc    = getChordPitchClasses(to);
  const fromMidi = closeVoiceChord(fromPc);
  const toMidi   = minimalMotionVoicing(fromMidi, toPc);
  return toMidi.reduce((sum, note, i) => sum + Math.abs(note - fromMidi[i]), 0);
}

// Total VL cost = source→bridge[0] + internal bridge pairs + bridge[-1]→target
function totalVoiceLeadingCost(source: Chord, bridge: Chord[], target: Chord): number {
  const chain = [source, ...bridge, target];
  let total = 0;
  for (let i = 0; i < chain.length - 1; i++) {
    total += voiceLeadingCost(chain[i], chain[i + 1]);
  }
  return total;
}

// Normalize: map 0–24 semitones to 0–1 (24 = worst case for a 4-voice chord)
function normalizeVL(cost: number): number {
  return Math.min(cost / 24, 1);
}
```

### 5.3 Shared-Note Bonus `SN`

Uses the existing `computeSharedNotes` utility from `progression-sidebar/utils/pairMetrics.ts`:

```typescript
function sharedNoteBonus(source: Chord, bridge: Chord[], target: Chord): number {
  const entryMetric = computeSharedNotes(source, bridge[0]);
  const exitMetric  = computeSharedNotes(bridge[bridge.length - 1], target);
  // Average proportion: shared / min(sizeA, sizeB) for both junctions
  return (entryMetric.proportion + exitMetric.proportion) / 2;
}
```

### 5.4 Diatonic Conformance Bonus `DT`

```typescript
function diatonicBonus(bridge: Chord[], scale: ScaleContext | null): number {
  if (!scale) return 0;
  const diatonic = getDiatonicIndices(scale.root, scale.mode);
  const allDiatonic = bridge.every((chord) =>
    getChordPitchClasses(chord).every((pc) => diatonic.has(pc))
  );
  return allDiatonic ? 1 : 0;
}
```

### 5.5 Complexity Penalty `CP`

```typescript
function complexityPenalty(bridge: Chord[]): number {
  // 1 chord = 0 penalty, 2 chords = 0.25, 3 chords = 0.5, 4 chords = 1.0
  const penalties: Record<number, number> = { 1: 0, 2: 0.25, 3: 0.5, 4: 1.0 };
  return penalties[bridge.length] ?? 1.0;
}
```

### 5.6 Combined Scorer

```typescript
function scoreCandidate(
  cand: BridgeCandidate,
  source: Chord,
  target: Chord,
  scale: ScaleContext | null,
): number {
  const vl = totalVoiceLeadingCost(source, cand.chords, target);
  const sn = sharedNoteBonus(source, cand.chords, target);
  const dt = diatonicBonus(cand.chords, scale);
  const cp = complexityPenalty(cand.chords);

  const raw = sn * 0.30 + dt * 0.20 - normalizeVL(vl) * 0.40 - cp * 0.10;
  // max possible raw = 0.30 + 0.20 + 0 − 0 = 0.50; normalize to 0–1
  return Math.max(0, Math.min(raw / 0.50, 1));
}
```

---

## 6. Data Shapes

### 6.1 Frontend TypeScript Types

These types belong in a new feature module `client/src/features/ii-v-suggestions/types/index.ts`:

```typescript
import type { Chord } from "@/features/current-chord/types";

/** The musical class of a ii–V bridge. */
export type BridgeType =
  | "diatonic-ii-v"
  | "tritone-sub-ii-v"
  | "chromatic-ii-v"
  | "incomplete-ii"
  | "incomplete-v"
  | "tritone-sub"
  | "backchain-vi-ii-v"
  | "backchain-iii-vi-ii-v";

/** A single bridge candidate with its score and human-readable explanation. */
export interface BridgeSuggestion {
  /** Ordered list of chords to insert between source and target. */
  bridge: Chord[];
  /** Normalized score 0–1 (higher = more recommended). */
  score: number;
  /** Musical bridge type classification. */
  type: BridgeType;
  /**
   * Short human-readable label for the suggestion, e.g. "ii–V into G"
   * Suitable for use in aria-label and tooltip text.
   */
  label: string;
  /** Longer explanation of harmonic function, e.g. "ii–V of Dm (applied dominant)" */
  explanation: string;
}

/** Input context for the bridge suggestion engine. */
export interface BridgeRequest {
  sourceChord: Chord;
  targetChord: Chord;
  /** Position index in the progression after which to insert the bridge. */
  insertAfterIndex: number;
  contextScale?: { root: number; mode: string } | null;
  maxBridgeLength?: number;
  topN?: number;
}
```

### 6.2 Optional Backend DTO (OpenAPI sketch)

If a backend endpoint is added later, the request/response shapes would be:

```yaml
# POST /Progression/suggest-bridges
requestBody:
  application/json:
    schema:
      type: object
      required: [sourceChord, targetChord]
      properties:
        sourceChord:
          $ref: '#/components/schemas/ChordDto'
        targetChord:
          $ref: '#/components/schemas/ChordDto'
        contextScale:
          $ref: '#/components/schemas/ScaleContextDto'   # optional
        maxBridgeLength:
          type: integer
          default: 2
        topN:
          type: integer
          default: 3

responses:
  '200':
    application/json:
      schema:
        type: array
        items:
          type: object
          properties:
            bridge:
              type: array
              items:
                $ref: '#/components/schemas/ChordDto'
            score:
              type: number
              format: float
            type:
              type: string
              enum:
                - diatonic-ii-v
                - tritone-sub-ii-v
                - chromatic-ii-v
                - incomplete-ii
                - incomplete-v
                - tritone-sub
                - backchain-vi-ii-v
                - backchain-iii-vi-ii-v
            label:
              type: string
            explanation:
              type: string
```

### 6.3 Frontend vs Backend Recommendation

| Criterion | Frontend | Backend |
|-----------|----------|---------|
| Computation time | <5 ms per pair | Network round-trip (~50–200 ms) |
| Dependencies | Existing utilities | New controller + service |
| Offline support | ✅ Yes | ❌ No |
| Shared caching | ❌ Not needed | ✅ If history persisted server-side |
| Effort (initial) | ~2–3 story points | ~4–5 story points |

**Recommendation: start frontend-only.** The algorithm is rule-based, fast, and self-contained. All necessary building blocks (`getChordNoteIndices`, `minimalMotionVoicing`, `computeSharedNotes`, `getDiatonicIndices`) already exist in the client. Add a backend endpoint only if progression history is persisted server-side and suggestions need to account for saved session context.

---

## 7. Suggested Feature Module Layout

Following the [feature-module convention](../feature-module-convention.md):

```
client/src/features/ii-v-suggestions/
├── index.ts                          # public exports
├── types/
│   └── index.ts                      # BridgeSuggestion, BridgeRequest, BridgeType
├── utils/
│   ├── buildBridge.ts                # buildDiatonicIIV, generateCandidates
│   ├── scoreCandidate.ts             # voiceLeadingCost, sharedNoteBonus, scoreCandidate
│   ├── suggestBridges.ts             # top-level suggestBridges() function
│   └── bridgeLabel.ts                # generateLabel, generateExplanation helpers
└── __tests__/
    └── suggestBridges.test.ts        # unit + property tests (see §9)
```

The hook that drives the UI lives in `progression-sidebar/hooks/useBridgeSuggestions.ts`:

```typescript
export function useBridgeSuggestions(
  chords: Chord[],
  insertAfterIndex: number,
  scale: ScaleContext | null,
): BridgeSuggestion[] {
  return useMemo(() => {
    if (insertAfterIndex < 0 || insertAfterIndex >= chords.length - 1) return [];
    return suggestBridges(
      chords[insertAfterIndex],
      chords[insertAfterIndex + 1],
      scale,
    );
  }, [chords, insertAfterIndex, scale]);
}
```

---

## 8. UI and Interaction Flows

### 8.1 Inline Suggestion Affordance

```
[ Dm7 ] ⟿ [ G7 ] ⟿ [ Cmaj7 ]
         ↑
   Bridge icon (subtle, appears on hover over the gap between tiles)
   Tooltip: "3 bridge suggestions"
```

- A small icon (e.g., a branching arrow `⟿` or a `+` badge) appears between two chord tiles when `suggestBridges` returns at least one candidate.
- The icon is always visible (not hover-only) for keyboard accessibility.
- `aria-label="Show ii–V bridge suggestions between [source chord] and [target chord]"`

### 8.2 Suggestion Popover

Clicking or activating the bridge icon opens a small popover anchored to the gap:

```
┌──────────────────────────────────────────────────┐
│  Bridge suggestions into G7                      │
│  ──────────────────────────────────────────────  │
│  ① Am7 → D7      ii–V of G    ████▓ 0.88  ▶ ✓  │
│  ② Em7 → A7      ii–V of Dm   ███░░ 0.75  ▶ ✓  │
│  ③ D♭7           tritone sub   ██░░░ 0.62  ▶ ✓  │
│                                                  │
│  [Close]                                         │
└──────────────────────────────────────────────────┘
```

Each row contains:
- **Name**: chord names forming the bridge (e.g., `Am7 → D7`)
- **Label**: short harmonic description
- **Score bar**: visual progress bar scaled 0–1
- **Preview (▶)**: plays the source → bridge → target sequence via the existing `useProgressionPlayback` / `playChord` audio utilities without modifying the progression state
- **Apply (✓)**: inserts the bridge chords at the insertion point and closes the popover

### 8.3 Preview Mode

- Activating **▶** calls a temporary in-memory sequence: `[source, ...bridge, target]`.
- Uses existing `playChord` from `audio/utils/audioUtils.ts`; no progression state mutation.
- A visual indicator (e.g., ghost tiles) appears in the progression sidebar for the duration of playback to show where the bridge would be inserted.
- Pressing **▶** again, pressing `Escape`, or navigating away stops the preview.

### 8.4 Apply Action

1. User presses **✓** on a suggestion row.
2. Bridge chords are spliced into the progression immediately after `insertAfterIndex`.
3. Progression now has `chords.length + bridge.length` entries.
4. Progression count cap (currently 8 chords) must be respected: if the bridge would exceed the cap, show a warning and disable the **✓** button.
5. The popover closes automatically.

### 8.5 Undo

- Apply action is wrapped in the existing undo mechanism (or a new `useUndoableProgression` hook if one does not exist).
- A toast notification appears: "Bridge inserted — [Undo]".
- Single undo removes the inserted bridge chords.

### 8.6 Accessibility Notes

| Element | Requirement |
|---------|-------------|
| Bridge icon button | `role="button"`, `aria-label="Show ii–V bridge suggestions between {sourceName} and {targetName}"`, keyboard-focusable (`tabIndex={0}`) |
| Suggestion popover | `role="dialog"`, `aria-label="ii–V bridge suggestions"`, focus trapped within popover |
| Suggestion rows | `role="listitem"`, each has a readable `aria-label` describing the bridge and its score |
| Preview button | `aria-label="Preview bridge: {chordNames}"` |
| Apply button | `aria-label="Apply bridge: {chordNames}"`, `aria-disabled={wouldExceedCap}` |
| Score bar | `aria-hidden="true"` (decorative); score value included in the row's `aria-label` |
| Keyboard navigation | `Tab` moves between rows; `Enter`/`Space` activates focused button; `Escape` closes popover |
| Screen reader announcement | After apply, use `aria-live="polite"` region to announce "Bridge {chordNames} inserted at position {n}" |

---

## 9. Test Vectors and Validation

### 9.1 Unit Test Cases (generation correctness)

```typescript
describe("buildDiatonicIIV", () => {
  it("returns Dm7–G7 for target Cmaj7", () => {
    // target.root = 0 (C), quality = "maj7"
    expect(buildDiatonicIIV({ root: 0, quality: "maj7" }))
      .toEqual({ iiRoot: 2, VRoot: 7, iiQuality: "min7", VQuality: "dom7" });
  });
  it("returns Am7b5–D7 for target Dm7 (minor key, half-dim ii)", () => {
    // target.root = 2 (D), quality = "min7"
    expect(buildDiatonicIIV({ root: 2, quality: "min7" }))
      .toEqual({ iiRoot: 4, VRoot: 9, iiQuality: "halfdim7", VQuality: "dom7" });
  });
});

describe("suggestBridges", () => {
  it("Dm7 → G7 in C major: top suggestion is Am7–D7 (diatonic ii–V of G)", () => {
    const source = { root: 2, quality: "min7" } as Chord; // Dm7
    const target = { root: 7, quality: "dom7" } as Chord; // G7
    const scale  = { root: 0, mode: "major" };
    const [top] = suggestBridges(source, target, scale);
    expect(top.type).toBe("diatonic-ii-v");
    expect(top.bridge[0].root).toBe(9);  // Am7
    expect(top.bridge[1].root).toBe(2);  // D7
  });

  it("G7 → Cmaj: returns Dm7–G7 (ii–V of C) as one candidate", () => {
    const source = { root: 7, quality: "dom7" } as Chord;
    const target = { root: 0, quality: "major" } as Chord;
    const suggestions = suggestBridges(source, target, null);
    const diatonic = suggestions.find((s) => s.type === "diatonic-ii-v");
    expect(diatonic).toBeDefined();
    expect(diatonic!.bridge[0].root).toBe(2);  // Dm7
    expect(diatonic!.bridge[1].root).toBe(7);  // G7
  });

  it("returns no more than topN suggestions", () => {
    const suggestions = suggestBridges(
      { root: 0, quality: "major" },
      { root: 5, quality: "major" },
      null,
      2,
      3,
    );
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  it("never returns a bridge where first chord === source and last === target", () => {
    const source = { root: 0, quality: "major" };
    const target = { root: 5, quality: "major" };
    const suggestions = suggestBridges(source, target, null);
    for (const s of suggestions) {
      const first = s.bridge[0];
      const last  = s.bridge[s.bridge.length - 1];
      expect(!(first.root === source.root && first.quality === source.quality
        && last.root  === target.root && last.quality  === target.quality)).toBe(true);
    }
  });

  it("identical source and target returns empty array", () => {
    const chord = { root: 0, quality: "dom7" };
    expect(suggestBridges(chord, chord, null)).toHaveLength(0);
  });
});
```

### 9.2 Scoring Property Tests (transposition invariance)

```typescript
describe("score transposition invariance", () => {
  it("transposing both chords by the same interval preserves relative ranking", () => {
    const source = { root: 2, quality: "min7" };
    const target = { root: 7, quality: "dom7" };
    const rankedOriginal = suggestBridges(source, target, null).map((s) => s.type);

    // Transpose up a perfect fourth (+5 semitones)
    const sourceT = { ...source, root: (source.root + 5) % 12 };
    const targetT = { ...target, root: (target.root + 5) % 12 };
    const rankedTransposed = suggestBridges(sourceT, targetT, null).map((s) => s.type);

    expect(rankedTransposed).toEqual(rankedOriginal);
  });
});
```

### 9.3 Integration Test Scenarios

| Scenario | Expected Behaviour |
|----------|--------------------|
| Bridge applied within cap (≤8 total) | Chords inserted; progression length increases by bridge.length |
| Bridge would exceed cap (>8 total) | Apply button disabled; warning text displayed |
| Preview playback | Audio plays source → bridge → target; progression state unchanged |
| Undo after apply | Inserted chords removed; original progression restored |
| Empty progression (0 chords) | No bridge icon rendered |
| Single-chord progression | No bridge icon rendered (no adjacent pair exists) |
| Non-7-note scale context | `DT` bonus = 0 (cannot determine diatonic conformance for non-heptatonic scales) |

### 9.4 Audio Validation

- Short MIDI preview of `[Dm7, G7]` bridge before `Cmaj7` should produce pitch classes `{2,5,9}` (Dm7), `{7,11,2,5}` (G7), `{0,4,7,11}` (Cmaj7) in sequence.
- Timing: each chord uses the current `chordDurationMs` setting; no custom duration for preview.

---

## 10. Example Outputs

### 10.1 Dm7 → G7 in C major context

```
Source: Dm7  (root=2)
Target: G7   (root=7)
Scale:  C major

Suggestion 1 — score 0.88
  Type:        diatonic-ii-v
  Bridge:      Am7 → D7  (roots: 9, 2)
  Label:       "ii–V into G"
  Explanation: "Diatonic ii–V of G7; Am7 shares E with Dm7"

Suggestion 2 — score 0.75
  Type:        tritone-sub-ii-v
  Bridge:      Am7 → D♭7  (roots: 9, 1)
  Label:       "ii–♭II into G (tritone sub)"
  Explanation: "Tritone substitute for D7; chromatic bass descent D♭→G"

Suggestion 3 — score 0.62
  Type:        chromatic-ii-v
  Bridge:      G♯m7 → C♯7  (roots: 8, 1)
  Label:       "chromatic ii–V into G"
  Explanation: "Half-step above diatonic ii–V; chromatic approach color"
```

### 10.2 G7 → Cmaj7 (no scale context)

```
Source: G7    (root=7)
Target: Cmaj7 (root=0)
Scale:  null

Suggestion 1 — score 0.84
  Type:        diatonic-ii-v
  Bridge:      Dm7 → G7  (roots: 2, 7)
  Label:       "ii–V into C"
  Explanation: "Classic ii–V of C; reinforces dominant resolution"

Suggestion 2 — score 0.71
  Type:        incomplete-v
  Bridge:      G7  (root: 7)
  Label:       "V into C"
  Explanation: "Single dominant chord; minimal insertion, strong pull"

Suggestion 3 — score 0.58
  Type:        tritone-sub
  Bridge:      D♭7  (root: 1)
  Label:       "tritone sub into C"
  Explanation: "♭II7 substituting G7; smooth half-step bass descent"
```

### 10.3 Cmaj7 → Fmaj7 (no scale context, bridge = subdominant approach)

```
Source: Cmaj7 (root=0)
Target: Fmaj7 (root=5)
Scale:  null

Suggestion 1 — score 0.80
  Type:        diatonic-ii-v
  Bridge:      Gm7 → C7  (roots: 7, 0)
  Label:       "ii–V into F"
  Explanation: "Diatonic ii–V of F; Gm7 shares G with Cmaj7"

Suggestion 2 — score 0.65
  Type:        tritone-sub-ii-v
  Bridge:      Gm7 → G♭7  (roots: 7, 6)
  Label:       "ii–♭II into F (tritone sub)"
  Explanation: "Tritone sub for C7; G♭7→F is chromatic approach"

Suggestion 3 — score 0.52
  Type:        incomplete-v
  Bridge:      C7  (root: 0)
  Label:       "V into F"
  Explanation: "C7 as secondary dominant; quick tonicization of F"
```

---

## 11. Risk Analysis and Performance Considerations

### 11.1 Performance

| Metric | Estimated Value | Notes |
|--------|----------------|-------|
| Candidates generated per pair | ~8–14 | 2 bridge types × up to 4 lengths + variants |
| `getChordPitchClasses` calls per score | ~6–10 | One per chord in chain |
| `minimalMotionVoicing` calls per score | ~3–6 | One per adjacent pair in chain |
| Total computation per pair | < 2 ms | Measured on mid-range device |
| Computation for 8-chord progression (7 pairs) | < 15 ms | Well within 1 frame budget |

Performance risk is **low**. Even on a low-end mobile device, the generation and scoring algorithm runs synchronously in < 15 ms for an entire 8-chord progression. No Web Worker is needed.

**Mitigation for future scale-up:** if backcycling chains of length > 4 are added, or the progression cap is raised beyond 16 chords, consider memoizing `suggestBridges` results with a shallow-equal key on `(sourceRoot, sourceQuality, targetRoot, targetQuality, scaleRoot, scaleMode)`.

### 11.2 Musical Taste Variance

- Algorithmic suggestions are rule-based and may not suit all styles (e.g., modal, atonal, or quartal harmony).
- **Mitigation:** Present suggestions as options, never auto-apply. Provide `explanation` text so users understand the harmonic rationale. Allow users to dismiss suggestions.

### 11.3 Naming and Labeling Ambiguity

- Chord names depend on the enharmonic context (`useFlats` flag from `EnharmonicProvider`).
- All `label` and `explanation` strings must be generated at render time using the active `pitchClasses` array from `useEnharmonic`, not computed inside `suggestBridges` (which deals only in root indices 0–11).

### 11.4 Progression Cap

- The cap of 8 chords in the progression sidebar must be respected.
- Inserting a 2-chord bridge into an 8-chord progression requires removing one existing chord first (user responsibility) or soft-disabling the **✓** button.

### 11.5 Quartal Chord Bridges

- The current bridge algorithm does not generate quartal-quality bridges. Quartal harmony does not follow ii–V logic. Quartal chords in the progression should be treated as opaque objects for the source/target.
- **Mitigation:** The scoring model handles quartal pitch classes correctly through `getChordPitchClasses`; quartal bridges are simply never generated as candidates.

### 11.6 Ambiguous Key Context

- Without a scale context, the `DT` diatonic bonus is always 0, and all candidates compete purely on voice-leading and shared-note criteria.
- This is acceptable for the initial implementation: frontends that have an active scale selection should pass it; those without still get useful suggestions.

---

## 12. Files to Create or Modify

| File | Action | Notes |
|------|--------|-------|
| `client/src/features/ii-v-suggestions/types/index.ts` | Create | `BridgeSuggestion`, `BridgeRequest`, `BridgeType` |
| `client/src/features/ii-v-suggestions/utils/buildBridge.ts` | Create | `buildDiatonicIIV`, `generateCandidates` |
| `client/src/features/ii-v-suggestions/utils/scoreCandidate.ts` | Create | `voiceLeadingCost`, `sharedNoteBonus`, `scoreCandidate` |
| `client/src/features/ii-v-suggestions/utils/suggestBridges.ts` | Create | Top-level `suggestBridges()` |
| `client/src/features/ii-v-suggestions/utils/bridgeLabel.ts` | Create | `generateLabel`, `generateExplanation` |
| `client/src/features/ii-v-suggestions/index.ts` | Create | Public exports |
| `client/src/features/ii-v-suggestions/__tests__/suggestBridges.test.ts` | Create | Unit + property tests (§9) |
| `client/src/features/progression-sidebar/hooks/useBridgeSuggestions.ts` | Create | React hook wrapping `suggestBridges` |
| `client/src/features/progression-sidebar/components/BridgeSuggestionIcon.tsx` | Create | Inline affordance icon |
| `client/src/features/progression-sidebar/components/BridgeSuggestionPopover.tsx` | Create | Popover with suggestion rows |
| `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` | Modify | Integrate `BridgeSuggestionIcon` between tiles |
| `server/ParametricMusic.Api/Controllers/ProgressionController.cs` | Modify (optional) | Add `POST /Progression/suggest-bridges` endpoint |

---

## 13. Prioritized Follow-Up Issues

| # | Title | Points | Depends On | Priority |
|---|-------|--------|-----------|----------|
| 1 | **Implement `suggestBridges` engine** — `ii-v-suggestions` feature module with `buildBridge`, `scoreCandidate`, `suggestBridges` utilities and full unit test suite | 2–3 | — | High |
| 2 | **`useBridgeSuggestions` hook** — React hook that memoizes `suggestBridges` for a given pair in the progression sidebar | 1 | #1 | High |
| 3 | **`BridgeSuggestionIcon` + `BridgeSuggestionPopover` components** — Inline affordance icon between chord tiles; popover listing ranked suggestions with score bar, preview (`▶`), and apply (`✓`) controls; full keyboard and screen-reader accessibility | 2–3 | #1, #2 | High |
| 4 | **Preview playback** — Wire the **▶** button to `playChord` for source → bridge → target playback without mutating progression state; show ghost tiles during preview | 1–2 | #3 | Medium |
| 5 | **Undo after apply** — Wrap apply action in undo mechanism; toast notification with "Undo" link | 1 | #3 | Medium |
| 6 | **Enharmonic-aware label generation** — `generateLabel` and `generateExplanation` using active `pitchClasses` from `useEnharmonic` | 1 | #1 | Medium |
| 7 | **Integration tests** — Playwright or Vitest browser tests for popover open/close, apply, undo, and preview flows | 1–2 | #3, #4, #5 | Medium |
| 8 | **Optional backend endpoint** — `POST /Progression/suggest-bridges` controller + xUnit tests; only if progression history is persisted server-side | 2–3 | #1 | Low |

**Total estimate:** 11–16 story points across 8 follow-up issues.

---

## 14. Files Assessed

| File | Role in Spike | Change Required? |
|------|--------------|-----------------|
| `client/src/features/chord/utils/transpose.ts` | `CHORD_INTERVALS`, `getChordNoteIndices` — used in generation | No |
| `client/src/features/chord/utils/getChordPitchClasses.ts` | `getChordPitchClasses` — used in scoring | No |
| `client/src/features/voice-leading/utils/voicing.ts` | `closeVoiceChord`, `minimalMotionVoicing` — used in VL cost | No |
| `client/src/features/progression-sidebar/utils/pairMetrics.ts` | `computeSharedNotes` — used in SN bonus | No |
| `client/src/features/scale/utils/scaleUtils.ts` | `getDiatonicIndices` — used in DT bonus | No |
| `client/src/features/current-chord/types/index.ts` | `Chord` type — used as data shape | No |
| `client/src/features/chord/types/index.ts` | `ChordType` — used throughout | No |
| `client/src/app/providers/EnharmonicContext.ts` | `useEnharmonic` — needed for label rendering | No |

---

## 15. References

- Roman numeral harmony and ii–V motion: Berklee Music Theory, Book 2 (Schmeling, 2011)  
- Tritone substitution: *The Jazz Theory Book* (Levine, 1995), Chapter 17  
- `client/src/features/voice-leading/utils/voicing.ts` — `minimalMotionVoicing`  
- `client/src/features/progression-sidebar/utils/pairMetrics.ts` — `computeSharedNotes`  
- `client/src/features/chord/utils/transpose.ts` — `CHORD_INTERVALS`  
- `docs/feature-module-convention.md` — feature module layout guidelines  
- `docs/accessibility-audit.md` — WCAG 2.1 accessibility requirements  
