# Epic 12 — Scale as Compositional Context: Analysis

> *Revised three times after design critique. v1 changes marked ⚑; v2 changes marked ⚐; v3 changes marked ◆.*

## Problem Statement

The scale/key system exists in the codebase but does not serve the composer. A
user who wants to "work in D Dorian" cannot express that intent, cannot see
chords labeled relative to that key, and has no reliable way to know what scale
the app thinks they are in. The feature is infrastructure without a workflow.

This epic is also a **foundational architectural shift**: today the app is
pitch-driven (circle geometry, chord shapes). After this epic it gains a
*context layer* (harmonic key) that separates pitch space from harmonic
interpretation — opening the door to functional analysis, voice-leading
evaluation, and modulation tracking in future epics.

---

## Current State (What Actually Exists)

### Infrastructure (working, hidden)

| What | Where | Effect |
|---|---|---|
| `ScaleType` union (8 modes) | `scale/types/scales.ts` | Correct interval tables |
| `getDiatonicIndices(root, mode)` | `scale/utils/scaleUtils.ts` | Correct diatonic set |
| `getHarmonyOpacity(note, diatonic, isChordTone)` | `color-language/utils/harmonyOpacity.ts` | 3-tier node opacity |
| `keyRoot` / `keyScale` in `App.tsx` | App state | Drives opacity + MIDI export |
| `diatonicBonus` in `scoreCandidate.ts` | `ii-v-suggestions` | Scale-aware bridge ranking |

### What is NOT there

| Missing | Impact |
|---|---|
| **No scale/mode selector UI** | User cannot change the mode — ever |
| **No key root selector UI** | Key root is inferred from chord root on drag; they are coupled |
| **No Roman numeral display** | Chord function within the key is invisible |
| **No diatonic chord highlighting** | Chord grid gives no "in key" signal |
| **No tonic emphasis on the circle** | Modal keys (D Dorian) look identical to their relative major (C major) |
| **Random startup key** | `selectRandomDiatonicStartupChord()` picks mode randomly; user has no orientation |

---

## Root Cause: Three Architectural Conflations

### 1. Key root = chord root (wrong coupling)

