# SPIKE: Architectural Readiness for Negative Harmony Transform

**Date:** 2026-03-31
**Status:** Complete
**Author:** Copilot (investigation)
**Related Issue:** SPIKE — Architectural Readiness for Negative Harmony Transform

---

## 1. Executive Summary

**Verdict: The system is architecturally ready. Implement as a frontend-only feature using existing pitch-class, chord-identification, and progression utilities. No backend changes are required for the initial implementation.**

Negative harmony is a structured inversion of tonal space in which each pitch class is reflected across a chosen axis—canonically the midpoint between the tonic and its perfect fifth. Because the application already models harmony geometrically as pitch-class sets and supports chord identification via Jaccard similarity matching, the transform slots naturally into the existing abstraction stack.

A working prototype (`client/src/features/negative-harmony/`) has been produced as part of this spike, demonstrating that:

1. The reflection math is simple and deterministic.
2. All standard triads and seventh chords survive round-trip reflection with exact chord-ID matches (matchScore = 1).
3. The `findNearestChord` engine resolves every reflected pitch-class set back to a named chord.
4. No new data-model primitives are required—`Axis` and `NegativeHarmonyResult` fit naturally alongside existing types.

---

## 2. Musical Background

Negative harmony reflects the intervallic structure of a chord or progression around a tonal axis, preserving the distances between pitch classes while inverting the direction of harmonic motion. The canonical axis for a key is the midpoint between the tonic and dominant:

```
axis_centre = tonicRoot + 3.5   (pitch-class units)
```

For key of C (tonicRoot = 0):

| Original | Reflected | Pair |
|----------|-----------|------|
| C  (0)   | G  (7)    | Tonic ↔ Dominant |
| D  (2)   | F  (5)    | Supertonic ↔ Subdominant |
| E  (4)   | E♭ (3)    | Major 3rd ↔ Minor 3rd |
| A  (9)   | B♭ (10)   | Submediant ↔ Subtonic |
| B  (11)  | A♭ (8)    | Leading tone ↔ Submediant♭ |

Functional consequences in C major:

| Original function | Reflected function |
|-------------------|--------------------|
| I  (C major)      | I  (C minor)       |
| V  (G major)      | IV (F minor)       |
| IV (F major)      | V  (G minor)       |
| ii (D minor)      | VII (B♭ major)     |
| V7 (G dom7)       | iiø7 (D half-dim7) |

This is consistent with the classical Levy/Coleman model: dominant function maps to subdominant function and vice versa, while tonic maps to tonic in the parallel mode.

---

## 3. Reflection Algorithm

### 3.1 Formula

Given:
- `p` — a pitch class (integer 0–11)
- `a` — axis centre in pitch-class space (possibly fractional)

The reflection is:

```
p' = (2a − p) mod 12
```

For the canonical tonic–dominant axis of key `r`:

```
a = r + 3.5
p' = (2r + 7 − p) mod 12
```

### 3.2 Properties

- **Involution:** reflecting twice returns the original pitch class.  
  `reflect(reflect(p)) = p`
- **Bijection:** every pitch class maps to a unique output; no collisions.
- **Preserves intervallic distances:** the interval between any two reflected pitch classes equals the interval between the originals.

### 3.3 Sample Transformations

**ii–V–I in C major → negative equivalent:**

```
Dm7   [2, 5, 9, 0] → {2, 5, 7, 10} = G min7
G7    [7, 11, 2, 5] → {0, 2, 5, 8} = D half-dim7 (Dø7)
Cmaj  [0, 4, 7]    → {0, 3, 7}    = C minor
```

**I–V–vi–IV in C major → negative equivalent:**

```
C major  [0, 4, 7]    → {0, 3, 7}    = C minor
G major  [7, 11, 2]   → {0, 5, 8}    = F minor
A minor  [9, 0, 4]    → {3, 7, 10}   = E♭ major
F major  [5, 9, 0]    → {2, 7, 10}   = G minor
```

All transformations produce exact chord-ID matches (Jaccard score = 1), validating the existing `findNearestChord` engine as a sufficient post-transform reinterpretation layer.

---

## 4. Prototype Implementation

