# Epic 3 - From Prototype to Product-Ready Sequencer

## Purpose

Epic 3 defines the next stage of work based on the codebase as it exists today.
It does not depend on Epics 1 or 2. This epic starts from the current implementation and closes the highest-value gaps between frontend capabilities and backend/API capabilities.

---

## Verified Baseline (Current Code)

### Frontend (implemented)

- React 19 + TypeScript + Vite feature-modular client.
- Core circle workflow is implemented in `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`.
- Chord morph animation is implemented in `client/src/features/chord-animation/hooks/useChordMorphing.ts` with default duration `260ms`.
- Current chord panel and progression sidebar are implemented and wired in `client/src/app/App.tsx`.
- Primitive custom geometry presets are implemented:
  - `equilateral-triangle`
  - `suspended-triangle` (sus4)
  - `square`
  - `rectangle`
  - Source of truth: `client/src/features/current-chord/types/index.ts`.
- Progression sidebar supports add/reorder/delete with max length constraints.
- Tone inspection, interval labels, centroid, extension overlays, and chord rotation controls are all present.
- Frontend lint is enforced with zero warnings.

### Backend (implemented)

- ASP.NET Core Web API on .NET 10.
- Controllers currently exposed:
  - `GET /Health`
  - `POST /Scale/from-root`
- CORS local-dev policy is configured in `server/ParametricMusic.Api/Program.cs`.
- Swagger is enabled in development.
- `ScaleGenerator` currently computes major-scale intervals only.

### Current Architecture Reality

The frontend has rich chord/geometry/progression behavior while backend scope is still narrow (health + scale endpoint). Epic 3 therefore focuses on backend parity, API contracts, and reliability for the features users already have in the UI.

---

## Epic Goals

1. Bring backend/API capabilities up to the level of the existing frontend chord workflow.
2. Make API contracts explicit and stable for generated client usage.
3. Add sufficient automated testing for both frontend-critical utilities and backend HTTP behavior.
4. Prepare the system for export and persistence without disrupting current UX.

---

## Milestone 1 - Backend Parity for Chords and Progressions

### ISSUE-E3-01 - Add Chord Construction Endpoint

**Summary**
Add an API endpoint to return chord tones from root + quality so frontend chord logic can be shared with backend consumers.

**Requirements**
- Add chord DTOs and request DTO.
- Add `POST /Chord/from-root`.
- Support current frontend chord qualities:
  - `major`, `minor`, `dim`, `aug`, `dom7`, `maj7`, `min7`, `halfdim7`.
- Return pitch classes and note labels.

**Acceptance Criteria**
- [ ] Endpoint returns correct notes for all supported qualities.
- [ ] Invalid quality returns 400 with structured error payload.
- [ ] Swagger schema documents request/response.

---

### ISSUE-E3-02 - Add Progression Analysis Endpoint

**Summary**
Expose progression-level analysis so sidebar sequences can be evaluated server-side.

**Requirements**
- Add `POST /Progression/analyze`.
- Input supports 1..8 chords (matching sidebar max).
- Return at least:
  - per-step voice motion summary,
  - continuity score,
  - tension/complexity trend.

**Acceptance Criteria**
- [ ] Valid progression returns a typed analysis response.
- [ ] Empty progression returns 400.
- [ ] More than 8 chords returns 400.

---

### ISSUE-E3-03 - Add Primitive Shape Payload Support

**Summary**
Allow backend to understand primitive chord selections created in the circle UI.

**Requirements**
- Add optional primitive metadata field in chord request models.
- Supported values:
  - `equilateral-triangle`,
  - `suspended-triangle`,
  - `square`,
  - `rectangle`.
- Ensure backend analysis paths do not drop primitive metadata.

**Acceptance Criteria**
- [ ] Primitive values round-trip in API payloads.
- [ ] Unknown primitive value returns 400.
- [ ] OpenAPI enum includes all four primitive values.

---

## Milestone 2 - Scale API Alignment

### ISSUE-E3-04 - Align /Scale/from-root with Requested Scale Type

**Summary**
`ScaleController` currently accepts options but always returns major intervals. Implement true scale-type behavior.

**Requirements**
- Respect requested scale type in `ScaleOptionsDto`.
- Support all client scale modes currently exposed in UI:
  - major,
  - natural minor,
  - harmonic minor,
  - melodic minor,
  - dorian,
  - phrygian,
  - lydian,
  - mixolydian.

**Acceptance Criteria**
- [ ] Each scale mode returns correct interval pattern for root C.
- [ ] Non-C roots transpose correctly.
- [ ] Existing major behavior remains unchanged.

---

### ISSUE-E3-05 - Add Scale Contract Tests

