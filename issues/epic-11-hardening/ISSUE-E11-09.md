# ISSUE-E11-09 — Reject Invalid customNotes Instead of Silently Discarding Values

## Objective

Enforce strict, explicit request validation for chord custom note sets.

## Title

Data-integrity bug: invalid customNotes are silently dropped

## Location

- `server/ParametricMusic.Api/Services/ProgressionAnalyzer.cs` (`GetSortedPitchClasses`)
- `server/ParametricMusic.Api/Models/ProgressionAnalyzeRequestDto.cs` (`ChordRef.CustomNotes`)

## Description

When `customNotes` contains out-of-range values, the analyzer silently filters them out and proceeds with remaining values. This mutates caller intent without returning a validation error.

## Risk & Impact

- Clients receive successful responses for malformed payloads.
- Analysis output may not match submitted chord data, causing hard-to-debug behavior.
- Contract drift encourages permissive input handling and weak boundary validation.

## Reproduction / Detection Method

1. Call `POST /Progression/analyze` with `customNotes: [0, 4, 7, 99]`.
2. Observe `200 OK` response rather than validation failure.
3. Compare returned analysis with equivalent payload excluding `99`; results are effectively the same.

## Recommended Fix

1. Validate `customNotes` at the API boundary:
   - Reject values outside `0..11`.
   - Reject duplicates if duplicates are not semantically valid.
   - Enforce minimum/maximum cardinality for usable chords.
2. Return `400` with explicit `problem+json` details for invalid arrays.
3. Keep service logic strict and remove silent discard path.

## Verification Step

1. Integration tests covering invalid values (`-1`, `12`, `99`) return `400`.
2. Integration tests with valid arrays return `200` unchanged.
3. Ensure no code path silently alters invalid input into a valid set.

## Severity

Medium

## Implementation Status

- [x] `ChordRef.CustomNotes` now validates each element is within `0..11`.
- [x] Duplicate `customNotes` values now produce validation failures.
- [x] `ProgressionAnalyzer.GetSortedPitchClasses` no longer silently discards invalid values.
- [x] Integration tests verify invalid `customNotes` payloads return `400`.
- [x] Service tests verify invalid `customNotes` inputs throw instead of falling back.
