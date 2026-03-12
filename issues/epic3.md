# Epic 3 - Agent-Ready Implementation Backlog

## Purpose

This version of Epic 3 is written for direct execution by GitHub Copilot coding agents.
Each issue includes:
- explicit scope,
- concrete contracts,
- files to touch,
- deterministic validation commands,
- acceptance tests.

This document is grounded in the repository as it exists now.

---

## Current Baseline (Verified)

### Backend currently implemented

- `GET /Health`
- `POST /Scale/from-root`
- `ScaleType` currently has only:
  - `Major`
  - `Minor`
- `ScaleGenerator` currently returns only major intervals regardless of options.

### Frontend currently implemented

- Chromatic circle, progression UI, primitive templates, and chord behavior are implemented client-side.
- Frontend scale modes currently include 8 values (`major`, `naturalMinor`, `harmonicMinor`, `melodicMinor`, `dorian`, `phrygian`, `lydian`, `mixolydian`).

### Build/test commands (must be used by agents)

- Backend build: `dotnet build server/ParametricMusic.Api`
- Backend tests: `dotnet test server/ParametricMusic.Tests`
- Frontend lint: `npm run lint` (from `client/`)
- Frontend build: `npm run build` (from `client/`)
- API generation: `npm run generate:api` (from `client/`, backend running on `http://localhost:5110`)

---

## Execution Order (Required)

1. E3-04
2. E3-05
3. E3-01
4. E3-03
5. E3-02
6. E3-09
7. E3-06
8. E3-08
9. E3-07
10. E3-10
11. E3-11 (optional/follow-up)

---

## E3-04 - Align /Scale/from-root with requested scale mode

### Objective
Make backend `POST /Scale/from-root` honor `ScaleOptionsDto.ScaleType` instead of always returning major.

### Contract

- Endpoint remains: `POST /Scale/from-root?note={Note}`
- Request body:
```json
{ "scaleType": "Major" }
```
- Response body remains `NoteInfo[]`.

### Required backend enum alignment

Backend `ScaleType` must support these values (PascalCase names):
- `Major`
- `NaturalMinor`
- `HarmonicMinor`
- `MelodicMinor`
- `Dorian`
- `Phrygian`
- `Lydian`
- `Mixolydian`

### Files to edit

- `server/ParametricMusic.Api/ScaleType.cs`
- `server/ParametricMusic.Api/ScaleGenerator.cs`
- `server/ParametricMusic.Api/Controllers/ScaleController.cs` (only if needed)

### Implementation notes

- Keep enum JSON serialization as strings (already configured in `Program.cs`).
- Add interval tables for all 8 modes in `ScaleGenerator`.
- Keep response model as `NoteInfo[]`.

### Acceptance tests

- For root C:
  - Major -> `[0,2,4,5,7,9,11]`
  - NaturalMinor -> `[0,2,3,5,7,8,10]`
  - HarmonicMinor -> `[0,2,3,5,7,8,11]`
  - MelodicMinor -> `[0,2,3,5,7,9,11]`
  - Dorian -> `[0,2,3,5,7,9,10]`
  - Phrygian -> `[0,1,3,5,7,8,10]`
  - Lydian -> `[0,2,4,6,7,9,11]`
  - Mixolydian -> `[0,2,4,5,7,9,10]`
- Non-C roots transpose correctly modulo 12.

### Verification commands

- `dotnet build server/ParametricMusic.Api`

---

## E3-05 - Add scale unit + API contract tests

### Objective
Add deterministic test coverage for all scale modes and HTTP contract behavior.

### Files to edit

- `server/ParametricMusic.Tests/ScaleGeneratorTests.cs`
- Add new integration test file(s), for example:
  - `server/ParametricMusic.Tests/ScaleControllerIntegrationTests.cs`

### Required package update

If missing, add:
- `Microsoft.AspNetCore.Mvc.Testing` to `server/ParametricMusic.Tests/ParametricMusic.Tests.csproj`

### Acceptance tests

- Unit tests assert expected pitch-class outputs for all 8 modes at root C.
- Unit tests assert transposition for at least 2 non-C roots.
- Integration test asserts:
  - 200 for valid request,
  - response shape includes `index` and `name`,
  - 400 for invalid enum value in body.

### Verification commands

- `dotnet test server/ParametricMusic.Tests`

---

## E3-01 - Add chord construction endpoint

