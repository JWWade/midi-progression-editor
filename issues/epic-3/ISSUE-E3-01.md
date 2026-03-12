# ISSUE-E3-01 - Add chord construction endpoint

## Objective
Introduce backend chord construction parity for frontend chord qualities.

## API Contract
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

## Supported Qualities
- `Major`
- `Minor`
- `Diminished`
- `Augmented`
- `Dominant7`
- `Major7`
- `Minor7`
- `HalfDiminished7`

## Files To Add/Edit
- `server/ParametricMusic.Api/ChordQuality.cs`
- `server/ParametricMusic.Api/ChordFromRootRequestDto.cs`
- `server/ParametricMusic.Api/ChordDto.cs`
- `server/ParametricMusic.Api/ChordGenerator.cs` (or similarly named service)
- `server/ParametricMusic.Api/Controllers/ChordController.cs`
- `server/ParametricMusic.Tests/ChordGeneratorTests.cs`
- `server/ParametricMusic.Tests/ChordControllerIntegrationTests.cs`

## Acceptance Criteria
- Root C returns expected pitch classes for each quality.
- Root B wrap-around works.
- Invalid quality returns 400 with structured payload.

## Verification Commands
- `dotnet build server/ParametricMusic.Api`
- `dotnet test server/ParametricMusic.Tests`
