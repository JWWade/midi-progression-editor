# ISSUE-E9-02 — Data Model & Schema Evolution Remediation

## Objective

Act on the remaining open items identified in the [2026-03-21 Data Model & Schema Evolution Audit](../../../docs/data-model-audit.md). Six critical gaps were already fixed as part of that audit; this issue tracks the four open considerations (§6.1–§6.5) that were explicitly deferred for a future iteration.

## Background

The audit reviewed every frontend type, backend DTO, and serialisation contract in the codebase and scored each against stability, expressiveness, flexibility, and ML-readiness. The fixes delivered (`ScaleContext`, `HarmonySnapshot`, `ChordRef.customNotes`, `ScaleContextDto`, `NoteInfo` JSON attributes) left four explicit deferred items. The most significant are:

1. **`HarmonySnapshot` has no persistence layer** — the type and factory exist but nothing writes or reads them.
2. **`ChordType` / `ChordQuality` impedance** — frontend uses lowercase string unions; backend uses PascalCase enums; the mapping is implicit and string-based, not OpenAPI-enforced.
3. **`Chord.extensions` is loosely typed** — `string[]` was intentionally deferred pending vocabulary stabilisation.
4. **Quartal chord type parity** — `ChordType.quartal` exists on the frontend but `ChordQuality` on the backend has no `Quartal` member, blocking quartal chords from participating in `/Progression/analyze`.

---

## Tasks

### Task 1 — Wire `HarmonySnapshot` to import/export (audit §6.4)

**Priority:** High — `HarmonySnapshot` is the foundational persistence primitive; every other session-continuity feature depends on it.

The shared type and factory (`createHarmonySnapshot`) already exist at `client/src/shared/types/HarmonySnapshot.ts`. This task wires them into a concrete save/load affordance.

**Files to add:**
- `client/src/features/progression-sidebar/utils/snapshotIO.ts` — `exportSnapshot(chords, scale, metadata): string` (JSON serialise) and `importSnapshot(json: string): HarmonySnapshot | null` (validate with `isHarmonySnapshot` type guard, return `null` on failure)

**Files to edit:**
- `client/src/features/midi-export/components/MidiExportControls.tsx` — add an **Export JSON** button alongside the existing MIDI export button, calling `exportSnapshot` and triggering a file download
- `client/src/app/App.tsx` — add a hidden `<input type="file">` and a **Load JSON** button in the header or sidebar header area; on file selection, call `importSnapshot`, validate the result, and call `setChords` / set scale context accordingly

A SPIKE is permissible if the UX placement of the import/export controls needs design exploration before implementation.

**Acceptance criteria for this task:**
- [ ] Clicking **Export JSON** downloads a `.json` file whose content satisfies `isHarmonySnapshot()`
- [ ] Clicking **Load JSON** and selecting a valid snapshot file restores the progression and scale context
- [ ] Selecting an invalid file shows a user-visible error (no uncaught exceptions)
- [ ] `schemaVersion` is validated on import; a snapshot with an unknown version is rejected with a clear error message

---

### Task 2 — Tighten `Chord.extensions` typing (audit §6.1)

**Priority:** Medium — the current `string[]` type is a safety gap; as the extension vocabulary stabilises this should be locked down.

**Prerequisite:** Enumerate all extension strings currently used in the codebase (search for `extensions:` usages) and verify they form a stable, finite set before proceeding.

**Files to edit:**
- `client/src/features/chord/types/index.ts` — define `ChordExtension = "9" | "b9" | "#9" | "11" | "#11" | "13" | "b13"` (or the actual set found); replace `extensions?: string[]` with `extensions?: ChordExtension[]` in `Chord`
- Any file constructing chords with extension strings — update to use the typed union

A SPIKE is permissible to enumerate valid extension strings before committing to the union type.

**Acceptance criteria for this task:**
- [ ] `Chord.extensions` is typed as `ChordExtension[]` (or equivalent union), not `string[]`
- [ ] TypeScript strict mode catches any extension string not in the union
- [ ] `npm run build` passes with no type errors

---

### Task 3 — Make `ChordType`/`ChordQuality` contract explicit via OpenAPI (audit §6.2)

**Priority:** Medium — the current `ignoreCase: true` `Enum.TryParse` bridge works but is invisible in the API contract.

The `ChordRef.quality` field in the backend is currently a `string`, mapped at runtime in `ProgressionAnalyzer.GetSortedPitchClasses`. This means the OpenAPI schema exposes `quality: string` rather than the actual enumeration, so generated clients get no type safety.

