# ISSUE-E3-10 - Add initial MIDI export endpoint

## Objective
Allow exporting a progression as MIDI bytes.

## API Contract
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

## Files To Add/Edit
- `server/ParametricMusic.Api/MidiExportRequestDto.cs`
- `server/ParametricMusic.Api/MidiExporter.cs`
- `server/ParametricMusic.Api/Controllers/ExportController.cs`
- `server/ParametricMusic.Tests/MidiExporterTests.cs`
- `server/ParametricMusic.Tests/ExportControllerIntegrationTests.cs`

## Acceptance Criteria
- Valid request returns MIDI bytes with header signature.
- Invalid progression/options returns 400.

## Verification Commands
- `dotnet build server/ParametricMusic.Api`
- `dotnet test server/ParametricMusic.Tests`
