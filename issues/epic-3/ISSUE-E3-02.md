# ISSUE-E3-02 - Add progression analysis endpoint

## Objective
Provide backend analysis for progression sequences used in sidebar.

## API Contract
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

## Deterministic Algorithm Requirements
- `motion` per step: sum of minimum cyclic semitone distance between sorted pitch classes.
- `continuityScore`: `1 - normalizedAverageMotion`, clamp to `[0,1]`.
- `tensionTrend`: per chord value in `[0,1]`, defined from interval roughness count.

## Files To Add/Edit
- `server/ParametricMusic.Api/ProgressionAnalyzeRequestDto.cs`
- `server/ParametricMusic.Api/ProgressionAnalyzeResponseDto.cs`
- `server/ParametricMusic.Api/ProgressionAnalyzer.cs`
- `server/ParametricMusic.Api/Controllers/ProgressionController.cs`
- `server/ParametricMusic.Tests/ProgressionAnalyzerTests.cs`
- `server/ParametricMusic.Tests/ProgressionControllerIntegrationTests.cs`

## Acceptance Criteria
- Request with 0 chords returns 400.
- Request with >8 chords returns 400.
- Deterministic fixture progression returns exact known response values.

## Verification Commands
- `dotnet build server/ParametricMusic.Api`
- `dotnet test server/ParametricMusic.Tests`
