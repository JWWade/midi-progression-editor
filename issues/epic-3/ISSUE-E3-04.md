# ISSUE-E3-04 - Align /Scale/from-root with requested scale mode

## Objective
Make backend `POST /Scale/from-root` honor `ScaleOptionsDto.ScaleType` instead of always returning major.

## Contract
- Endpoint remains: `POST /Scale/from-root?note={Note}`
- Request body:
```json
{ "scaleType": "Major" }
```
- Response body remains `NoteInfo[]`.

## Required Backend Enum Alignment
`ScaleType` values:
- `Major`
- `NaturalMinor`
- `HarmonicMinor`
- `MelodicMinor`
- `Dorian`
- `Phrygian`
- `Lydian`
- `Mixolydian`

## Files To Edit
- `server/ParametricMusic.Api/ScaleType.cs`
- `server/ParametricMusic.Api/ScaleGenerator.cs`
- `server/ParametricMusic.Api/Controllers/ScaleController.cs` (if needed)

## Acceptance Criteria
For root C, exact intervals:
- Major -> `[0,2,4,5,7,9,11]`
- NaturalMinor -> `[0,2,3,5,7,8,10]`
- HarmonicMinor -> `[0,2,3,5,7,8,11]`
- MelodicMinor -> `[0,2,3,5,7,9,11]`
- Dorian -> `[0,2,3,5,7,9,10]`
- Phrygian -> `[0,1,3,5,7,8,10]`
- Lydian -> `[0,2,4,6,7,9,11]`
- Mixolydian -> `[0,2,4,5,7,9,10]`
- Non-C roots transpose correctly modulo 12.

## Verification Commands
- `dotnet build server/ParametricMusic.Api`
