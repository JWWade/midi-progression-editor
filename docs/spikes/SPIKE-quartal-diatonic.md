# SPIKE: Diatonic Quartal Chord Support

## Overview

This document covers the investigation, design decisions, and implementation plan for adding **diatonic quartal chord** support to the Parametric MIDI Sequencer.

Diatonic quartal chords are built by stacking diatonic fourths above each scale degree. For a 7-note scale `S`, the triad on degree `i` is `S[i], S[i+3], S[i+6]` (indices mod 7). This is distinct from strict perfect-fourth stacking (every +5 semitones): diatonic stacking may produce augmented fourths when the scale spelling demands it.

---

## 1. Formal Definition and Algorithm

**Definition (diatonic quartal triad on scale):**

Given a 7-note scale array `S[0..6]` and a scale degree index `i` (0-indexed, 0..6), the **quartal triad** on degree `i` is:

```
Q(i) = [ S[i], S[(i+3) % 7], S[(i+6) % 7] ]
```

**Properties:**
- Works for any 7-note scale (major, natural minor, modes).
- Produces diatonic quartal stacks (may include augmented fourths depending on scale).
- Extendable to larger stacks: for `n` voices, take `S[(i + k*3) % 7]` for `k = 0..(n-1)`.

**Generation pseudocode:**

```
function buildDiatonicQuartal(scaleNotes[7], degreeIndex, size = 3):
  chord = []
  for k in 0..(size-1):
    idx = (degreeIndex + k*3) % 7
    chord.append(scaleNotes[idx])
  return chord
```

**Identification pseudocode:**

```
function identifyDiatonicQuartal(scaleNotes[7], pitchSet):
  for i in 0..6:
    candidate = buildDiatonicQuartal(scaleNotes, i, size=3)
    if set(candidate) == set(pitchSet):
      return { root: candidate[0], degree: i+1, size: 3, match: exact }
  // optionally return best partial match or confidence score
  return null
```

---

## 2. Example Outputs — C Major

Scale: `[C, D, E, F, G, A, B]` = `[0, 2, 4, 5, 7, 9, 11]`

| Scale Degree | Chord Name   | Notes     | Pitch Classes | Intervals from Root   |
|--------------|--------------|-----------|---------------|-----------------------|
| 1 (I)        | C Quartal3   | C – F – B | [0, 5, 11]    | [0, +5, +11]          |
| 2 (ii)       | D Quartal3   | D – G – C | [2, 7, 0]     | [0, +5, +10]          |
| 3 (iii)      | E Quartal3   | E – A – D | [4, 9, 2]     | [0, +5, +10]          |
| 4 (IV)       | F Quartal3   | F – B – E | [5, 11, 4]    | [0, +6, +11]          |
| 5 (V)        | G Quartal3   | G – C – F | [7, 0, 5]     | [0, +5, +10]          |
| 6 (vi)       | A Quartal3   | A – D – G | [9, 2, 7]     | [0, +5, +10]          |
| 7 (vii°)     | B Quartal3   | B – E – A | [11, 4, 9]    | [0, +5, +10]          |

**Notes:**
- Pitch classes are given modulo 12 with C = 0.
- Intervals are semitone offsets measured from the chord root (first element).
- The F → B interval is +6 semitones (an augmented fourth) because the diatonic fourth from F in C major is B natural. This is expected in diatonic quartal stacking — some steps are P4 (5 semitones), some A4 (6 semitones) depending on the scale.
- Several chords share the pattern [0, +5, +10] due to transposition symmetry.

---

## 3. DTO and OpenAPI Sketches

### QuartalChordDto (C# — backend)

```csharp
public class QuartalChordDto
{
    [JsonPropertyName("root")]
    public string Root { get; init; } = string.Empty;

    [JsonPropertyName("quality")]
    public string Quality { get; init; } = "Quartal";

    [JsonPropertyName("displayName")]
    public string DisplayName { get; init; } = string.Empty;

    [JsonPropertyName("pitchClasses")]
    public int[] PitchClasses { get; init; } = [];

    [JsonPropertyName("noteNames")]
    public string[] NoteNames { get; init; } = [];

    [JsonPropertyName("quartal")]
    public QuartalMetadata Quartal { get; init; } = new();
}

public class QuartalMetadata
{
    [JsonPropertyName("isDiatonic")]
    public bool IsDiatonic { get; init; } = true;

    [JsonPropertyName("scaleRoot")]
    public string ScaleRoot { get; init; } = string.Empty;

    [JsonPropertyName("scaleType")]
    public string ScaleType { get; init; } = string.Empty;

    [JsonPropertyName("degree")]
    public int Degree { get; init; }

    [JsonPropertyName("size")]
    public int Size { get; init; } = 3;
}
```