### Objective
Introduce backend chord construction parity for frontend chord qualities.

### API contract

- Endpoint: `POST /Chord/from-root?note={Note}`
- Request body:
```json
{ "quality": "Major" }
```
- Response body:
```json
{
  "root": "C",
  "quality": "Major",
  "displayName": "C Major",
  "pitchClasses": [0,4,7],
  "noteNames": ["C","E","G"]
}
```

### Supported qualities (backend enum values)

- `Major`
- `Minor`
- `Diminished`
- `Augmented`
- `Dominant7`
- `Major7`
- `Minor7`
- `HalfDiminished7`

### Files to add/edit

- Add:
  - `server/ParametricMusic.Api/ChordQuality.cs`
  - `server/ParametricMusic.Api/ChordFromRootRequestDto.cs`
  - `server/ParametricMusic.Api/ChordDto.cs`
  - `server/ParametricMusic.Api/ChordGenerator.cs` (or similarly named service)
  - `server/ParametricMusic.Api/Controllers/ChordController.cs`
- Tests:
  - `server/ParametricMusic.Tests/ChordGeneratorTests.cs`
  - `server/ParametricMusic.Tests/ChordControllerIntegrationTests.cs`

### Acceptance tests

- Root C returns expected pitch classes for each quality.
- Root B wrap-around works.
- Invalid quality returns 400 with structured payload.

### Verification commands

- `dotnet build server/ParametricMusic.Api`
- `dotnet test server/ParametricMusic.Tests`

---

## E3-03 - Add primitive shape payload support

### Objective
Allow primitive shape metadata to be accepted and returned by chord/progression endpoints.

### API contract extension

Primitive shape enum values (JSON strings):
- `equilateral-triangle`
- `suspended-triangle`
- `square`
- `rectangle`

Extend chord payloads with optional property:
```json
"primitiveShape": "rectangle"
```

### Files to add/edit

- DTOs introduced in E3-01/E3-02 where chord objects are represented.
- OpenAPI-visible models must include enum schema.

### Acceptance tests

- Primitive shape round-trips on successful responses.
- Unknown primitive string returns 400.

### Verification commands

- `dotnet build server/ParametricMusic.Api`
- `dotnet test server/ParametricMusic.Tests`

---

## E3-02 - Add progression analysis endpoint

### Objective
Provide backend analysis for progression sequences used in sidebar.

### API contract

- Endpoint: `POST /Progression/analyze`
- Request body:
```json
{
  "chords": [
    { "root": "C", "quality": "Major" },
    { "root": "G", "quality": "Major" }
  ]
}
```

- Response body minimum:
```json
{
  "steps": [
    {
      "from": { "root": "C", "quality": "Major" },
      "to": { "root": "G", "quality": "Major" },
      "motion": 3
    }
  ],
  "continuityScore": 0.75,
  "tensionTrend": [0.2, 0.3]
}
```

### Deterministic algorithm requirements

- `motion` per step: sum of minimum cyclic semitone distance between sorted pitch classes.
- `continuityScore`: `1 - normalizedAverageMotion`, clamp to `[0,1]`.
- `tensionTrend`: per chord value in `[0,1]`, defined from interval roughness count.

### Files to add/edit

- Add:
  - `server/ParametricMusic.Api/ProgressionAnalyzeRequestDto.cs`
  - `server/ParametricMusic.Api/ProgressionAnalyzeResponseDto.cs`
  - `server/ParametricMusic.Api/ProgressionAnalyzer.cs`
  - `server/ParametricMusic.Api/Controllers/ProgressionController.cs`
- Tests:
  - `server/ParametricMusic.Tests/ProgressionAnalyzerTests.cs`
  - `server/ParametricMusic.Tests/ProgressionControllerIntegrationTests.cs`

### Acceptance tests

- Request with 0 chords -> 400.
- Request with >8 chords -> 400.
- Deterministic fixture progression returns exact known response values.

### Verification commands

- `dotnet build server/ParametricMusic.Api`
- `dotnet test server/ParametricMusic.Tests`

---

## E3-09 - Standardize Problem Details responses

### Objective
Ensure all error responses are predictable for clients.

### Required behavior

- Validation failures return `application/problem+json`.
- Unhandled exceptions produce non-leaking 500 Problem Details in non-development.

### Files to edit

- `server/ParametricMusic.Api/Program.cs`
- Controllers as needed for consistent behavior.

