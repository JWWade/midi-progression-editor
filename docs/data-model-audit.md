# Data Model & Schema Evolution Audit

**Date:** 2026-03-21  
**Status:** Complete  
**Author:** Copilot (audit)

---

## 1. Executive Summary

This audit reviews every data model and schema in the Parametric MIDI Sequencer
codebase and evaluates them against four criteria:

1. **Stability** — Are schemas stable and internally consistent?
2. **Expressiveness** — Do they capture all musically relevant information?
3. **Flexibility** — Are they too rigid for unforeseen use cases?
4. **ML-readiness** — Are they future-proof for machine-learning workflows?

Six concrete gaps were identified and fixed as part of this audit. The
resulting models are summarised in §4.

---

## 2. Scope

| Layer | Artefacts reviewed |
|---|---|
| Frontend types | `Chord`, `ChordType`, `PrimitiveShape`, `BridgeRequest`, `BridgeSuggestion`, `ScaleType`, `ToneInfo`, `MidiExportOptions` |
| Frontend utilities | `suggestBridges`, `scoreCandidate`, `diatonicBonus` |
| Backend DTOs | `ChordRef`, `ChordDto`, `ProgressionAnalyzeRequestDto/ResponseDto`, `ProgressionStep`, `ScaleOptionsDto`, `QuartalChordDto`, `NoteInfo` |
| Backend enums | `ChordQuality`, `Note`, `ScaleType`, `PrimitiveShape` |
| Backend services | `ChordGenerator`, `ProgressionAnalyzer`, `ScaleGenerator`, `QuartalChordGenerator` |

---

## 3. Findings

### 3.1 Inline scale-context type (`mode: string`) — **FIXED**

**Location:** `BridgeRequest.contextScale`, `suggestBridges`, `scoreCandidate`,
`diatonicBonus`

**Problem:** The diatonic context type was inlined as `{ root: number; mode: string }`
across five separate function signatures. Using `string` for `mode` bypassed
compile-time validation; the real runtime narrowing was a `as ScaleType` cast
in `diatonicBonus`, which would silently skip the diatonic bonus for any
unknown mode string rather than producing a type error.

**Fix:** Extracted the canonical `ScaleContext` interface into
`client/src/shared/types/ScaleContext.ts`. `mode` is now typed as `ScaleType`
(a union of the eight supported mode strings), and all five callers have been
updated. The `as ScaleType` cast has been removed.

```typescript
// client/src/shared/types/ScaleContext.ts
export interface ScaleContext {
  root: number;     // pitch-class 0–11
  mode: ScaleType;  // typed union, not string
}
```

---

### 3.2 No versioned serialisation envelope — **FIXED**

**Location:** Throughout — no `HarmonySnapshot` type existed anywhere.

**Problem:** The progression sidebar state lived in component-local `useState`
with no exported serialisable form. There was no way to:
- persist a progression across sessions,
- export a progression as structured JSON (distinct from MIDI bytes),
- label or tag progressions for cataloging,
- feed progressions as training examples to an ML model.

Without a `schemaVersion` field, any future serialisation would be impossible
to migrate safely.

**Fix:** Added `HarmonySnapshot` to `client/src/shared/types/HarmonySnapshot.ts`:

```typescript
export interface HarmonySnapshot {
  schemaVersion: 1;           // bump only on incompatible changes
  progression: Chord[];
  scaleContext: ScaleContext | null;
  metadata: HarmonyMetadata;
}

export interface HarmonyMetadata {
  createdAt: string;   // ISO 8601
  label?: string;      // human-readable name
  tags?: string[];     // for cataloging and ML labeling
  bpm?: number;
  beatsPerChord?: number;
}
```

`createHarmonySnapshot()` is the one-call factory (sets `schemaVersion` and
`createdAt` automatically); `isHarmonySnapshot()` is the type guard for safe
deserialisation of untrusted JSON.

---

### 3.3 `NoteInfo` missing JSON property name attributes — **FIXED**

**Location:** `server/ParametricMusic.Api/Models/NoteInfo.cs`

**Problem:** Every other model class in the backend uses `[JsonPropertyName]`
attributes to guarantee stable camelCase JSON output regardless of the C#
property name. `NoteInfo` was the only exception — it relied on the default
serialiser behaviour, which could produce `Index` / `Name` (PascalCase) or
`index` / `name` (camelCase) depending on the global serialiser options.

**Fix:** Added explicit `[JsonPropertyName("index")]` and
`[JsonPropertyName("name")]` attributes, aligning `NoteInfo` with the rest of
the codebase.

---

### 3.4 `ChordRef` cannot represent custom chords — **FIXED**

**Location:** `server/ParametricMusic.Api/Models/ProgressionAnalyzeRequestDto.cs`
and `server/ParametricMusic.Api/Services/ProgressionAnalyzer.cs`