### ChordDto TypeScript type extension

```typescript
type QuartalMetadata = {
  isDiatonic: boolean;    // true for diatonic quartal approach
  scaleRoot?: string;     // e.g., "C"
  scaleType?: string;     // e.g., "Major"
  degree?: number;        // 1..7
  size?: number;          // 3, 4, ...
};

type QuartalChordDto = {
  root: string;            // e.g., "C"
  quality: "Quartal";
  displayName: string;     // e.g., "C Quartal3 (I)"
  pitchClasses: number[];  // [0, 5, 11]
  noteNames: string[];     // ["C", "F", "B"]
  quartal: QuartalMetadata;
};
```

### API Request DTO

```typescript
// POST /Chord/quartal/from-scale?note=C
type DiatonicQuartalRequestDto = {
  scaleType: ScaleType;  // "Major", "NaturalMinor", etc.
  degree: number;        // 1..7
  size?: number;         // default: 3
};
```

### OpenAPI path sketch

```yaml
/Chord/quartal/from-scale:
  post:
    tags: [Chord]
    summary: "Build a diatonic quartal chord from a scale root, scale type, and degree."
    parameters:
      - name: note
        in: query
        schema:
          $ref: "#/components/schemas/Note"
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/DiatonicQuartalRequestDto"
    responses:
      "200":
        description: OK
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/QuartalChordDto"
      "400":
        description: Bad Request
```

---

## 4. Frontend Rendering Notes

### Chord Type

A generic `"quartal"` chord type is added to the `ChordType` union in `client/src/features/chord/types/index.ts`. This type uses perfect-fourth stacking (`[0, 5, 10]`) for canonical rendering on the chromatic circle.

**Why `[0, 5, 10]` for generic rendering?**
All 7 diatonic quartal triads contain at least two perfect fourths (5-semitone intervals). Using `[0, 5, 10]` gives a consistent, recognizable triangle shape for the quality icon and chord selector without needing scale context.

### Chromatic Circle Polygon

- **Shape:** Triangle (3 vertices) — same class as major/minor/dim/aug.
- **Vertex positions on circle:** Notes at indices 0, 5, and 10 form a nearly equilateral triangle rotated slightly from the augmented triad triangle (`[0, 4, 8]`).
- The `calculatePolygonPoints` function already supports variable vertex counts — no changes needed.

### Color Family

Quartal chords receive a **cyan-green** hue (approximately HSL 175°) to distinguish them from all existing quality colors:

| Quality  | Hue  | Character                    |
|----------|------|------------------------------|
| major    | 45°  | Amber / gold                 |
| minor    | 230° | Blue / indigo                |
| dim      | 340° | Burgundy                     |
| aug      | 168° | Teal                         |
| quartal  | 175° | Cyan-green — open, suspended |
| maj7     | 50°  | Gold-yellow                  |
| min7     | 240° | Deep blue                    |
| dom7     | 15°  | Red-orange                   |
| halfdim7 | 280° | Muted purple                 |

### Quality Icon Glyph

The quartal quality icon uses the glyph `"4"` (indicating fourth-based stacking) rendered at the polygon centroid, matching the established glyph pattern for other quality icons.

### Chord Name Suffix

`"quartal"` uses the suffix `"q"` in chord name strings (e.g., `"Cq"`, `"Dq"`). This is consistent with the existing compact suffix convention.

### ChordComplexity Tier

The quartal type falls into the `"triad"` complexity tier (same as major/minor/dim/aug) since it is a 3-note chord.

---

## 5. Test Cases

### Unit test vectors for generation in C major

```typescript
// Scale: C major = [0, 2, 4, 5, 7, 9, 11]
const C_MAJOR = [0, 2, 4, 5, 7, 9, 11];

buildDiatonicQuartal(C_MAJOR, 0) // => [0, 5, 11] — C, F, B
buildDiatonicQuartal(C_MAJOR, 1) // => [2, 7, 0]  — D, G, C
buildDiatonicQuartal(C_MAJOR, 2) // => [4, 9, 2]  — E, A, D
buildDiatonicQuartal(C_MAJOR, 3) // => [5, 11, 4] — F, B, E
buildDiatonicQuartal(C_MAJOR, 4) // => [7, 0, 5]  — G, C, F
buildDiatonicQuartal(C_MAJOR, 5) // => [9, 2, 7]  — A, D, G
buildDiatonicQuartal(C_MAJOR, 6) // => [11, 4, 9] — B, E, A
```