### Acceptance tests

- Integration tests assert content type and schema for 400 paths.

### Verification commands

- `dotnet test server/ParametricMusic.Tests`

---

## E3-06 - OpenAPI contract hardening

### Objective
Make Swagger/OpenAPI an unambiguous source for client generation.

### Requirements

- Add explicit `[ProducesResponseType]` models on active endpoints.
- Ensure enum display/serialization consistency.
- Ensure all new DTO schemas are visible.

### Files to edit

- Controllers and DTOs added by E3-01/E3-02/E3-03.
- `server/ParametricMusic.Api/Program.cs` if swagger config updates are needed.

### Acceptance tests

- OpenAPI includes all endpoint request/response schemas.
- 400 schemas represented for invalid payloads.

### Verification commands

- Run backend, inspect Swagger UI.
- `dotnet build server/ParametricMusic.Api`

---

## E3-08 - Add full backend integration test coverage

### Objective
Cover all public API endpoints through HTTP tests.

### Scope

Happy path + one failure path each for:
- `GET /Health`
- `POST /Scale/from-root`
- `POST /Chord/from-root`
- `POST /Progression/analyze`

### Files to add/edit

- Add/expand `*IntegrationTests.cs` under `server/ParametricMusic.Tests`.

### Acceptance tests

- Tests run with `WebApplicationFactory<Program>`.
- No external running server required.

### Verification commands

- `dotnet test server/ParametricMusic.Tests`

---

## E3-07 - Regenerate frontend API client after API work

### Objective
Sync generated TypeScript client with final backend OpenAPI contract.

### Prerequisites

- E3-01, E3-02, E3-03, E3-06 complete.
- Backend running locally at `http://localhost:5110`.

### Files to edit

- Generated only:
  - `client/src/api/generated/index.ts`

### Acceptance tests

- Generated client includes new endpoints and DTO shapes.
- Frontend builds and lints without manual generated-file edits.

### Verification commands

- `npm run generate:api` (in `client/`)
- `npm run build` (in `client/`)
- `npm run lint` (in `client/`)

---

## E3-10 - Add initial MIDI export endpoint

### Objective
Allow exporting a progression as MIDI bytes.

### API contract

- Endpoint: `POST /Export/midi`
- Request body minimum:
```json
{
  "progression": {
    "chords": [
      { "root": "C", "quality": "Major" },
      { "root": "G", "quality": "Major" }
    ]
  },
  "tempoBpm": 120,
  "beatsPerChord": 4
}
```

- Response:
  - `200` binary (`application/octet-stream`)
  - first 4 bytes `4D 54 68 64` (`MThd`)

### Files to add/edit

- Add:
  - `server/ParametricMusic.Api/MidiExportRequestDto.cs`
  - `server/ParametricMusic.Api/MidiExporter.cs`
  - `server/ParametricMusic.Api/Controllers/ExportController.cs`
- Tests:
  - `server/ParametricMusic.Tests/MidiExporterTests.cs`
  - `server/ParametricMusic.Tests/ExportControllerIntegrationTests.cs`

### Acceptance tests

- Valid request returns MIDI bytes with header signature.
- Invalid progression/options returns 400.

### Verification commands

- `dotnet build server/ParametricMusic.Api`
- `dotnet test server/ParametricMusic.Tests`

---

## E3-11 - Session persistence API (optional follow-up)

### Objective
Decide and document minimal persistence contract, optionally implement.

### Option A (implement)

- `POST /Sessions`
- `GET /Sessions`
- `GET /Sessions/{id}`

### Option B (defer)

- Add contract draft doc only (`docs/session-api-draft.md`) with JSON schemas.

### Acceptance

- A clear recorded decision is committed.
- If implemented, round-trip a progression.

---

## Agent Operating Rules (apply to every issue)

1. Do not modify generated files except E3-07.
2. Prefer smallest-scope edits per issue.
3. Every issue PR must include:
   - code changes,
   - tests,
   - verification command output summary,
   - brief schema summary.
4. If acceptance criteria cannot be met, agent must stop and report blocker explicitly.

---

## Epic Definition of Done

- Backend supports scale modes used by the frontend.
- Chord and progression APIs exist with tested contracts.
- Problem Details and integration tests are in place.
- Frontend generated client is in sync.
- Initial MIDI export is available and tested.
