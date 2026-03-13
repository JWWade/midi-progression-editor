# Controller Operation Review Plan

This document is the working plan for reviewing each backend controller operation with the user in the driver's seat. The user executes requests, chooses what to inspect next, and confirms whether behavior matches intent. Copilot documents the observed results here and fixes defects when we find them.

## Working Agreement

- The user drives the order of review and decides what behavior should be considered correct.
- Copilot documents what was tested, what happened, and what changed.
- If we find a defect, we pause the review long enough to fix it, run the relevant tests, and then resume.
- We keep notes focused on observable behavior, root cause, fix, and remaining risk.

## Review Sequence

Recommended order:

1. `GET /Health`
2. `POST /Chord/from-root`
3. `POST /Scale/from-root`
4. `POST /Progression/analyze`

This order starts with the lowest-risk endpoint and then moves from simple generation to the most behavior-heavy analysis flow.

## What We Validate For Each Operation

For every endpoint, we walk through the same categories:

1. Happy path response shape and core correctness
2. Enum parsing and invalid input handling
3. Boundary behavior and explicit constraints
4. Swagger/OpenAPI clarity if the contract looks ambiguous
5. Gaps between current behavior and intended product behavior

## Session Log Template

Copy this block under the endpoint being reviewed when we start a pass.

```md
### Session

- Driver: User
- Documented by: Copilot
- Request(s):
- Expected result:
- Observed result:
- Status: pass | issue found | needs clarification
- Notes:
- Fix applied:
- Verification after fix:
- Follow-up:
```

## Endpoint Checklist

### 1. `GET /Health`

Review focus:

- endpoint reachable
- status payload shape
- timestamp format and usefulness
- any mismatch between health semantics and actual application readiness

Session results:

### Session

- Driver: User
- Documented by: Copilot
- Request(s): `GET http://localhost:5110/Health` from Swagger UI with `accept: application/json`
- Expected result: `200 OK` with a small JSON payload confirming the API is up
- Observed result: `200 OK` with body `{ "status": "healthy", "timestamp": "2026-03-13T00:52:42.3115396Z" }`
- Status: pass
- Notes: Response shape matches the implemented contract. `timestamp` is emitted as an ISO 8601 UTC value and is suitable for debugging basic API reachability. This endpoint currently signals liveness only; it does not verify downstream dependencies because the backend does not currently have any external dependencies wired in.
- Fix applied: none
- Verification after fix: not applicable
- Follow-up: If the backend later gains persistence, queues, or external services, decide whether this endpoint should remain a simple liveness probe or grow into a deeper readiness check.

### 2. `POST /Chord/from-root`

Review focus:

- all supported chord qualities
- wrap-around behavior for higher root notes
- ~~primitive shape round-trip behavior~~ — removed (see fix below)
- invalid note and invalid quality handling
- response naming consistency with frontend expectations

Session results:

### Session

- Driver: User
- Documented by: Copilot
- Request(s): `POST /Chord/from-root?note=C` with `{ "quality": "Major", "primitiveShape": "equilateral-triangle" }`
- Expected result: either rejection or a response whose pitch classes match the declared shape
- Observed result: `200 OK` with pitch classes `[0, 4, 7]` (C Major intervals) — correct for the quality, but contradicts the equilateral-triangle geometry `[0, 4, 8]`
- Status: issue found
- Notes: `primitiveShape` on the chord construction endpoint was semantically incoherent. The field is only meaningful as carry-through display metadata inside progression payloads (`ChordRef`). It has no business on this endpoint since `quality` already fully determines the pitch classes.
- Fix applied: removed `primitiveShape` from `ChordFromRootRequestDto`, `ChordDto`, `ChordGenerator.BuildChord` signature, `ChordController`, and the three primitive-shape integration tests.
- Verification after fix: pending — backend needs restart to rebuild DLL (currently locked by running process). User confirmed clean happy-path response without the field.
- Follow-up: after backend restart, run `dotnet test midi-progression-editor.sln` to confirm all 79 remaining tests pass. If a geometry-first entry point is needed later, add `POST /Chord/from-shape?note={Note}&shape={PrimitiveShape}`.

### 3. `POST /Scale/from-root`

Review focus:

- all supported scale types
- non-C root transposition
- invalid note and invalid scale type handling
- consistency between enum names, JSON values, and frontend-generated API types

Session results:

### Session

- Driver: User
- Documented by: Copilot
- Request(s):
  - `POST /Scale/from-root?note=C` with `{ "scaleType": "Major" }` → `200 OK`, indices `[0,2,4,5,7,9,11]` ✓
  - `POST /Scale/from-root?note=C` with `{ "scaleType": "NaturalMinor" }` → `200 OK`, indices `[0,2,3,5,7,8,10]` ✓
  - `POST /Scale/from-root?note=D#` with `{ "scaleType": "Phrygian" }` → `200 OK`, indices `[3,4,6,8,10,11,1]` ✓
  - `POST /Scale/from-root?note=C` with `{ "scaleType": "Blues" }` → `400 Bad Request` ✓