**Files to edit:**
- `server/ParametricMusic.Api/Models/ProgressionAnalyzeRequestDto.cs` — change `ChordRef.quality` from `string` to `ChordQuality` enum; add a custom `JsonConverter` or `[JsonConverter]` attribute to accept the lowercase frontend strings (`"major"` → `Major`, `"halfdim7"` → `HalfDiminished7`)
- `server/ParametricMusic.Tests/ProgressionAnalyzerTests.cs` / controller tests — update any raw string assertions to use the enum
- `client` — regenerate the API client (`npm run generate:api`) once the backend OpenAPI schema reflects the enum

**Acceptance criteria for this task:**
- [ ] The Swagger UI shows `quality` as an enum with all valid values, not a free string
- [ ] Sending an unknown quality string returns `400 Bad Request` (rather than silently using a fallback)
- [ ] All existing backend tests pass
- [ ] Generated TypeScript client reflects the enum type

---

### Task 4 — Backend `ChordQuality.Quartal` parity (audit §6.3)

**Priority:** Low — quartal chords currently bypass analysis; block on confirming that the `/Progression/analyze` use case for quartal chords is a priority.

**SPIKE recommended:** Before implementation, confirm whether quartal chords should be handled by the existing `ChordGenerator`/`ChordQuality` path or if they should continue to be routed through `QuartalChordGenerator`/`QuartalChordDto`. The two models have different return shapes; merging them is a breaking change.

**If proceeding after spike:**

**Files to edit:**
- `server/ParametricMusic.Api/Models/ChordQuality.cs` — add `Quartal` member
- `server/ParametricMusic.Api/Services/ProgressionAnalyzer.cs` — handle `Quartal` quality by delegating to `QuartalChordGenerator` for pitch-class resolution
- `server/ParametricMusic.Tests/ProgressionAnalyzerTests.cs` — add tests for quartal `ChordRef` in analysis requests

**Acceptance criteria for this task:**
- [ ] `POST /Progression/analyze` with a quartal `ChordRef` returns `200` with valid analysis
- [ ] The OpenAPI schema includes `Quartal` as a valid `ChordQuality` value
- [ ] All existing backend tests pass

---

### Task 5 — Structured `harmonicAnalysis` in `HarmonySnapshot` (audit §6.5, optional)

**Priority:** Low / future-proofing.

Once `/Progression/analyze` is stable and consistently used, add a structured `harmonicAnalysis` field to `HarmonyMetadata` to cache pre-computed features:

```typescript
harmonicAnalysis?: {
  romanNumerals?: string[];        // per-chord, e.g. ["I", "ii", "V7"]
  tensionCurve?: number[];         // per-chord tension score 0–1
  diatonicConformance?: number;    // proportion of diatonic chords
};
```

This is an additive, backward-compatible change and does not require a `schemaVersion` bump.

---

## Files To Add

| File | Purpose |
|---|---|
| `client/src/features/progression-sidebar/utils/snapshotIO.ts` | Export / import helpers |
| `docs/spikes/SPIKE-snapshot-ux.md` | (optional) UX placement of import/export controls |
| `docs/spikes/SPIKE-quartal-parity.md` | (optional) Analysis of quartal routing strategies |

## Files To Edit

| File | Change |
|---|---|
| `client/src/features/midi-export/components/MidiExportControls.tsx` | Add **Export JSON** button |
| `client/src/app/App.tsx` | Add **Load JSON** affordance |
| `client/src/features/chord/types/index.ts` | Tighten `extensions` to typed union |
| `server/ParametricMusic.Api/Models/ProgressionAnalyzeRequestDto.cs` | `ChordRef.quality` → enum |
| `server/ParametricMusic.Api/Models/ChordQuality.cs` | Add `Quartal` (Task 4 only) |
| `server/ParametricMusic.Api/Services/ProgressionAnalyzer.cs` | Handle quartal quality (Task 4 only) |
| `server/ParametricMusic.Tests/ProgressionAnalyzerTests.cs` | New tests for Tasks 3 and 4 |
| `client/src/api/generated/index.ts` | Regenerate after backend changes |

---

## Acceptance Criteria (overall)

- [ ] Tasks 1 and 2 implemented and verified
- [ ] Task 3 implemented (or spike documents a clear decision to defer with rationale)
- [ ] Task 4 preceded by a spike; implemented if spike recommends proceeding
- [ ] `npm run lint` passes with `--max-warnings=0`
- [ ] `npm test` passes (all frontend tests green)
- [ ] `dotnet test` passes (all backend tests green)
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] `npm run generate:api` has been run and committed if the backend OpenAPI schema changed

## Verification Commands

```bash
# Frontend
cd client
npm run lint
npm run build
npm test

# Backend
cd server/ParametricMusic.Tests
dotnet test

# API client regeneration (after backend changes)
cd client
npm run generate:api
```