**Problem:** The frontend `Chord` type supports `customNotes?: number[]` for
chords whose pitch classes are not derivable from a named quality (e.g. a
geometry-first chord built from a `PrimitiveShape`). However, `ChordRef` had no
such field, so sending a custom chord to `/Progression/analyze` was impossible —
the backend would reject any chord with an unrecognised `quality` string.

**Fix:**
- Added `CustomNotes?: int[]` to `ChordRef` (serialised as `customNotes`,
  omitted when null).
- Updated `ProgressionAnalyzer.GetSortedPitchClasses` to use the custom notes
  directly when present, filtering out-of-range values (outside 0–11) and
  deduplicating. Falls back to root+quality derivation when `customNotes` is
  null, empty, or all-invalid.

---

### 3.5 `ProgressionAnalyzeRequestDto` carries no scale context — **FIXED**

**Location:** `server/ParametricMusic.Api/Models/ProgressionAnalyzeRequestDto.cs`

**Problem:** The analyze endpoint received only a flat chord list. There was no
way to pass scale context alongside the progression, which is needed for:
- Harmonic function labeling (tonic / subdominant / dominant),
- Diatonic vs. chromatic chord classification in the response,
- ML feature vectors that depend on key awareness.

**Fix:** Added an optional `ScaleContextDto? ScaleContext` field to
`ProgressionAnalyzeRequestDto`. The new `ScaleContextDto` model mirrors the
frontend `ScaleContext` type (root: int 0–11, mode: ScaleType enum). The field
is accepted and validated on the request but not yet consumed by the analyzer,
making this an **additive, backward-compatible** change that unblocks future
scale-aware analysis passes.

```csharp
public class ProgressionAnalyzeRequestDto
{
    public List<ChordRef> Chords { get; set; } = [];
    public ScaleContextDto? ScaleContext { get; set; }  // new
}
```

---

### 3.6 Bridge request uses loosely typed context — **FIXED** (see §3.1)

The same `{ root: number; mode: string }` issue as §3.1 applied to
`BridgeRequest.contextScale`. Fixed as part of the `ScaleContext` extraction.

---

## 4. Schema Inventory (Post-Audit)

### 4.1 Frontend shared types

| Type | Location | Description |
|---|---|---|
| `ScaleContext` | `shared/types/ScaleContext.ts` | Root + typed mode for diatonic context |
| `HarmonySnapshot` | `shared/types/HarmonySnapshot.ts` | Versioned serialisable snapshot (v1) |
| `HarmonyMetadata` | `shared/types/HarmonySnapshot.ts` | Label, tags, bpm, beatsPerChord |
| `HarmonySnapshotVersion` | `shared/types/HarmonySnapshot.ts` | Schema version literal (`1`) |
| `CursorMode` | `shared/types/CursorMode.ts` | `"info" \| "select"` |

### 4.2 Frontend feature types

| Type | Location | Description |
|---|---|---|
| `ChordType` | `features/chord/types/index.ts` | 9-member union of quality strings |
| `Chord` | `features/current-chord/types/index.ts` | Root, quality, optional extensions / customNotes / primitiveShape |
| `PrimitiveShape` | `features/current-chord/types/index.ts` | 4 geometry-first presets |
| `ScaleType` | `features/scale/types/scales.ts` | 8-member union of mode strings |
| `BridgeRequest` | `features/ii-v-suggestions/types/index.ts` | Source, target, `ScaleContext?`, bounds |
| `BridgeSuggestion` | `features/ii-v-suggestions/types/index.ts` | Bridge chords, score, type, label |
| `ToneInfo` | `features/chord-inspection/types/tone-info.ts` | Note + frequency + scale degree |
| `MidiExportOptions` | `features/midi-export/utils/midiBuilder.ts` | BPM, beatsPerChord, startOctave |

### 4.3 Backend DTOs

| DTO | Location | Description |
|---|---|---|
| `ChordDto` | `Models/ChordDto.cs` | Root, quality, displayName, pitchClasses, noteNames |
| `ChordRef` | `Models/ProgressionAnalyzeRequestDto.cs` | Lightweight chord reference; now includes optional `customNotes` |
| `ProgressionAnalyzeRequestDto` | `Models/ProgressionAnalyzeRequestDto.cs` | Chords + optional `ScaleContext` |
| `ProgressionAnalyzeResponseDto` | `Models/ProgressionAnalyzeResponseDto.cs` | Steps, continuityScore, tensionTrend |
| `ProgressionStep` | `Models/ProgressionAnalyzeResponseDto.cs` | From, to, motion |
| `ScaleContextDto` | `Models/ScaleContextDto.cs` | Root (0–11) + ScaleType mode |
| `ScaleOptionsDto` | `Models/ScaleOptionsDto.cs` | ScaleType for /Scale/from-root |
| `QuartalChordDto` | `Models/QuartalChordDto.cs` | Extends chord fields with `QuartalMetadata` |
| `NoteInfo` | `Models/NoteInfo.cs` | Index + name (now with `[JsonPropertyName]`) |

### 4.4 Backend enums