A minimal but complete prototype lives in:

```
client/src/features/negative-harmony/
├── types/
│   └── index.ts           ← Axis, TransformScope, NegativeHarmonyResult
├── utils/
│   ├── reflectPitchClasses.ts   ← reflectPitchClass, reflectPitchClasses,
│   │                               applyNegativeHarmonyToChord, applyNegativeHarmony
│   └── __tests__/
│       └── negativeHarmony.test.ts  ← 30 tests covering musical plausibility
└── index.ts               ← barrel exports
```

### 4.1 Public API Surface

```typescript
// Resolve the numeric axis centre from an Axis descriptor
resolveAxisCentre(axis: Axis): number

// Reflect a single pitch class across an axis centre
reflectPitchClass(pitchClass: number, axisCentre: number): number

// Reflect an array of pitch classes and return a sorted, deduplicated result
reflectPitchClasses(pitchClasses: number[], axis: Axis): number[]

// Transform a single Chord and identify the result
applyNegativeHarmonyToChord(chord: Chord, axis: Axis): NegativeHarmonyResult

// Transform every chord in an ordered progression
applyNegativeHarmony(chords: Chord[], axis: Axis): NegativeHarmonyResult[]
```

### 4.2 Type Definitions

```typescript
type Axis =
  | { type: "tonic-dominant"; tonicRoot: number }   // canonical key-based axis
  | { type: "custom"; centre: number };              // fractional or custom axis

type TransformScope =
  | { type: "chord" }
  | { type: "progression" }
  | { type: "region"; startIndex: number; endIndex: number };

interface NegativeHarmonyResult {
  chord: Chord;                  // nearest named chord after reflection
  reflectedPitchClasses: number[]; // raw output before chord identification
  matchScore: number;            // Jaccard similarity (0–1); 1 = exact match
}
```

---

## 5. Current System Readiness Assessment

### 5.1 Pitch-Class Representation (✅ High)

The entire domain is pitch-class–centric (integers 0–11). The reflection formula `p' = (2a − p) mod 12` is a single arithmetic operation per note. No changes to the domain model are needed.

### 5.2 Chord Identification Engine (✅ High)

`findNearestChord` uses Jaccard similarity to match arbitrary pitch-class sets against all 12 roots × 9 chord types (108 candidates). Validation against the full set of standard triads and seventh chords confirms it correctly resolves every reflected set (matchScore = 1 for all standard chords). It handles ambiguous and non-tertian sets gracefully with a partial-match score.

### 5.3 Geometric / Chromatic Circle Modeling (✅ High)

The chromatic circle's 30°-per-semitone layout makes reflection geometrically intuitive: the axis appears as a diameter of the circle. No visual changes are required for the transform itself; the reflected notes will naturally occupy the mirrored positions. The existing polygon morphing infrastructure can animate the transition.

### 5.4 Progression Modeling (✅ High)

`applyNegativeHarmony(chords, axis)` operates on `Chord[]` directly, consistent with how `useProgression` returns its `chords` array. Integration into the existing progression pipeline is straightforward.

### 5.5 Tonal Context / Axis Model (⚠️ Medium)

Currently there is no first-class `KeyContext` or `Axis` object in the application state. The `ScaleContext` type (`{ root: number; mode: ScaleType }`) captures the key root and mode, which is sufficient to derive the default tonic–dominant axis. The gap is that no current UI or hook exposes or persists the "active key" as a dedicated concept separate from the scale panel.

**Gap:** The transform's axis must be bound to an explicit key. If no key is set, results are musically arbitrary.

**Mitigation path:** Derive the axis from `ScaleContext` (already in the system via `HarmonySnapshot`) until a dedicated key-binding UI is implemented.

### 5.6 Enharmonic Normalization (⚠️ Medium)

After reflection, pitch classes are integers (0–11). The spelling (e.g., F♯ vs G♭) is determined by `findNearestChord`'s root selection and the existing `PITCH_CLASSES` label array (which uses sharps by default: `["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]`).

This is sufficient for a first implementation but may produce theoretically awkward spellings in flat keys. A deterministic respelling layer (keyed on the active `ScaleContext`) would improve readability for users working in flat keys.

