# Geometric Harmony System — Reference

This document is the authoritative reference for every model, formula, and
constant that underpins the visual and harmonic logic of the Parametric MIDI
Sequencer. It is structured so that a developer can answer "where does this
number/color/shape come from?" without reading source code.

---

## Table of Contents

1. [Coordinate System](#1-coordinate-system)
2. [Pitch-Class Index Convention](#2-pitch-class-index-convention)
3. [Chord Interval Tables](#3-chord-interval-tables)
4. [Scale Interval Tables](#4-scale-interval-tables)
5. [Polygon Geometry](#5-polygon-geometry)
6. [Color Language Schema](#6-color-language-schema)
7. [Opacity Model](#7-opacity-model)
8. [Animation & Morphing Rules](#8-animation--morphing-rules)
9. [Voice-Leading Formulas](#9-voice-leading-formulas)
10. [Primitive Shape Presets](#10-primitive-shape-presets)
11. [ii–V Bridge Suggestions](#11-iiv-bridge-suggestions)
12. [Where to Find Each Constant in Code](#12-where-to-find-each-constant-in-code)

---

## 1. Coordinate System

The chromatic circle is rendered inside a **square SVG viewport** whose side
length (`VIEWBOX_SIZE`) is **300 px**. All geometry is computed in this
coordinate space.

| Constant | Value | Description |
|---|---|---|
| `VIEWBOX_SIZE` | 300 | SVG coordinate-space side length (px) |
| `CENTER` | 150 | Centre of the viewport (= `VIEWBOX_SIZE / 2`) |
| `RING_RADIUS` | 110 | Radius of the main chromatic note ring (px) |
| `LABEL_DISTANCE` | 152 | Distance from centre to outer note-name labels (`RING_RADIUS + 42`) |
| `NODE_RADIUS` | 12 | Radius of each note-node circle (px) |
| `CIRCLE_PADDING` | 16 | Horizontal padding inside the SVG container (px) |

**Note 0 (C) sits at the 12 o'clock position.** Notes advance clockwise in
semitone order (C→C♯→D→…→B), each separated by 30° (= 360° / 12).

---

## 2. Pitch-Class Index Convention

| Index | Note (sharp) | Note (flat) |
|---|---|---|
| 0 | C | C |
| 1 | C♯ | D♭ |
| 2 | D | D |
| 3 | D♯ | E♭ |
| 4 | E | E |
| 5 | F | F |
| 6 | F♯ | G♭ |
| 7 | G | G |
| 8 | G♯ | A♭ |
| 9 | A | A |
| 10 | A♯ | B♭ |
| 11 | B | B |

The active notation (sharp or flat) is controlled globally by
`EnharmonicProvider` (`useFlats` boolean). All pitch-class arrays in the
codebase use these 0–11 indices regardless of notation.

---

## 3. Chord Interval Tables

Every `ChordType` maps to a fixed array of **semitone intervals above the
root**. Applying `(interval + root) % 12` to each entry gives the pitch-class
indices for the chord.

### Tertian Chords

| ChordType | Intervals | Voices | Shape |
|---|---|---|---|
| `major` | [0, 4, 7] | 3 | triangle |
| `minor` | [0, 3, 7] | 3 | triangle |
| `dim` | [0, 3, 6] | 3 | triangle |
| `aug` | [0, 4, 8] | 3 | triangle |
| `dom7` | [0, 4, 7, 10] | 4 | quadrilateral |
| `maj7` | [0, 4, 7, 11] | 4 | quadrilateral |
| `min7` | [0, 3, 7, 10] | 4 | quadrilateral |
| `halfdim7` | [0, 3, 6, 10] | 4 | quadrilateral |

### Quartal Chord

| ChordType | Intervals | Voices | Shape |
|---|---|---|---|
| `quartal` | [0, 5, 10] | 3 | triangle |

The quartal type represents a *perfect-fourth triad* (stacked fourths: 5 + 5
semitones). Diatonic quartal chords (which may include augmented fourths) are
built and identified by `QuartalChordGenerator` on the backend and
`buildDiatonicQuartal` in the spike documentation.

### Chord Roles

Each voice is assigned a role label used in the `ToneInfoPanel`:

| Voice index | Role |
|---|---|
| 0 | root |
| 1 | third |
| 2 | fifth |
| 3 | seventh |

Source: `client/src/features/chord/utils/transpose.ts`

---

## 4. Scale Interval Tables

All eight supported modes store their interval pattern (semitones from root)
in `SCALE_INTERVALS`. Applying `(interval + root) % 12` to each entry
produces the 7 diatonic pitch-class indices.

| ScaleType | Intervals (semitones from root) |
|---|---|
| `major` | [0, 2, 4, 5, 7, 9, 11] |
| `naturalMinor` | [0, 2, 3, 5, 7, 8, 10] |
| `harmonicMinor` | [0, 2, 3, 5, 7, 8, 11] |
| `melodicMinor` | [0, 2, 3, 5, 7, 9, 11] |
| `dorian` | [0, 2, 3, 5, 7, 9, 10] |
| `phrygian` | [0, 1, 3, 5, 7, 8, 10] |
| `lydian` | [0, 2, 4, 6, 7, 9, 11] |
| `mixolydian` | [0, 2, 4, 5, 7, 9, 10] |

Source: `client/src/features/scale/types/scales.ts`

---

## 5. Polygon Geometry

### Vertex Calculation

Given a set of pitch-class indices for a chord, `calculatePolygonPoints`
maps each index to a 2-D point on the chromatic ring:

```
angle  = (noteIndex / 12) × 2π          — clockwise from 12 o'clock
x      = cx + circleRadius × sin(angle)
y      = cy − circleRadius × cos(angle)
```

`circleRadius` is typically `RING_RADIUS` (110 px) and the centre `(cx, cy)`
is `(CENTER, CENTER)` = `(150, 150)`.

Source: `client/src/features/chromatic-circle/utils/geometry.ts`

### ChordType → Shape Mapping

`CHORD_SHAPES` provides the lookup used for rendering and morphing:

| ChordType | ChordShape |
|---|---|
| `major` | `"triangle"` |
| `minor` | `"triangle"` |
| `dim` | `"triangle"` |
| `aug` | `"triangle"` |
| `quartal` | `"triangle"` |
| `dom7` | `"quadrilateral"` |
| `maj7` | `"quadrilateral"` |
| `min7` | `"quadrilateral"` |
| `halfdim7` | `"quadrilateral"` |

Source: `client/src/features/chromatic-circle/utils/geometry.ts`

### Centroid

The centroid marker is the arithmetic mean of all vertex coordinates:

```
cx = Σ xᵢ / n
cy = Σ yᵢ / n
```

For a regular polygon this coincides with the geometric centre.

Source: `client/src/features/chord-geometry/utils/centroid.ts`

---

## 6. Color Language Schema

### `ChordQualityColor` Fields

Every `ChordType` maps to a `ChordQualityColor` object with six HSL fields:

| Field | Usage | Alpha |
|---|---|---|
| `base` | Note-node fills, polygon strokes, buttons | 1.0 (solid) |
| `fill` | Polygon interior fill | 0.12 (semi-transparent) |
| `light` | Panel/surface backgrounds, ambient circle tint | 1.0 |
| `dark` | Text on light-tinted backgrounds | 1.0 |
| `deeper` | Seventh-chord intensity (Tier 2) | 1.0 |
| `richest` | Extended-chord intensity (Tier 3) | 1.0 |

`fill` is derived from `base` by converting `hsl(…)` to `hsla(…, 0.12)`.

Source: `client/src/features/chord/constants/chordQualityColors.ts`

### Color Table

| ChordType | Hue family | `base` | `deeper` | `richest` |
|---|---|---|---|---|
| `major` | Amber / gold | `hsl(45, 80%, 50%)` | `hsl(45, 90%, 43%)` | `hsl(45, 95%, 36%)` |
| `minor` | Blue / indigo | `hsl(230, 65%, 50%)` | `hsl(230, 80%, 43%)` | `hsl(230, 92%, 36%)` |
| `dim` | Burgundy | `hsl(340, 50%, 44%)` | `hsl(340, 65%, 37%)` | `hsl(340, 78%, 30%)` |
| `aug` | Teal | `hsl(168, 65%, 40%)` | `hsl(168, 78%, 33%)` | `hsl(168, 88%, 26%)` |
| `dom7` | Red-orange | `hsl(15, 85%, 52%)` | `hsl(15, 95%, 45%)` | `hsl(15, 95%, 38%)` |
| `maj7` | Gold-yellow | `hsl(50, 70%, 52%)` | `hsl(50, 85%, 45%)` | `hsl(50, 95%, 38%)` |
| `min7` | Deep blue | `hsl(240, 60%, 52%)` | `hsl(240, 75%, 45%)` | `hsl(240, 88%, 38%)` |
| `halfdim7` | Muted purple | `hsl(280, 50%, 48%)` | `hsl(280, 65%, 41%)` | `hsl(280, 78%, 34%)` |
| `quartal` | Cyan-green | `hsl(175, 65%, 40%)` | `hsl(175, 78%, 33%)` | `hsl(175, 88%, 26%)` |

### Complexity Tiers

`ChordComplexity` controls which color field is used for rendering:

| Tier | Condition | Color field |
|---|---|---|
| `"triad"` | Quality is not in `SEVENTH_CHORD_TYPES` and no extensions | `base` |
| `"seventh"` | Quality is in `SEVENTH_CHORD_TYPES`, no 9th/11th/13th extensions | `deeper` |
| `"extended"` | Any extension contains the string `"9"`, `"11"`, or `"13"` | `richest` |

`SEVENTH_CHORD_TYPES` = `{ maj7, min7, dom7, halfdim7 }`.

Source: `client/src/features/color-language/utils/chordColorUtils.ts`

### Ambient Circle Tint

`getCircleColor(root, quality, surface)` returns a background tint:

- **Light theme**: returns `ChordColors[quality].light` directly.
- **Dark theme — circle surface**: `hsla(H, min(S, 36)%, 20%, 0.58)`.
- **Dark theme — panel surface**: `hsl(H, min(S, 24)%, 17%)`.

The `root` parameter is accepted for API compatibility but currently unused.

Source: `client/src/features/chromatic-circle/utils/circleColors.ts`

---

## 7. Opacity Model

Note-node opacity is determined by whether a note is diatonic to the current
scale and whether it is a chord tone. Four cases:

| Note is diatonic | Note is chord tone | Light-theme opacity | Dark-theme opacity |
|---|---|---|---|
| ✅ yes | any | 1.0 (`DIATONIC_OPACITY`) | 1.0 |
| ❌ no | ✅ yes | 0.7 (`CHORD_TONE_CHROMATIC_OPACITY`) | 0.84 |
| ❌ no | ❌ no | 0.3 (`CHROMATIC_OPACITY`) | 0.55 |

The diatonic check is `diatonicIndices.has(noteIndex)`, where
`diatonicIndices` is computed by `getDiatonicIndices(root, mode)`.

Source:
- Constants: `client/src/features/chromatic-circle/utils/scaleUtils.ts`
- Dark-theme variants and decision function: `client/src/features/color-language/utils/harmonyOpacity.ts`

---

## 8. Animation & Morphing Rules

### Easing

All chord-to-chord polygon transitions use **easeInOutCubic**:

```
t < 0.5 → 4t³
t ≥ 0.5 → 1 − (−2t + 2)³ / 2
```

### Duration

Default animation duration: **260 ms** (`DEFAULT_MORPH_DURATION_MS`).

### Point Interpolation

Each vertex is linearly interpolated between its "from" and "to" positions:

```
xᵢ(t) = fromXᵢ + (toXᵢ − fromXᵢ) × easedProgress
yᵢ(t) = fromYᵢ + (toYᵢ − fromYᵢ) × easedProgress
```

Source: `client/src/features/chord-morphing/utils/morphing.ts`

### Snap Rule (Vertex Count Change)

When transitioning between shapes with **different vertex counts** (e.g.
triangle ↔ quadrilateral), the animation **snaps immediately to the
destination** rather than interpolating, avoiding geometrically invalid
intermediate shapes.

### Overlapping Change Handling (Option A)

If a new chord arrives while an animation is still in progress, the running
animation is cancelled and a **new animation starts immediately from the
last rendered position** — not from the original "from" position.

Source: `client/src/features/chord-animation/hooks/useChordMorphing.ts`

---

## 9. Voice-Leading Formulas

### MIDI Note Formula

```
midiNote = 12 × (octave + 1) + pitchClass
```

Examples: C4 = 12 × 5 + 0 = 60; E4 = 12 × 5 + 4 = 64.

This formula is consistent across `audioUtils.ts`, `voicing.ts`, and
`midiBuilder.ts`.

### Close Voicing (`closeVoiceChord`)

Places the root at `startOctave` (default 4), then places each subsequent
voice at the **lowest MIDI number ≥ the previous voice** that has the correct
pitch class:

```
k = ⌈(prevMidi − pitchClass) / 12⌉
midi = 12 × k + pitchClass
```

### Minimal-Motion Voicing (`minimalMotionVoicing`)

Each voice independently selects the octave placement **closest to its
previous MIDI note**. Tie-break: prefer the lower MIDI number.

```
k    = round((prev − pitchClass) / 12)
base = 12 × k + pitchClass
best = argmin_{c ∈ {base−12, base, base+12}} |c − prev|
                                              (lower wins on tie)
```

For voices that are new (e.g. adding a 7th to a triad), the last voice of
the previous chord is used as the anchor.

Source: `client/src/features/voice-leading/utils/voicing.ts`

---

## 10. Primitive Shape Presets

The `current-chord` feature supports four geometry-first chord presets (type
`PrimitiveShape`). These are anchored to a root note and generate pitch-class
sets that do not necessarily correspond to named tertian chords:

| PrimitiveShape | Intervals | Description |
|---|---|---|
| `"equilateral-triangle"` | [0, 4, 8] | Augmented triad; equally-spaced vertices |
| `"suspended-triangle"` | [0, 5, 7] | Sus4 voicing; non-equilateral triangle |
| `"square"` | [0, 3, 6, 9] | Fully diminished seventh; four equal segments |
| `"rectangle"` | [0, 4, 6, 10] | Dom7♭5 spacing; opposite pairs equal |
| `"symmetrical-trapezoid"` | [0, 4, 7, 11] | Major 7 voicing; symmetrical trapezoid shape |

Source: `client/src/features/chord/utils/transpose.ts`,
`client/src/features/current-chord/types/index.ts`

---

## 11. ii–V Bridge Suggestions

`suggestBridges(request)` generates a ranked list of harmonic bridges
between two chords in the progression. Each `BridgeSuggestion` has:

| Field | Type | Description |
|---|---|---|
| `bridge` | `Chord[]` | Ordered chords to insert between source and target |
| `score` | `number` | Normalized 0–1 quality score (higher = better) |
| `type` | `BridgeType` | Classified bridge pattern (see table below) |
| `label` | `string` | Short human-readable label (root indices, no enharmonic) |
| `explanation` | `string` | Longer harmonic description (root indices) |

### Bridge Types

| BridgeType | Description |
|---|---|
| `"diatonic-ii-v"` | Standard ii7–V7 into the target root |
| `"tritone-sub-ii-v"` | ii7–♭II7 (tritone substitution of V7) |
| `"chromatic-ii-v"` | Half-step-above ii–V approach |
| `"incomplete-ii"` | ii chord only |
| `"incomplete-v"` | V chord only |
| `"tritone-sub"` | ♭II7 tritone substitution only |
| `"backchain-vi-ii-v"` | vi–ii–V backchain |
| `"backchain-iii-vi-ii-v"` | iii–vi–ii–V extended backchain |

Enharmonic note names are intentionally deferred to render time; the
`label` and `explanation` fields use raw root indices.

Source: `client/src/features/ii-v-suggestions/`

---

## 12. Where to Find Each Constant in Code

| Topic | Authoritative File |
|---|---|
| SVG layout constants | `client/src/features/chromatic-circle/constants/visualConstants.ts` |
| Polygon vertex formula | `client/src/features/chromatic-circle/utils/geometry.ts` |
| Centroid formula | `client/src/features/chord-geometry/utils/centroid.ts` |
| Chord intervals (`CHORD_INTERVALS`) | `client/src/features/chord/utils/transpose.ts` |
| Scale intervals (`SCALE_INTERVALS`) | `client/src/features/scale/types/scales.ts` |
| ChordType and ChordRole types | `client/src/features/chord/types/index.ts` |
| ChordQualityColor schema & values | `client/src/features/chord/constants/chordQualityColors.ts` |
| Color re-export (`ChordColors`) | `client/src/features/color-language/constants/chordColors.ts` |
| Complexity tiers & color selectors | `client/src/features/color-language/utils/chordColorUtils.ts` |
| Opacity constants & `getHarmonyOpacity` | `client/src/features/color-language/utils/harmonyOpacity.ts` |
| `DIATONIC_OPACITY`, `CHROMATIC_OPACITY` | `client/src/features/chromatic-circle/utils/scaleUtils.ts` |
| `getDiatonicIndices` | `client/src/features/scale/utils/scaleUtils.ts` |
| Ambient circle tint | `client/src/features/chromatic-circle/utils/circleColors.ts` |
| `morphPoints`, `interpolateColor` | `client/src/features/chord-morphing/utils/morphing.ts` |
| `useChordMorphing` animation hook | `client/src/features/chord-animation/hooks/useChordMorphing.ts` |
| MIDI note formula & voice-leading | `client/src/features/voice-leading/utils/voicing.ts` |
| Primitive shape presets | `client/src/features/chord/utils/transpose.ts` |
| ii–V bridge suggestions | `client/src/features/ii-v-suggestions/` |

---

**Last Updated**: March 21, 2026