- Status: pass with one cosmetic issue found
- Notes:
  1. Pitch indices are correct for all modes and roots tested.
  2. The `name` field in each `NoteInfo` uses sharps exclusively (e.g. `D#` not `Eb`). This is a non-issue: the frontend API client discards `name` and only extracts `index` (`noteInfo.index ?? 0`).
  3. The 400 response for an invalid enum value produced two error entries: `$.scaleType` (correct and useful) plus `options: "The Scale Options field is required."` — the latter leaks the internal C# parameter name `options` into the API contract.
- Fix applied: renamed the C# parameter from `options` to `body` in `ScaleController.BuildScale` so body-binding failures now emit `body` instead of `options`. This matches the convention already used in `ChordController`.
- Verification after fix: confirmed. The 400 now emits `body` instead of `options`. Two error entries still appear (`body: required` + `$.scaleType` path error) — this is standard ASP.NET Core ValidationProblemDetails behavior when JSON deserialization fails: the framework reports both the field-level parse failure and that the body object couldn't be constructed. Not a defect.
- Follow-up: none.

### 4. `POST /Progression/analyze`

Review focus:

- step motion calculations
- continuity score sanity
- tension trend sanity
- one-chord and eight-chord boundaries
- invalid root, invalid quality, and invalid primitive shape handling
- whether returned analysis is musically useful enough for the frontend

Session results:

### Session

- Driver: User
- Documented by: Copilot
- Request(s):
  1. `{ "chords": [C Major, F Major, G Major, C Major] }` — I–IV–V–I in C
  2. `{ "chords": [C Major, F# Diminished, G Major] }` — tritone substitution
- Status: pass
- Notes:
  **Progression 1 (I–IV–V–I):**
  - C→F motion=3: C is a common tone (C∈F Major); E→F=1, G→A=2 ✓
  - F→G motion=6: no common tones; all three voices move by a whole step (F→G=2, A→B=2, C→D=2) ✓ — counterintuitive but correct; IV→V forces parallel whole-step motion across all voices
  - G→C motion=3: G is a common tone; B→C=1, D→E=2 ✓
  - continuityScore=0.667: avg motion=(3+6+3)/3=4, score=1−4/12 ✓
  - tensionTrend=[0,0,0,0]: all major triads have no rough interval pairs ✓

  **Progression 2 (tritone substitution):**
  - C→F#dim motion=4: F# Diminished = {F#, A, C} — C is a shared tone with C Major; only E→F#=2, G→A=2 move ✓
  - F#dim→G motion=5: best rotation: C→D=2, F#→G=1, A→B=2 ✓
  - tensionTrend=[0, 0.333, 0]: F#dim has exactly one tritone pair (C–F#=IC6) out of 3 pairs = 1/3 ✓

- Fix applied: none — algorithm is correct
- Verification after fix: not applicable
- Follow-up: one known limitation — `ComputeMotion` uses `n = Min(a.Length, b.Length)`, so when a triad transitions to a seventh chord the fourth voice is silently dropped and motion is understated. Not a bug for current usage (the progression sidebar doesn't mix triads and seventh chords), but should be addressed before motion values are presented as a reliable voice-leading metric.

---

## Review Complete

All four controller operations reviewed. Summary:

| Endpoint | Status | Fix Applied |
|---|---|---|
| `GET /Health` | pass | none |
| `POST /Chord/from-root` | issue found + fixed | removed `primitiveShape` from request/response |
| `POST /Scale/from-root` | pass with cosmetic fix | renamed C# param `options` → `body` to clean up 400 error keys |
| `POST /Progression/analyze` | pass | none |

Verified: `dotnet test midi-progression-editor.sln` → 76 passed, 0 failed. (Was 82: removed 6 test cases — 1 `[Theory]` with 4 `[InlineData]` entries + 2 `[Fact]`s for primitive-shape round-trip on the chord endpoint.)

## Issue Handling Loop

When we find an issue during review, we use this sequence:

1. Record the failing request and the observed behavior.
2. State the intended behavior in one sentence.
3. Fix the code at the root cause.
4. Run the narrowest relevant tests first.
5. Re-run the original request path.
6. Document the fix and any residual risk here.

## Documentation Rules For This File

- Record facts, not guesses.
- Prefer one short session entry per concrete review pass.
- If a fix changes API behavior, update `server/README.md` as part of the same change.
- If a finding belongs in backlog rather than immediate code, note it as follow-up instead of treating it as a bug.