**Gap:** No context-aware enharmonic disambiguation yet exists.

**Mitigation path:** Post-transform, apply an existing or new `respellForKey(pitchClass, scaleContext)` function. This can be a standalone utility that maps each pitch class to its diatonic or closest-fitting enharmonic spelling within the active key.

### 5.7 Voice-Leading Integration (⚠️ Medium — optional for v1)

The `minimalMotionVoicing` and `computeSharedNotes` utilities in `voice-leading/` can validate that the reflected progression preserves smooth voice motion. This is a high-value optional enhancement that enables "blend modes" (original ↔ negative) and selective transformation.

**Gap:** No hook connects the transform output to the voice-leading layer.

**Mitigation path:** After generating `NegativeHarmonyResult[]`, pass adjacent `reflectedPitchClasses` pairs through `minimalMotionVoicing` for analysis and optional re-voicing.

### 5.8 UX / Transform Panel (⚠️ Medium — not yet started)

No UI exists for triggering, previewing, or committing a negative harmony transform. The UX must address the preview-vs-commit workflow and scope selection.

---

## 6. Axis Modeling Strategies

### Strategy A: Derive from Active Scale (Recommended for v1)

Use `ScaleContext.root` as `tonicRoot` for the tonic–dominant axis. This binds the transform to the key already visible in the scale panel, requiring no additional state.

```typescript
const axis: Axis = { type: "tonic-dominant", tonicRoot: scaleContext.root };
```

**Pros:** Zero new state; consistent with existing key context.  
**Cons:** Minor-key contexts still use the major-key axis (both share the same root); the tonic–dominant axis is the correct canonical choice regardless.

### Strategy B: Dedicated Key-Binding UI

Introduce an explicit "transform key" dropdown (all 12 roots × 2 axis types). Persisted to `HarmonySnapshot` as part of a new `transformContext` field.

**Pros:** Full user control; supports modal and non-functional contexts.  
**Cons:** Requires UX design and state schema changes.

### Strategy C: User-Drawn Axis on the Chromatic Circle

Allow users to click two points on the circle to define a custom axis. The axis centre is computed as the midpoint of the two selected pitch classes.

**Pros:** Highly expressive; visually intuitive.  
**Cons:** Complex UX; only worthwhile after core feature is stable.

**Recommendation:** Implement Strategy A first. Strategy B can follow as a configuration panel addition.

---

## 7. Enharmonic Spelling Strategy

For a first implementation, accept the sharp-biased spelling from the existing `PITCH_CLASSES` array. The `findNearestChord` root is already the most musically sensible root given the reflected pitch set.

For a second iteration, add a `respellForKey` utility:

```typescript
function respellForKey(pitchClass: number, scaleContext: ScaleContext): string;
```

This maps each pitch class to the closest diatonic note name in the scale, falling back to the enharmonically simpler accidental if the note is chromatic (e.g., prefer F♯ over G♭ in G major, B♭ over A♯ in F major).

The existing `ScaleGenerator` on the backend already produces fully spelled scale degrees per key; these could serve as the reference spelling table.

---

## 8. UX Proposal

### 8.1 Entry Points

| Entry Point | Scope | Trigger |
|-------------|-------|---------|
| Chord tile context menu | Single chord | Right-click → "Apply Negative Harmony" |
| Progression sidebar action bar | Full progression | Button → "Negative Harmony" |
| Region selection (future) | Subset of chords | Select chords → action |
| Transform panel (future) | Configurable | Dedicated panel with axis controls |

### 8.2 Preview-Before-Commit Workflow

1. User triggers transform (chord or progression scope).
2. Reflected chords are shown as a **preview overlay** (greyed-out second row or ghost tiles) without altering the active progression.
3. User accepts ("Apply") or dismisses ("Cancel").
4. On accept, reflected chords replace the originals (or are appended as a new section).

This non-destructive workflow is essential: negative harmony is a creative lens, not a one-click replacement.

### 8.3 Blend Mode (Advanced, Post-v1)

A slider controls interpolation between the original and negative-harmony progressions:

- At 0%: original progression.
- At 100%: full negative harmony.
- Intermediate values: mix pitch classes (useful for gradual harmonic colour shifts).

### 8.4 Axis Display

When the transform is active, a visual axis line is drawn as a diameter of the chromatic circle, reinforcing the geometric intuition. The axis rotates as the active key changes.

---

## 9. Transform Pipeline Integration

The prototype `applyNegativeHarmony` fits into the progression pipeline at the point where the user requests a transform action:

```
useProgression.chords
       │
       ▼
applyNegativeHarmony(chords, axis)   ← new, in negative-harmony feature
       │
       ▼
NegativeHarmonyResult[]
       │
       ├─ .reflectedPitchClasses → show on chromatic circle (preview)
       ├─ .chord                 → show in progression sidebar (preview)
       └─ .matchScore            → surface warnings for low-confidence results
               │
               ▼  (on commit)
useProgression.addChord / replaceChord (existing)
```

No changes are required to `useProgression`, `Chord`, or the backend.

---

## 10. Identified Gaps and Prioritized Follow-Up Issues

| # | Gap | Priority | Estimated Effort |
|---|-----|----------|-----------------|
| 1 | **Key-binding strategy:** bind axis to `ScaleContext.root` by default; add explicit axis control later | Medium | 1 pt (default) / 3 pts (UI) |
| 2 | **Transform UI — chord-level entry:** context menu on ChordTile | High | 2 pts |
| 3 | **Transform UI — progression-level entry:** action bar button with preview workflow | High | 3 pts |
| 4 | **Preview-vs-commit workflow:** ghost tiles in sidebar, chromatic circle overlay | High | 3 pts |
| 5 | **Axis visualisation:** diameter line on the chromatic circle when transform is active | Medium | 2 pts |
| 6 | **Enharmonic respelling:** `respellForKey` utility keyed on `ScaleContext` | Low | 2 pts |
| 7 | **Voice-leading validation post-transform:** surface large-leap warnings | Low | 2 pts |
| 8 | **Region-level transform scope:** apply to a subset of chords in the progression | Low | 2 pts |
| 9 | **Blend mode:** interpolation slider between original and reflected | Low | 3 pts |
| 10 | **Persist axis in HarmonySnapshot:** `transformContext` schema field | Low | 1 pt |

**Implementation total:** 2–3 pts spike (complete) + 8–12 pts for items 1–5 (core UX).

---

## 11. Test Cases Validating Musical Plausibility

All 30 tests pass (see `utils/__tests__/negativeHarmony.test.ts`). Key musical plausibility checks:

| Assertion | Expected | Verified |
|-----------|----------|---------|
| C major → C minor (C-major axis) | Exact, score=1 | ✅ |
| G major → F minor (C-major axis) | Exact, score=1 | ✅ |
| F major → G minor (C-major axis) | Exact, score=1 | ✅ |
| Dm7 → Gm7 (ii-V-I test, C-major axis) | Exact, score=1 | ✅ |
| G7 → Dø7 (ii-V-I test, C-major axis) | Exact, score=1 | ✅ |
| Cmaj → Cmin (ii-V-I test, C-major axis) | Exact, score=1 | ✅ |
| Am → E♭maj (I-V-vi-IV test) | Exact, score=1 | ✅ |
| Reflect twice = original (involution) | All 12 pitch classes | ✅ |
| Reflect is a bijection | All 12 → distinct 12 | ✅ |
| customNotes respected | Ignores root+quality | ✅ |

---

## 12. Bottom Line

The system is not just compatible with negative harmony—it is structurally built for it. The pitch-class model, the geometric circle, the chord-ID engine, and the progression abstraction all align with the mathematical requirements of tonal inversion.

The remaining work is:

1. **Bind the axis to an explicit tonal context** (derive from `ScaleContext.root` by default).
2. **Build the UX entry points** (chord-tile context menu + progression action bar).
3. **Implement the preview-before-commit workflow** to keep the transform non-destructive.
4. **Optionally layer in** voice-leading analysis, axis visualisation, and enharmonic respelling.

A focused 8–12 point implementation sprint following this spike will bring negative harmony from prototype to production-ready feature.