### Unit test vectors for identification in C major

```typescript
identifyDiatonicQuartal(C_MAJOR, [0, 5, 11])  // => { degree: 1, root: "C" }
identifyDiatonicQuartal(C_MAJOR, [2, 7, 0])   // => { degree: 2, root: "D" }
identifyDiatonicQuartal(C_MAJOR, [4, 9, 2])   // => { degree: 3, root: "E" }
identifyDiatonicQuartal(C_MAJOR, [5, 11, 4])  // => { degree: 4, root: "F" }
identifyDiatonicQuartal(C_MAJOR, [7, 0, 5])   // => { degree: 5, root: "G" }
identifyDiatonicQuartal(C_MAJOR, [9, 2, 7])   // => { degree: 6, root: "A" }
identifyDiatonicQuartal(C_MAJOR, [11, 4, 9])  // => { degree: 7, root: "B" }
identifyDiatonicQuartal(C_MAJOR, [0, 4, 7])   // => null (C major triad, not quartal)
```

### API endpoint test vectors

```http
POST /Chord/quartal/from-scale?note=C
Content-Type: application/json

{ "scaleType": "Major", "degree": 1, "size": 3 }

HTTP/1.1 200 OK
{
  "root": "C",
  "quality": "Quartal",
  "displayName": "C Quartal3 (I)",
  "pitchClasses": [0, 5, 11],
  "noteNames": ["C", "F", "B"],
  "quartal": {
    "isDiatonic": true,
    "scaleRoot": "C",
    "scaleType": "Major",
    "degree": 1,
    "size": 3
  }
}
```

---

## 6. Follow-up Issues

The following issues are recommended as follow-up work, in priority order:

| # | Title | Service/Layer | Estimate |
|---|-------|---------------|----------|
| 1 | `POST /Chord/quartal/from-scale` endpoint + `QuartalChordGenerator` | Backend — `ChordController`, new `QuartalChordGenerator` | 2 SP |
| 2 | Add `"quartal"` ChordType, intervals, colors, shapes to frontend | Frontend — chord types, transpose, colors, geometry | 2 SP |
| 3 | `identifyDiatonicQuartal` service on backend | Backend — new `QuartalChordIdentifier` | 1 SP |
| 4 | Chromatic-circle polygon rendering for quartal chords | Frontend — `ChromaticCircle.tsx`, chord-animation | 1 SP |
| 5 | Chord selector UI — add quartal as a selectable quality | Frontend — `ChordGrid`, `ChordSelector`, `ChordQualityIcon` | 1 SP |
| 6 | Progression analyzer support for quartal chords | Backend — `ProgressionAnalyzer` (pitch-class resolution) | 1 SP |
| 7 | Unit tests for `QuartalChordGenerator` + `QuartalChordIdentifier` | Backend — xUnit | 1 SP |
| 8 | Frontend component tests for quartal rendering | Frontend — Vitest / RTL | 1 SP |

**Total estimate: ~10 story points**

---

## 7. Recommendation

**Recommended approach:** Implement diatonic quartal support as a first-class chord type alongside the existing tertian types. Use the diatonic algorithm (`Q(i) = [S[i], S[(i+3)%7], S[(i+6)%7]]`) for generation and identification, backed by a dedicated `POST /Chord/quartal/from-scale` endpoint.

**Key decision:** Add `"quartal"` to the frontend `ChordType` union with canonical intervals `[0, 5, 10]` (P4+P4) for rendering purposes. Scale-aware generation is delegated to the backend API.

**Non-breaking strategy:** The new endpoint and DTO are additive. No existing endpoint or type is modified. The only breaking change is the addition of `"quartal"` to the `ChordType` union, which requires exhaustive-record updates in `ChordQualityColors`, `CHORD_SHAPES`, `CHORD_INTERVALS`, and `ChordQualityIcon` — all of which are covered in the implementation.

**Rough story points:** 10 SP total (see table above), achievable in a single sprint.