`onKeyScaleChange(root, scale)` fires from `useChordState` whenever
`effectiveRoot` (the active chord's root) changes. This means selecting C
major silently sets the key root to C — every chord change moves the key. A
composer who declares "I'm in G major" and plays a IV chord in C should not
have the key jump to C.

**Fix required:** Decouple `keyRoot` from `effectiveRoot`. The key is an
independent piece of state that the user sets explicitly and that persists
until they change it.

### 2. Mode is read-only (no UI to set it)

`keyScale` in `App.tsx` defaults to `startupSelection.keyScale`, which is
random. The only code path that updates `keyScale` is `handleKeyScaleChange`,
triggered by `onKeyScaleChange` from the circle — but that callback passes the
current `selectedScale` prop (which never changes), so the mode is effectively
frozen at whatever the random startup value was. `ScalePlaceholder` is a
literal empty fragment.

**Fix required:** A mode dropdown the user can control.

### 3. Scale affects opacity but the circle never shows you the key

The circle correctly dims non-diatonic nodes — but because the startup mode is
random and there is no UI to see or change it, the user cannot interpret the
visual. They see some nodes bright and some dim with no explanation.

**Fix required:** Display the active key (root + mode) prominently, make it
user-controlled, and visually distinguish the tonic node from other diatonic
nodes (see ⚑ Tonic Emphasis below).

---

## What "Scale as Compositional Context" Actually Means

> **◆ Architectural constraint:** Key context acts as a *non-destructive interpretive layer* over the chord graph and must not constrain chord generation or graph traversal. All key-context machinery is annotation and classification only — never a filter or gating mechanism.

From a composer's perspective, locking a scale should do four things:

1. **Declare the key** — "I am composing in D Dorian." This persists until
   changed and is independent of which chord is currently selected.

2. **Color the circle** — Diatonic nodes are bright; chromatic nodes are dim;
   the tonic node is distinctly marked. This already works mechanically for
   the first two; it just needs a correct, stable key and tonic emphasis.

3. **Label chords by function** — When I select a chord, the panel should say
   "iii" or "V" or "♭VII" relative to the declared key. This is the primary
   missing insight.

4. **Categorize the exploration space** — The chord grid should distinguish
   diatonic chords from borrowed/chromatic chords without suppressing either.
   Non-diatonic chords are often the most interesting ones.

---

## Proposed Scope for Epic 12

### Issue E12-01 — Key Context Panel (root + mode selector)

Replace `ScalePlaceholder` with a real `KeyContextPanel` component exposing:
- A root note selector (12 chromatic roots, respects the global flat/sharp
  preference — see ⚑ Enharmonic Consistency below)
- A mode selector (the 8 existing `ScaleType` values with `SCALE_LABELS`)
- ⚑ A prominent **"Set tonic from chord"** affordance (one click; not buried;
  see ⚑ Tonic Snap below)

**State change:** `keyRoot` and `keyScale` become user-controlled, not
chord-coupled. The `onKeyScaleChange` callback from the circle is retired as
an automatic write path.

**Startup:** ⚑ Default to C Major deterministically *and* constrain the
random startup chord to be diatonic to C major. Opening to "F# minor in C
major" would immediately contradict the key context the epic is trying to
establish.

**⚐ Startup chord weighting:** Rather than uniform randomness over all 7
diatonic chords, bias toward tonic (I), predominant (IV), and dominant (V)
functions. This ensures the Roman numeral display is immediately legible and
functionally meaningful on first load — users see "I", "IV", or "V" before
they've made any choice, which reinforces the system's purpose.

---

### Issue E12-02 — Decouple Key Root from Chord Root

Remove the `onKeyScaleChange` callback linkage that currently writes `keyRoot`
on every chord drag. The key is now writable only through `KeyContextPanel`
(or the tonic-snap affordance in that panel).

This is a small code change — one `useEffect` in `useChordState.ts` — but a
significant semantic one. It is the fix for the "C Dorian after selecting C
Major" confusion.

---

### Issue E12-03 — Roman Numeral Display in Current Chord Panel

Add a Roman numeral label to `CurrentChordPanel` showing the degree of the
current chord relative to the active key. Examples: `I`, `ii`, `V`, `♭VII`.

#### Notation style (⚑ settled: classical v1)

Use classical-style Roman numerals only for v1:

| Diatonic | Non-diatonic |
|---|---|
| I, ii, iii, IV, V, vi, vii° | ♭II, ♯IV, ♭VII, etc. |

Case follows chord quality: major/aug = uppercase, minor/dim = lowercase.
Degree symbol for diminished. Do **not** add 7th or extension suffixes in v1 —
the chord name (already displayed) answers that question. The Roman numeral
answers one thing only: *where am I relative to the key?*

**⚐ Degree identity is primary; quality is decoration.** Case (upper/lower)
should follow the *scale degree's expected quality*, not the actual chord
quality in isolation. Otherwise edge cases like a borrowed B♭ major in C major
produce mechanically consistent but musically odd labels. The rule: identify
the scale step first, then annotate the quality deviation. An unexpected quality
on a known degree is a separate decoration (e.g. IV with a raised 7th), not a
new degree.

#### ⚑ Future-proofing hook in `romanNumeral.ts`

`romanNumeral.ts` should return a structured object even in v1:

```ts
// v1 return type — render only `label`, but carry the rest for future use
export interface RomanNumeralAnalysis {
  label: string;               // e.g. "♭VII"
  degree: number;              // 0-based scale step (0 = tonic)
  accidental: "♭" | "♯" | null;
  isDiatonic: boolean;
  contextualWeight?: number;   // ◆ placeholder: future functional scoring (V→I ≠ random adjacency)
  isFunctionalOutlier?: boolean; // ◆ set when non-diatonic AND quality implies function (e.g. dom7 not on V)
}

export function getRomanNumeral(
  chordRoot: number,
  keyRoot: number,
  keyScale: ScaleType,
  chordQuality: ChordType,
): RomanNumeralAnalysis

// Future extension point (not implemented in E12):
// export function getHarmonicFunction(chord, key): HarmonicFunction
// → handles secondary dominants (V/V, V/ii), borrowed chords (♭VI, iv), etc.
```

Returning a structured object avoids re-computing `degree` and `isDiatonic`
later when harmonic function analysis is added. A non-diatonic D7 in C major
should eventually be labelable as "V/V" — that analysis belongs post-E12;
the object shape is the guard against reinvention.

**◆ `isFunctionalOutlier` flag:** Set `isFunctionalOutlier: true` when `isDiatonic === false` and the chord quality strongly implies a functional role — particularly a dominant-7 chord not occupying scale degree V. This is a passive flag only; E12 does not analyze *what* function it implies. It exists as a hook for future tooltips ("this chord may function as V/V") and harmonic scoring without requiring that analysis here.

---

### Issue E12-04 — Diatonic Chord Categorization in Chord Grid

The `ChordGrid` (chord name selector below the circle) currently treats all
chords at equal visual weight. The active key should categorize chords without
suppressing non-diatonic ones.

#### ⚑ Categorization over suppression

Non-diatonic chords are not "less important" — they are often the most
interesting harmonic choices. The treatment should inform, not discourage:

- **In key**: subtle positive indicator (e.g., a thin colored underline or dot
  using the chord's quality color)
- **Borrowed/chromatic**: no negative treatment — same visual weight as today

This is deliberately different from the circle's opacity approach. The circle
operates at the **pitch level** (individual notes); the grid operates at the
**harmonic choice level**. Using the same dimming metaphor in both places
would be visually redundant and musically misleading.

**⚐ Discoverability:** A subtle indicator that only advanced users notice
is not useful. The in-key signal should be repeated and consistent. Include a
legend entry or tooltip (e.g. "● = diatonic to key") early in the onboarding
path so the distinction is legible to beginners, not just experts.

---

### Issue E12-05 — ⚑ Tonic Emphasis on the Chromatic Circle

Without a distinct tonic marker, D Dorian looks identical to C major on the
circle (same 7 bright nodes, same 5 dim nodes). Users will not understand the
modal difference. This is not optional for modal key contexts.

Visual treatment: a ring, stronger border, or distinct fill variant on the
`keyRoot` node — separate from the chord polygon and from the diatonic
brightness. It should be visible whether or not the tonic is currently a chord
tone.

**⚐ Visual priority layering — tonic must stack with chord tone, not compete.**
When the tonic note is also a chord tone, two signals converge on the same node.
Define an explicit stacking rule before implementation:

| State | Visual |
|---|---|
| Diatonic, not chord tone | Full opacity + standard fill |
| Chord tone (non-tonic) | Quality gradient fill + full opacity |
| Tonic, not chord tone | Full opacity + tonic marker (ring/border) |
| Tonic + chord tone | Quality gradient fill + tonic marker (both layers visible) |

The tonic marker is **structural and constant**; the chord tone fill is
**dynamic and contextual**. They must not collapse into a single merged style
or users lose the ability to distinguish "this is home" from "this is in the
chord".

**◆ Visual dominance order:** When multiple signals converge on the same node, implementation must resolve by this explicit hierarchy:

1. **Tonic marker** — structural anchor; always rendered regardless of other state
2. **Chord tone fill** — active harmonic context; dynamic
3. **Diatonic opacity** — background classification; persistent but lowest priority

Without an explicit order, CSS implementation will drift and the stacking table becomes advisory only.

This applies to the main circle and, by extension, chord thumbnails.

---

### Issue E12-06 — Persist Key Context in Session Snapshot

`HarmonySnapshot` already has a `scaleContext` field and `importSnapshot`
already restores it. Ensure `KeyContextPanel` is the single write path to that
field so that JSON export/import round-trips the correct key, not a
chord-coupled artifact.

---

## ⚑ Cross-Cutting: Enharmonic Consistency

Roman numeral labels and the `KeyContextPanel` root selector must use the same
enharmonic preference as the rest of the app (global flat/sharp toggle). In F
major, `♭VII` should display as "E♭", not "D#". The existing `useEnharmonic`
hook and `pitchClasses` arrays should be the single source of truth for all
label rendering in this epic.

**⚐ Deeper implication:** Roman numerals, chord labels, and the key selector
now form a **closed notation system** — any inconsistency will read as a bug,
not a nuance. Be especially careful with ♯IV vs ♭V decisions and modal contexts
where "correct" spelling is genuinely ambiguous. The current design (global
preference) is the right starting point, but the architecture should not
preclude context-aware enharmonic spelling in a future epic.

---

## ◆ Graph-Theoretic Foundations (Notes for Future Contributors)

These are conceptual underpinnings of the key context system — not E12 implementation requirements, but documented here to prevent architectural drift.

**Key context as a non-destructive layer.** The pitch-class graph (chromatic circle, chord graph) is the base space. Key context (root + mode) is an interpretive fiber attached to that space without modifying it. Interpretation functions — Roman numeral, diatonicity, harmonic function — are mappings from the base graph into key-relative equivalence classes. The base graph is never mutated by key context.

**Scale as induced subgraph.** A scale is a subset of pitch classes; a chord is also a subset. This gives a clean formal definition:

- `scaleGraph` = induced subgraph of the chromatic graph restricted to diatonic indices
- A *diatonic chord* is one whose pitch-class set is fully contained in `scaleGraph`
- A *chromatic chord* is partially or wholly outside `scaleGraph`

This framing gives future epics a natural way to compute "distance from scale" and "chromatic tension" using the existing metric graph infrastructure (`chordDistance`).

**Roman numerals as a quotient mapping.** `getRomanNumeral` collapses the 12-node chord graph to 7 equivalence classes under a declared key (Z₇). Future harmonic flow analysis can operate at this quotient level — modeling ii → V → I as directed flow through equivalence classes rather than raw pitch-class adjacency.

**Future edge weight augmentation.** `chordDistance` is currently key-independent (pure pitch-class geometry). A later epic may augment it:

```ts
// Future: chordDistance may be augmented by key-context penalties
// edge weight = chordDistance + contextualPenalty(chord, key)
```

Contributors should not bake key-independence assumptions into the distance API.

---

## Non-Goals for Epic 12

- **Key detection / auto-inference** from chord content — too speculative.
- **Multi-key / modulation tracking** — single key context is sufficient.
- **Backend changes** — all of this is frontend state + display logic.
- **Quartal scale support** — existing 8 modes are sufficient.
- **Scale degree constraints** (locking to only diatonic chords) — inform, never restrict.
- **Secondary dominant analysis** (V/V, V/ii, etc.) — scoped to a future issue; hook only in E12-03.
- **Jazz Roman numeral extensions** (Imaj7, ii7) — deferred; classical style only in v1.
- **Context-aware enharmonic spelling** — post-E12; global preference is sufficient for v1.

---

## Files Expected to be Modified

| File | Change |
|---|---|
| `features/scale/components/ScalePlaceholder.tsx` → `KeyContextPanel.tsx` | Replace empty fragment with root + mode selectors + tonic-snap (secondary affordance) |
| `features/scale/index.ts` | Re-export `KeyContextPanel` |
| `app/App.tsx` | Wire `KeyContextPanel`; remove chord-coupled key write; fix startup to C major + diatonic chord |
| `features/chord/utils/selectRandomDiatonicStartupChord.ts` | Always use `major` and C as startup key; random chord must be diatonic to C major |
| `features/chromatic-circle/hooks/useChordState.ts` | Remove `onKeyScaleChange` auto-fire on chord root change |
| `features/chromatic-circle/components/ChromaticCircle.tsx` | Tonic node visual emphasis (E12-05) |
| `features/current-chord/components/CurrentChordPanel.tsx` | Add Roman numeral label + ⚐ "Set as tonic" button (primary tonic-snap affordance) |
| `features/current-chord/utils/romanNumeral.ts` | New util — returns `RomanNumeralAnalysis` struct |
| `features/chord/components/ChordGrid.tsx` | Accept `diatonicIndices` prop; in-key indicator (not suppression) |
| `shared/types/HarmonySnapshot.ts` | Confirm `scaleContext` always written from `KeyContextPanel` |

---

## Open Questions for Ideation

1. **Where does `KeyContextPanel` live in the layout?**
   - In the `AppHeader` alongside Retro / Flats toggles
   - Above or below the chromatic circle panel
   - As a dedicated "Key" section in the header between the checkboxes and the action buttons

2. **Tonic-snap affordance placement:** ⚐ The primary affordance belongs in
   `CurrentChordPanel` ("Set as tonic" button near the chord name), because
   that is where the user's attention is when they decide they like a chord.
   `KeyContextPanel` should carry a secondary affordance. The two are
   intentionally redundant — the action is semantically tied to the chord,
   not the settings panel.

3. **Tonic node visual treatment:** A stronger border? A distinct inner ring?
   A subtle glow? Must be visually distinct from both the quality gradient fill
   (chord tone) and standard diatonic brightness, *and* must layer cleanly when
   the tonic is also a chord tone (see Issue E12-05 stacking table).

4. **Chord grid in-key indicator:** A dot below the chord name, a colored
   underline, or a faint background swatch? Must not use opacity-as-signal
   (already used on the circle for a different semantic). Must be accompanied
   by a legend or tooltip for discoverability.

5. **⚐ Mode label display:** Use plain mode names ("Dorian") or
   parenthetical aliases where relevant: "Major (Ionian)", "Minor (Aeolian)",
   then bare names for the remaining modes. This reduces friction for users
   who think in major/minor rather than modal theory, without changing the
   underlying model.
