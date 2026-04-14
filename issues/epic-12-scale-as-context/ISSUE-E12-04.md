# ISSUE-E12-04 — Diatonic Chord Categorization in Chord Grid

## Objective

Add a diatonic indicator to `ChordGrid` cells identifying which chords are in
the declared key. Non-diatonic chords receive **no negative treatment** — the
indicator is additive only.

## Background

The chord grid presents all chords at equal visual weight regardless of the
active key. Adding diatonic markers closes the feedback loop: the chromatic
circle signals which *notes* are in key; the chord grid signals which *chords*
are in key.

These two signals are intentionally different in metaphor:

- **Circle:** pitch-level opacity — bright/dim individual notes
- **Grid:** harmonic-level positive marker — chord is diatonic or not

Applying opacity to the grid would semantically overload a visual channel
already used for pitch classification. The grid indicator must instead be
additive, accessible, and recognizable at a casual glance — not just legible
to theory-literate users.

## Visual Specification

### In-key indicator

- A **filled dot** (●) at a consistent sub-position within the cell (e.g.,
  top-right corner or immediately below the chord name label)
- **Not color-only** — the indicator must be distinguishable without relying
  on hue alone; use shape + position as primary signal
- Must pass a "3-second peripheral glance" test: legible without focused
  attention on an individual cell
- Must remain visible against the chord's own quality-color styling

### Non-diatonic cells

- No dimming, no opacity reduction, no negative treatment
- Visual weight identical to current rendering

### Legend / discoverability

A legend entry or tooltip explaining the indicator (e.g. "● = diatonic to
active key") must be accessible before users need to look it up. The indicator
alone must not require prior theory knowledge — discoverability is a first-
class requirement, not an afterthought.

## Interface Change

```ts
// New prop on ChordGrid:
diatonicRoots: Set<number>  // pitch classes (0–11) that are diatonic to the current key

// Derived per cell inside ChordGrid:
const isDiatonic = diatonicRoots.has(cellPitchClass);
```

**Definition used here:** a chord root is diatonic if its pitch class is
contained in `getDiatonicIndices(keyRoot, keyScale)`. This is the "root
diatonic" definition — not "all chord tones diatonic." A stricter definition
may be considered in a future issue.

## Files To Edit

| File | Change |
|---|---|
| `client/src/features/chord/components/ChordGrid.tsx` | Accept `diatonicRoots: Set<number>` prop; render dot for diatonic cells; include legend or tooltip |
| Caller of `ChordGrid` | Pass `new Set(getDiatonicIndices(keyRoot, keyScale))` as `diatonicRoots` |

## Acceptance Criteria

- In C major context: cells for C, D, E, F, G, A, B show the filled dot
- In C major context: cells for C#, D#, F#, G#, A# do not show the dot
- The dot is visible regardless of the chord's quality color
- The dot is accessible without color as the sole differentiator
- A legend entry or tooltip explains the meaning of the dot
- Non-diatonic chords are not dimmed or visually deprioritized
- `diatonicRoots` updates when `keyRoot` or `keyScale` changes

## Verification Commands

```bash
cd client
npm run lint
npm run build
```
