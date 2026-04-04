# Epic 12 — Scale as Compositional Context

## Purpose

Promote the scale/key system from hidden infrastructure to a visible, user-
controlled compositional layer. After this epic, a composer can declare a key,
see their chord labeled by harmonic function, and read modal context directly
from the chromatic circle.

This is the foundational architectural shift from a **pitch-driven system** to
a **dual-coordinate system**:

- **Absolute pitch space** — the chromatic circle, chord graph, and geometry
  (unchanged by this epic)
- **Relative harmonic space** — key context (root + mode) as an interpretive
  overlay

> **Core architectural constraint:** Key context acts as a *non-destructive
> interpretive layer* over the chord graph and must not constrain chord
> generation or graph traversal. All key-context machinery is annotation and
> classification only — never a filter or gating mechanism.

---

## Issues

| ID | Title | Phase |
|---|---|---|
| [E12-02](ISSUE-E12-02.md) | Decouple Key Root from Chord Root | 1 — Foundation |
| [E12-01](ISSUE-E12-01.md) | Key Context Panel (root + mode selector) | 1 — Foundation |
| [E12-03](ISSUE-E12-03.md) | Roman Numeral Display in Current Chord Panel | 2 — Core value |
| [E12-05](ISSUE-E12-05.md) | Tonic Emphasis on the Chromatic Circle | 2 — Core value |
| [E12-04](ISSUE-E12-04.md) | Diatonic Chord Categorization in Chord Grid | 3 — Reinforcement |
| [E12-06](ISSUE-E12-06.md) | Persist Key Context in Session Snapshot | 3 — Reinforcement |

---

## Implementation Order

### Phase 1 — Foundation (low risk, high leverage)

1. **E12-02** — Remove the chord-root / key-root coupling; introduce
   `setKeyContext()` as the single write path. This unblocks everything else.
2. **E12-01** — Build `KeyContextPanel` (root selector + mode dropdown);
   wire startup to C major.

### Phase 2 — Core User Value

3. **E12-03** — Add Roman numeral label to `CurrentChordPanel`; add primary
   "Set as tonic" tonic-snap.
4. **E12-05** — Add tonic node marker to chromatic circle; introduce
   `NodeVisualState` render contract.

### Phase 3 — Reinforcement

5. **E12-04** — Add diatonic dot indicator to chord grid.
6. **E12-06** — Verify and enforce snapshot round-trip of key context.

---

## Success Criteria

A user should be able to answer the following questions **within 3 seconds**
without any prior knowledge of the internal implementation:

- "What key am I in?" → visible in `KeyContextPanel`
- "What function is this chord?" → visible as Roman numeral in `CurrentChordPanel`
- "Where is the tonic on the circle?" → tonic node is visually distinct
- "Which chords are in key?" → diatonic dot indicator on chord grid

Additionally:

- Selecting a chord with a different root **does not change** the declared key
- All 7 diatonic chords in the active key display the correct Roman numeral
- D Dorian and C major produce **different** chromatic circle appearances
- A key set to D Dorian, exported as a snapshot, and reimported restores D Dorian

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Single write path | `setKeyContext({ root, scale, source })` | Prevents state inconsistency bugs across 4 write paths (panel, tonic snap, snapshot, startup) |
| Roman numeral style | Classical v1 only | Clean, unambiguous; jazz extensions deferred |
| Degree identity primary | Scale step first, quality is decoration | Prevents mechanically consistent but musically odd labels |
| Non-diatonic always shows accidental | Yes | "Obviously incomplete" is preferable to "quietly misleading" |
| Chord grid treatment | Positive indicator only (no suppression) | Inform, never restrict; non-diatonic chords are often the most interesting |
| Startup key | C Major, uniform random diatonic chord | Deterministic; avoids immediate key contradiction; no weighting in v1 |
| Mode label aliases | "Major (Ionian)", "Minor (Aeolian)" | Reduces friction for non-modal users |
| Node rendering | `NodeVisualState` → single renderer | Prevents CSS drift and scattered conditionals |

---

## Non-Goals

- Key detection / auto-inference from chord content
- Multi-key / modulation tracking
- Backend changes — all work is frontend state + display
- Scale degree constraints (locking to diatonic chords only)
- Secondary dominant analysis (V/V, V/ii) — hook only in E12-03
- Jazz Roman numeral extensions (Imaj7, ii7)
- Context-aware enharmonic spelling — global preference is sufficient for v1
- Weighted startup chord selection (I/IV/V bias) — deferred to v1.1

---

## Cross-Cutting Concerns

### Enharmonic consistency

All label rendering (root selector, mode selector, Roman numeral, chord name)
must use the same enharmonic preference — the global `useEnharmonic` hook and
`pitchClasses` arrays are the single source of truth.

### Graph-theoretic foundations

Key context is an interpretive fiber over the pitch-class graph, not a
modification of it. Roman numerals are a quotient mapping Z₁₂ → Z₇ under
the declared key. `chordDistance` remains key-independent in this epic; future
augmentation with contextual penalties is documented but not implemented here.
See the analysis document for the full graph-theoretic framing.

---

## Reference

Full analysis with design rationale: [epic12-analysis.md](epic12-analysis.md)
