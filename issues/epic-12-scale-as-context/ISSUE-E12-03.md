# ISSUE-E12-03 — Roman Numeral Display in Current Chord Panel

## Objective

Add a Roman numeral label to `CurrentChordPanel` showing the active chord's
scale degree relative to the declared key (e.g. `I`, `vi`, `♭VII`). Add a
primary "Set as tonic" tonic-snap affordance to the same panel.

## Background

Without Roman numerals, a declared key has no visible effect at the chord
level. A user who sets C major and then selects a chord has no way to read
its harmonic function. The Roman numeral is the primary user-facing output of
the key context system — the answer to "what is this chord doing?"

## Notation Rules (classical v1)

| | Diatonic | Non-diatonic |
|---|---|---|
| Examples | I, ii, iii, IV, V, vi, vii° | ♭II, ♯IV, ♭VII |
| Case | Quality of expected scale degree (major/aug = upper; minor/dim = lower) | Same rule |
| Accidental | None | **Always shown**, even if accidental note exists in the key |
| Extensions | Not shown — chord name already answers this | Not shown |

**Degree identity is primary.** Identify the scale step first; quality is
decoration. A borrowed B♭ major in C major is `♭VII` (degree VII, flatted),
not a reassigned degree.

**Non-diatonic chords must always include the accidental.** This ensures a
non-diatonic result reads as "intentionally incomplete" rather than
"quietly misleading." A D7 in C major renders `II` with `isFunctionalOutlier:
true` annotated — not as a false diatonic match.

## `romanNumeral.ts` Contract

```ts
// client/src/features/current-chord/utils/romanNumeral.ts

export interface RomanNumeralAnalysis {
  label: string;               // display string, e.g. "♭VII" or "V"
  degree: number;              // 0-based scale step (0 = tonic)
  accidental: "♭" | "♯" | null;
  isDiatonic: boolean;
  contextualWeight?: number;   // reserved: future flow-based scoring (V→I ≠ random adjacency)
  isFunctionalOutlier?: boolean; // true when non-diatonic + quality implies harmonic function (dom7 not on V)
}

export function getRomanNumeral(
  chordRoot: number,
  keyRoot: number,
  keyScale: ScaleType,
  chordQuality: ChordType,
): RomanNumeralAnalysis

// Extension point (not implemented in E12):
// export function getHarmonicFunction(chord, key): HarmonicFunction
// → secondary dominants (V/V, V/ii), borrowed chords, etc.
```

`isFunctionalOutlier` is set to `true` when `isDiatonic === false` AND the
chord quality is `"dom7"` AND the chord does not occupy scale degree V. This
is a **passive flag only** — it is not rendered in v1, but enables future
tooltips and scoring without reinvention.

`contextualWeight` is reserved and undefined in v1; it is present in the
interface to prevent future API drift when flow-based scoring is added.

## `CurrentChordPanel` Changes

- Render `analysis.label` below or alongside the chord name
- Add a **"Set as tonic"** button — the primary tonic-snap affordance:
  - Calls `setKeyContext({ root: currentChordRoot, scale: currentKeyScale, source: "tonicSnap" })`
  - Updates root only; preserves the current mode

## Files To Add

- `client/src/features/current-chord/utils/romanNumeral.ts`

## Files To Edit

| File | Change |
|---|---|
| `client/src/features/current-chord/components/CurrentChordPanel.tsx` | Display `analysis.label`; add "Set as tonic" button |

## Acceptance Criteria

| Input (C major context) | Expected `label` | `isDiatonic` | `isFunctionalOutlier` |
|---|---|---|---|
| C major | `I` | true | — |
| A minor | `vi` | true | — |
| B dim | `vii°` | true | — |
| F# minor | `♯IV` | false | false |
| D dom7 | `II` | false | true |
| E♭ major | `♭III` | false | false |

- `label` is read from `RomanNumeralAnalysis` — not constructed ad hoc in the component
- `contextualWeight` and `isFunctionalOutlier` fields exist on the returned object (may be `undefined`)
- "Set as tonic" button calls `setKeyContext` with `source: "tonicSnap"`; mode is unchanged
- Roman numeral label updates when `keyRoot` / `keyScale` changes

## Verification Commands

```bash
cd client
npm run lint
npm run build
npm test
```