| Enum | Location | Members |
|---|---|---|
| `ChordQuality` | `Models/ChordQuality.cs` | Major, Minor, Diminished, Augmented, Dominant7, Major7, Minor7, HalfDiminished7 |
| `Note` | `Models/Note.cs` | C=0 … B=11, with `GetDisplayName` and `TryParse` |
| `ScaleType` | `Models/ScaleType.cs` | Major, NaturalMinor, HarmonicMinor, MelodicMinor, Dorian, Phrygian, Lydian, Mixolydian |
| `PrimitiveShape` | `Models/PrimitiveShape.cs` | EquilateralTriangle, SuspendedTriangle, Square, Rectangle |

---

## 5. Stability Assessment

| Schema | Stable? | Notes |
|---|---|---|
| `ChordType` / `ChordQuality` | ✅ Yes | 9 frontend / 8 backend types; quartal exists only on frontend |
| `Chord` | ✅ Yes | All optional fields use `?`; additions are backward-compatible |
| `ScaleType` | ✅ Yes | 8 modes; additions would not break existing consumers |
| `HarmonySnapshot` | ✅ Yes | `schemaVersion` field guarantees safe future migration |
| `ProgressionAnalyzeRequestDto` | ✅ Yes | New fields are optional; existing clients unaffected |
| `ChordRef` | ✅ Yes | `customNotes` and `scaleContext` are optional |
| `BridgeRequest` | ✅ Yes | `ScaleContext` type replaces the loose inline shape |

---

## 6. Remaining Considerations

### 6.1 `Chord.extensions` typing

`Chord.extensions` is typed as `string[]` (e.g. `["9", "#11", "13"]`).  This
is intentionally loose for now — the set of valid extension strings is not yet
stable and a union type would be premature.  A future audit should enumerate
the valid extension strings and tighten the type to a union or an enum once the
vocabulary is settled.

### 6.2 Frontend `ChordType` vs. backend `ChordQuality` impedance

The frontend uses lowercase string unions (`"major"`, `"halfdim7"`) while the
backend uses PascalCase enum values (`Major`, `HalfDiminished7`).  Mapping is
handled in `ProgressionAnalyzer.GetSortedPitchClasses` via
`Enum.TryParse(..., ignoreCase: true)`.  This works, but a shared OpenAPI enum
definition (rather than a free string field in `ChordRef`) would make the
contract explicit.  Tracked for a future breaking-change window.

### 6.3 Quartal chord type parity

`ChordType.quartal` exists on the frontend but `ChordQuality` on the backend
does not include a `Quartal` member.  Quartal chords are handled by a separate
`QuartalChordGenerator` and `QuartalChordDto`.  This split is intentional today
but should be revisited if quartal chords need to participate in progression
analysis (e.g. `/Progression/analyze` with a quartal `ChordRef`).

### 6.4 `HarmonySnapshot` persistence

`HarmonySnapshot` is now defined and typed, but no component writes or reads
it yet.  The next step is to wire it into the `ProgressionSidebar` or a new
import/export feature so users can save and share progressions.

### 6.5 ML feature vectors

`HarmonySnapshot.metadata.tags` provides free-form ML labeling.  A future
iteration could add a structured `harmonicAnalysis` field to capture
pre-computed features (e.g. Roman numeral function, tension curve) that are
expensive to recalculate at training time.

---

## 7. Files Changed

| File | Change |
|---|---|
| `client/src/shared/types/ScaleContext.ts` | New — canonical `ScaleContext` type |
| `client/src/shared/types/HarmonySnapshot.ts` | New — versioned snapshot + factory + type guard |
| `client/src/shared/types/index.ts` | New — re-exports for shared types |
| `client/src/features/ii-v-suggestions/types/index.ts` | Updated `BridgeRequest.contextScale` to `ScaleContext` |
| `client/src/features/ii-v-suggestions/utils/suggestBridges.ts` | Updated `scale` param type to `ScaleContext` |
| `client/src/features/ii-v-suggestions/utils/scoreCandidate.ts` | Updated `scale` param; removed `as ScaleType` cast |
| `client/src/shared/types/__tests__/harmonySnapshot.test.ts` | New — 29 tests for `HarmonySnapshot` |
| `server/ParametricMusic.Api/Models/NoteInfo.cs` | Added `[JsonPropertyName]` attributes |
| `server/ParametricMusic.Api/Models/ScaleContextDto.cs` | New — `ScaleContextDto` model |
| `server/ParametricMusic.Api/Models/ProgressionAnalyzeRequestDto.cs` | Added `CustomNotes` to `ChordRef`; added `ScaleContext?` to request |
| `server/ParametricMusic.Api/Services/ProgressionAnalyzer.cs` | Updated `GetSortedPitchClasses` to handle `customNotes` |
| `server/ParametricMusic.Tests/ProgressionAnalyzerTests.cs` | Added 6 tests for `customNotes` and `ScaleContext` |
| `client/src/api/generated/index.ts` | Regenerated — reflects new backend fields |

---

**Last Updated:** March 21, 2026