**Summary**
Expand backend tests beyond major-only assumptions and verify HTTP contract behavior.

**Requirements**
- Add unit tests for all supported scale modes.
- Add API-level tests for `/Scale/from-root` happy path and invalid payload path.

**Acceptance Criteria**
- [ ] Mode coverage exists for all 8 scale types.
- [ ] Tests assert stable response shape (pitch class + note name).
- [ ] Test suite passes in CI.

---

## Milestone 3 - Contract Stability and Client Generation

### ISSUE-E3-06 - OpenAPI Contract Hardening

**Summary**
Ensure OpenAPI remains the single source of truth for typed frontend integration.

**Requirements**
- Add explicit response annotations on controllers.
- Ensure enums serialize as strings consistently.
- Add error response schemas for 400-level outcomes.

**Acceptance Criteria**
- [ ] Swagger shows full schemas for all active endpoints.
- [ ] Generated TypeScript client has no manual patch requirements.
- [ ] Breaking schema changes are documented in PR notes.

---

### ISSUE-E3-07 - Regenerate and Validate Frontend API Client

**Summary**
Regenerate client types/functions after backend changes and verify app compile/lint.

**Requirements**
- Run client generation from live OpenAPI.
- Update generated files only via generation script.
- Validate with frontend build and lint.

**Acceptance Criteria**
- [ ] Generated client includes new endpoints and DTOs.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes with max warnings 0.

---

## Milestone 4 - Reliability and UX Safety Nets

### ISSUE-E3-08 - Add End-to-End Backend Integration Tests

**Summary**
Add HTTP-level tests for all public endpoints.

**Requirements**
- Use `WebApplicationFactory<Program>`.
- Cover happy paths and validation failures for:
  - Health,
  - Scale,
  - Chord (new),
  - Progression (new).

**Acceptance Criteria**
- [ ] Integration suite runs without external server process.
- [ ] Validation failures assert content type and payload shape.
- [ ] Total test runtime remains practical for PR checks.

---

### ISSUE-E3-09 - Introduce Consistent Problem Details Responses

**Summary**
Standardize error payloads for predictable frontend handling.

**Requirements**
- Configure Problem Details for model-validation and unhandled exceptions.
- Keep response schema consistent across controllers.

**Acceptance Criteria**
- [ ] Invalid payloads return `application/problem+json`.
- [ ] Errors include machine-parseable fields used by frontend.
- [ ] No raw exception details leak in production responses.

---

## Milestone 5 - Export and Persistence Foundations

### ISSUE-E3-10 - Add MIDI Export Endpoint (Initial Version)

**Summary**
Provide backend MIDI export for current progression sidebar flow.

**Requirements**
- Add `POST /Export/midi`.
- Accept progression chords and export options (tempo + beats per chord minimum).
- Return downloadable MIDI bytes.

**Acceptance Criteria**
- [ ] Valid request returns binary MIDI file payload.
- [ ] Header bytes match MIDI file signature.
- [ ] Invalid progression/options return 400.

---

### ISSUE-E3-11 - Add Session Persistence API (Optional in Epic)

**Summary**
Define a minimal API for storing and loading progression sessions.

**Requirements**
- If implemented in this epic, keep scope minimal:
  - save progression,
  - list sessions,
  - load by id.
- If deferred, capture schema and endpoint contracts for next epic.

**Acceptance Criteria**
- [ ] Clear decision recorded: implemented vs deferred.
- [ ] If implemented, frontend can round-trip a progression.
- [ ] If deferred, API contract draft is checked in.

---

## Non-Goals for Epic 3

- No redesign of the existing chromatic circle interaction model.
- No removal or rewrite of primitive shape UX already in production.
- No frontend framework migration.

---

## Dependencies and Sequencing

1. `ISSUE-E3-04` (scale alignment) should happen early because existing scale endpoint is already in use.
2. `ISSUE-E3-01` and `ISSUE-E3-02` unlock most backend parity value.
3. `ISSUE-E3-06` and `ISSUE-E3-07` follow any API-surface changes.
4. `ISSUE-E3-08` and `ISSUE-E3-09` harden quality before export work.
5. `ISSUE-E3-10` and `ISSUE-E3-11` are last because they depend on stabilized chord/progression contracts.

---

## Definition of Done (Epic)

- [ ] Backend exposes chord + progression endpoints aligned to current frontend domain model.
- [ ] Scale endpoint behavior matches selected scale mode.
- [ ] OpenAPI-generated client compiles cleanly in frontend.
- [ ] Integration tests cover all public endpoints and validation paths.
- [ ] At least initial MIDI export path is available.
- [ ] Documentation reflects actual architecture at the time of completion.
