# Epic 3 — Backend Domain Expansion

## Theme

Transform the ASP.NET Core API from a minimal scale-generation stub into a full music-theory service layer, introduce server-side progression persistence, and add a MIDI export pipeline.

Epic 1 built the interactive frontend visualisation. Epic 2 polished the UI. Epic 3 is the backend counterpart: it moves authoritative music-theory computation to the server, gives progressions a durable home outside the browser, and opens an export path so users can take their work into a DAW.

This epic deliberately avoids a database dependency in its first pass — an in-memory repository keeps the sprint focused on the API surface and business logic. A database storage backend can be swapped in as a follow-on once the contracts are stable.

---

## Tech Stack Context

| Layer | Details |
|-------|---------|
| Framework | ASP.NET Core Web API, .NET 10 |
| Language | C# with nullable reference types enabled |
| Serialisation | `System.Text.Json` with `JsonStringEnumConverter` |
| API Docs | Swashbuckle (Swagger / OpenAPI 3) |
| Testing | xUnit 2.9.3 |
| Persistence | In-memory repository (no database dependency this epic) |
| MIDI | Hand-rolled Standard MIDI File writer (no third-party library) |
| Validation | `System.ComponentModel.DataAnnotations` + `ModelState` |
| Client codegen | `openapi-typescript` — frontend re-generates after each spec change (`npm run generate:api`) |

---

## Milestone 1 — Complete the Scale API

The current `ScaleGenerator.BuildMajorScale` only implements the Ionian (major) mode. `ScaleType` already has a `Minor` member but it is silently ignored. Milestone 1 fills that gap and expands the endpoint to cover all seven diatonic modes.

---

### ISSUE-61 — Implement All Diatonic Modes in ScaleGenerator

**Affected files**
- `server/ParametricMusic.Api/ScaleGenerator.cs`
- `server/ParametricMusic.Api/ScaleType.cs`
- `server/ParametricMusic.Api/Controllers/ScaleController.cs`
- `server/ParametricMusic.Tests/ScaleGeneratorTests.cs`

**Summary**

`ScaleType` should enumerate all seven diatonic modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian / Natural Minor, Locrian). `ScaleGenerator` should route to the correct interval pattern based on the requested mode. The `ScaleController` should honour the `scaleType` field in `ScaleOptionsDto` rather than ignoring it.

**Requirements**
- Extend `ScaleType` to include all seven modes:
  ```csharp
  public enum ScaleType
  {
      Major,        // Ionian  — intervals [0,2,4,5,7,9,11]
      Dorian,       //          [0,2,3,5,7,9,10]
      Phrygian,     //          [0,1,3,5,7,8,10]
      Lydian,       //          [0,2,4,6,7,9,11]
      Mixolydian,   //          [0,2,4,5,7,9,10]
      Minor,        // Aeolian — [0,2,3,5,7,8,10]
      Locrian       //          [0,1,3,5,6,8,10]
  }
  ```
- Add a `private static readonly Dictionary<ScaleType, int[]> ScaleIntervals` lookup table in `ScaleGenerator`
- Replace `BuildMajorScale(int root)` with a general `BuildScale(int root, ScaleType scaleType)` method that selects the correct interval array from the lookup
- Update `ScaleController.BuildScale` to pass `options.ScaleType` to `ScaleGenerator.BuildScale`
- Add an `[EnumMember]` or `[Display]` attribute on each new enum value for Swagger documentation
- Extend `ScaleGeneratorTests.cs` with `[Theory]` cases covering each mode: verify note count (always 7), correct interval distances, and wraparound behaviour

**Acceptance Criteria**
- [ ] `POST /Scale/from-root?note=A` with `{ "scaleType": "Minor" }` returns the 7 notes of A natural minor
- [ ] All seven modes return 7 notes regardless of root
- [ ] Unknown or integer `scaleType` values return HTTP 400
- [ ] Swagger UI lists all seven enum values
- [ ] All existing `ScaleGeneratorTests` continue to pass
- [ ] New xUnit tests cover every mode with at least two root values (including one that wraps around the B/C boundary)
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-62 — Add `GET /Scale/types` Endpoint

**Affected files**
- `server/ParametricMusic.Api/Controllers/ScaleController.cs`
- `server/ParametricMusic.Api/ScaleTypeInfo.cs` *(new)*

**Summary**

The frontend scale selector currently hard-codes label strings. A `GET /Scale/types` endpoint returns a machine-readable list of available scale types so the selector can be populated dynamically, and the `openapi-typescript` codegen propagates the type to the client automatically.

**Requirements**
- Add a new `ScaleTypeInfo` record:
  ```csharp
  public record ScaleTypeInfo(string Value, string DisplayName, string Description);
  ```
- Add `[HttpGet("types")]` action to `ScaleController` that iterates `Enum.GetValues<ScaleType>()` and maps each to a `ScaleTypeInfo` using reflection on its `[Display]` attributes
- Return `IEnumerable<ScaleTypeInfo>` with HTTP 200
- Annotate with `[ProducesResponseType<IEnumerable<ScaleTypeInfo>>(StatusCodes.Status200OK)]` for accurate Swagger schema generation

**Acceptance Criteria**
- [ ] `GET /Scale/types` returns all seven mode objects with non-empty `DisplayName` and `Description` fields
- [ ] Response is an array ordered to match the `ScaleType` enum declaration order
- [ ] Swagger UI documents the response schema correctly
- [ ] xUnit test verifies the count and that each entry has a non-empty `DisplayName`
- [ ] `dotnet build` succeeds with zero warnings

---

## Milestone 2 — Chord API

Chord interval calculations currently live entirely in the TypeScript client (`transpose.ts`, `chordIntervals` data files). Moving these to the server provides a single source of truth for interval tables, enables server-side chord identification, and opens the door to richer analysis (e.g., enharmonic spelling, Roman numeral analysis) without bundling that logic in the browser.

---

### ISSUE-63 — Add `POST /Chord/notes` Endpoint

**Affected files**
- `server/ParametricMusic.Api/Controllers/ChordController.cs` *(new)*
- `server/ParametricMusic.Api/ChordType.cs` *(new)*
- `server/ParametricMusic.Api/ChordNotesRequestDto.cs` *(new)*
- `server/ParametricMusic.Api/ChordNoteInfo.cs` *(new)*
- `server/ParametricMusic.Tests/ChordControllerTests.cs` *(new)*

**Summary**

Return the notes of any chord given a root and quality. Each note in the response includes its pitch-class index, display name, and interval role (root / third / fifth / seventh) so the frontend can use the server as the authoritative chord-interval source.

**Requirements**
- Add `ChordType` enum mirroring the frontend values:
  ```csharp
  public enum ChordType { Major, Minor, Dim, Aug, Maj7, Min7, Dom7, HalfDim7 }
  ```
- Add `ChordNoteInfo` record:
  ```csharp
  public record ChordNoteInfo(int Index, string Name, string Role);
  // Role: "root" | "third" | "fifth" | "seventh"
  ```
- Add `ChordNotesRequestDto`:
  ```csharp
  public class ChordNotesRequestDto
  {
      [Required] public ChordType ChordType { get; set; }
  }
  ```
- Add a static `ChordGenerator` class with:
  ```csharp
  public static ChordNoteInfo[] BuildChord(int root, ChordType chordType)
  ```
  Using an interval lookup table:
  | ChordType | Semitone offsets |
  |-----------|-----------------|
  | Major | 0, 4, 7 |
  | Minor | 0, 3, 7 |
  | Dim | 0, 3, 6 |
  | Aug | 0, 4, 8 |
  | Maj7 | 0, 4, 7, 11 |
  | Min7 | 0, 3, 7, 10 |
  | Dom7 | 0, 4, 7, 10 |
  | HalfDim7 | 0, 3, 6, 10 |
- Add `[HttpPost("notes")]` action to `ChordController`:
  ```
  POST /Chord/notes?note=C
  Body: { "chordType": "Major" }
  ```
  Returns `ChordNoteInfo[]`

**Acceptance Criteria**
- [ ] `POST /Chord/notes?note=C` with `{ "chordType": "Major" }` returns `[C (root), E (third), G (fifth)]` with correct indices
- [ ] Seventh chord types return exactly 4 notes; triads return exactly 3 notes
- [ ] All 8 chord types work correctly for root notes that wrap around (e.g., note=A, chordType=Maj7)
- [ ] Invalid `chordType` string returns HTTP 400 with a descriptive message
- [ ] Swagger UI documents request and response schemas
- [ ] xUnit tests cover all 8 chord types plus at least two edge-case root values
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-64 — Add `POST /Chord/identify` Endpoint

**Affected files**
- `server/ParametricMusic.Api/Controllers/ChordController.cs`
- `server/ParametricMusic.Api/ChordIdentificationRequestDto.cs` *(new)*
- `server/ParametricMusic.Api/ChordIdentificationResultDto.cs` *(new)*
- `server/ParametricMusic.Tests/ChordControllerTests.cs`

**Summary**

Given an unordered set of pitch-class indices (e.g., `[0, 4, 7]`), identify the best-matching chord name, root, and quality. This enables the frontend to display human-readable chord names when a user selects arbitrary notes on the chromatic circle.

**Requirements**
- Add `ChordIdentificationRequestDto`:
  ```csharp
  public class ChordIdentificationRequestDto
  {
      [Required, MinLength(3), MaxLength(4)]
      public int[] NoteIndices { get; set; } = [];
  }
  ```
- Add `ChordIdentificationResultDto`:
  ```csharp
  public record ChordIdentificationResultDto(
      Note Root,
      ChordType ChordType,
      string DisplayName,   // e.g. "C Major" or "A♭ min7"
      bool IsExactMatch     // false when the closest match involves omissions
  );
  ```
- Implement identification by testing every possible root (0–11) and chord type against the sorted input interval set; return the match with the highest overlap score. When there is no exact match, return the best partial match with `IsExactMatch = false`
- Add `[HttpPost("identify")]` action on `ChordController` returning `ChordIdentificationResultDto` or HTTP 422 when identification is impossible (fewer than 2 distinct notes, or all same note)

**Acceptance Criteria**
- [ ] `[0, 4, 7]` → `{ root: "C", chordType: "Major", displayName: "C Major", isExactMatch: true }`
- [ ] `[9, 0, 4]` → identifies A minor (correct inversion handling)
- [ ] `[0, 3, 6, 10]` → identifies C half-diminished 7
- [ ] Input with fewer than 2 distinct notes returns HTTP 422
- [ ] `isExactMatch: false` is returned when the input is a subset or superset of a known chord
- [ ] xUnit tests cover exact matches for all 8 chord types, plus inversion scenarios
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-65 — Add `POST /Chord/voice-lead` Endpoint

**Affected files**
- `server/ParametricMusic.Api/Controllers/ChordController.cs`
- `server/ParametricMusic.Api/VoiceLeadRequestDto.cs` *(new)*
- `server/ParametricMusic.Api/VoiceLeadResultDto.cs` *(new)*
- `server/ParametricMusic.Tests/ChordControllerTests.cs`

**Summary**

Given two chords (root + quality), compute the minimal voice-leading paths between them — the set of note movements that minimises total semitone displacement. The result mirrors the logic already in the frontend `voice-leading` feature, centralising it on the server for correctness and reusability.

**Requirements**
- Add `VoiceLeadRequestDto`:
  ```csharp
  public class VoiceLeadRequestDto
  {
      [Required] public Note FromRoot { get; set; }
      [Required] public ChordType FromChordType { get; set; }
      [Required] public Note ToRoot { get; set; }
      [Required] public ChordType ToChordType { get; set; }
  }
  ```
- Add `VoiceLeadPath` and `VoiceLeadResultDto`:
  ```csharp
  public record VoiceLeadPath(int FromIndex, string FromName, int ToIndex, string ToName, int Displacement);
  public record VoiceLeadResultDto(VoiceLeadPath[] Paths, int TotalDisplacement);
  ```
- Implement voice-leading by building both chord note arrays, then assigning each "from" voice to the "to" note that minimises its semitone movement (considering octave equivalence within ±6 semitones), using a greedy nearest-neighbour assignment
- Add `[HttpPost("voice-lead")]` action returning `VoiceLeadResultDto`

**Acceptance Criteria**
- [ ] C Major → G Major returns paths with total displacement ≤ 4 semitones
- [ ] C Major → C Minor has at most one path with non-zero displacement (E → E♭, displacement = 1)
- [ ] Mismatched triad → seventh chord (3 notes → 4 notes) returns HTTP 400 with a message explaining the size mismatch
- [ ] xUnit tests verify total displacement is minimal for at least five well-known chord transitions
- [ ] `dotnet build` succeeds with zero warnings

---

## Milestone 3 — Progression Persistence

The progression is currently stored only in React state and is lost on page reload. Milestone 3 introduces a server-side persistence layer backed by an in-memory repository. This deliberately uses an interface (`IProgressionRepository`) so a database implementation can be substituted later without changing any controller logic.

---

### ISSUE-66 — Define `ProgressionRecord` Model and `IProgressionRepository`

**Affected files**
- `server/ParametricMusic.Api/Models/ProgressionRecord.cs` *(new)*
- `server/ParametricMusic.Api/Models/ChordRecord.cs` *(new)*
- `server/ParametricMusic.Api/Repositories/IProgressionRepository.cs` *(new)*
- `server/ParametricMusic.Api/Repositories/InMemoryProgressionRepository.cs` *(new)*
- `server/ParametricMusic.Api/Program.cs`

**Summary**

Define the domain model and repository abstraction before writing any controllers. Registering the in-memory implementation in `Program.cs` as a scoped service makes the controller testable via constructor injection.

**Requirements**
- Add `ChordRecord`:
  ```csharp
  public record ChordRecord(string Root, string ChordType);
  ```
- Add `ProgressionRecord`:
  ```csharp
  public class ProgressionRecord
  {
      public Guid Id { get; init; } = Guid.NewGuid();
      public string Name { get; set; } = string.Empty;
      public List<ChordRecord> Chords { get; set; } = [];
      public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
      public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
  }
  ```
- Add `IProgressionRepository` with methods:
  ```csharp
  Task<ProgressionRecord> CreateAsync(ProgressionRecord record);
  Task<ProgressionRecord?> GetByIdAsync(Guid id);
  Task<IEnumerable<ProgressionRecord>> GetAllAsync();
  Task<ProgressionRecord?> UpdateAsync(Guid id, ProgressionRecord record);
  Task<bool> DeleteAsync(Guid id);
  ```
- Implement `InMemoryProgressionRepository` using a `ConcurrentDictionary<Guid, ProgressionRecord>` for thread safety
- Register: `builder.Services.AddSingleton<IProgressionRepository, InMemoryProgressionRepository>()`

**Acceptance Criteria**
- [ ] `InMemoryProgressionRepository` passes all CRUD operations in isolation (xUnit tests with no HTTP layer)
- [ ] Concurrent reads and writes do not cause data races (use `ConcurrentDictionary`)
- [ ] `IProgressionRepository` is registered in `Program.cs` as a singleton
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-67 — Add `POST /Progression` and `GET /Progression` Endpoints

**Affected files**
- `server/ParametricMusic.Api/Controllers/ProgressionController.cs` *(new)*
- `server/ParametricMusic.Api/Dtos/CreateProgressionDto.cs` *(new)*
- `server/ParametricMusic.Api/Dtos/ProgressionDto.cs` *(new)*
- `server/ParametricMusic.Tests/ProgressionControllerTests.cs` *(new)*

**Summary**

Expose endpoints to create a new progression and list all saved progressions. The frontend saves its in-memory progression state here after a user explicitly triggers a "Save" action (to be wired up in a follow-on UI issue).

**Requirements**
- Add `CreateProgressionDto`:
  ```csharp
  public class CreateProgressionDto
  {
      [MaxLength(100)] public string Name { get; set; } = string.Empty;
      [Required, MinLength(1), MaxLength(8)]
      public List<ChordRecord> Chords { get; set; } = [];
  }
  ```
- Add `ProgressionDto` (outbound):
  ```csharp
  public record ProgressionDto(
      Guid Id, string Name,
      List<ChordRecord> Chords,
      DateTime CreatedAt, DateTime UpdatedAt
  );
  ```
- Add `POST /Progression` → creates a new `ProgressionRecord`, returns `ProgressionDto` with HTTP 201 and a `Location` header pointing to `GET /Progression/{id}`
- Add `GET /Progression` → returns `IEnumerable<ProgressionDto>` with HTTP 200

**Acceptance Criteria**
- [ ] `POST /Progression` with a valid body returns HTTP 201 and a `Location` header
- [ ] `GET /Progression` returns an empty array when no progressions exist
- [ ] `GET /Progression` returns all created progressions after several POSTs
- [ ] Posting a progression with more than 8 chords returns HTTP 400
- [ ] xUnit tests cover creation, list-empty, list-populated, and validation-failure cases
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-68 — Add `GET`, `PUT`, and `DELETE /Progression/{id}` Endpoints

**Affected files**
- `server/ParametricMusic.Api/Controllers/ProgressionController.cs`
- `server/ParametricMusic.Api/Dtos/UpdateProgressionDto.cs` *(new)*
- `server/ParametricMusic.Tests/ProgressionControllerTests.cs`

**Summary**

Complete the CRUD surface for progressions by adding individual resource retrieval, full replacement, and deletion.

**Requirements**
- Add `UpdateProgressionDto` (same shape as `CreateProgressionDto`)
- Add `GET /Progression/{id}` → returns `ProgressionDto` with HTTP 200, or HTTP 404 if not found
- Add `PUT /Progression/{id}` → replaces the progression, updates `UpdatedAt`, returns HTTP 200 with updated `ProgressionDto`, or HTTP 404
- Add `DELETE /Progression/{id}` → deletes the progression, returns HTTP 204, or HTTP 404
- Use `ProblemDetails` format for all error responses (configure `builder.Services.AddProblemDetails()` in `Program.cs`)

**Acceptance Criteria**
- [ ] `GET /Progression/{id}` returns the correct progression for a known id
- [ ] `GET /Progression/{unknown-guid}` returns HTTP 404 with a `ProblemDetails` body
- [ ] `PUT /Progression/{id}` updates name and chord list; `UpdatedAt` changes
- [ ] `DELETE /Progression/{id}` removes the progression; subsequent GET returns 404
- [ ] All four endpoints return `ProblemDetails`-formatted errors (not bare strings)
- [ ] xUnit tests cover the full happy-path round-trip: create → get → update → delete → get-404
- [ ] `dotnet build` succeeds with zero warnings

---

## Milestone 4 — MIDI Export

MIDI export is the most tangible output of this tool. A user should be able to take their progression out of the browser and into any DAW (Logic, Ableton, GarageBand) as a standard MIDI file.

---

### ISSUE-69 — Implement Standard MIDI File Writer

**Affected files**
- `server/ParametricMusic.Api/Midi/MidiFileWriter.cs` *(new)*
- `server/ParametricMusic.Api/Midi/MidiConstants.cs` *(new)*
- `server/ParametricMusic.Tests/MidiFileWriterTests.cs` *(new)*

**Summary**

Write a minimal Standard MIDI File (SMF) serialiser in C# that can produce a Format 0, single-track MIDI file from a list of timed note events. No third-party MIDI library is required — the SMF specification is well-defined and the byte layout for a simple chord sequence is straightforward.

**Requirements**
- Implement `MidiConstants` with common values:
  ```csharp
  public static class MidiConstants
  {
      public const int DefaultTempo = 500_000;   // microseconds per beat (120 BPM)
      public const int TicksPerQuarterNote = 480;
      public const byte NoteOn = 0x90;
      public const byte NoteOff = 0x80;
      public const byte ProgramChange = 0xC0;
      public const byte AcousticGrandPiano = 0x00;
  }
  ```
- Implement `MidiFileWriter.BuildChordSequence(IEnumerable<ChordRecord> chords, int bpm)` that:
  - Converts each `ChordRecord` to MIDI pitch values (octave 4, i.e., middle C = 60)
  - Writes each chord as simultaneous note-on events followed by note-off events after one beat
  - Uses a standard MIDI file header chunk (`MThd`) and single track chunk (`MTrk`)
  - Returns a `byte[]` representing a valid Format 0 SMF file
- The byte layout must follow the SMF specification: variable-length delta times, correct chunk sizes, big-endian integer encoding
- Keep `MidiFileWriter` as a static utility class (no DI needed)

**Acceptance Criteria**
- [ ] The returned byte array begins with the bytes `4D 54 68 64` (the `MThd` magic bytes)
- [ ] The file can be loaded by a standard MIDI parser (verify programmatically with byte-level assertions in tests)
- [ ] A single chord produces at least one note-on and one note-off event per note
- [ ] Multiple chords produce events in sequence with correct delta times
- [ ] xUnit tests assert magic bytes, chunk sizes, and that note count matches `chords.Count × notesPerChord`
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-70 — Add `POST /Export/midi` Endpoint

**Affected files**
- `server/ParametricMusic.Api/Controllers/ExportController.cs` *(new)*
- `server/ParametricMusic.Api/Dtos/ExportMidiRequestDto.cs` *(new)*
- `server/ParametricMusic.Tests/ExportControllerTests.cs` *(new)*

**Summary**

Expose the MIDI file writer via an HTTP endpoint. The client sends a chord list and optional BPM; the server returns a `.mid` file as a binary response.

**Requirements**
- Add `ExportMidiRequestDto`:
  ```csharp
  public class ExportMidiRequestDto
  {
      [Required, MinLength(1), MaxLength(8)]
      public List<ChordRecord> Chords { get; set; } = [];
      [Range(40, 240)] public int Bpm { get; set; } = 120;
      [MaxLength(50)] public string FileName { get; set; } = "progression";
  }
  ```
- Add `[HttpPost("midi")]` on `ExportController`:
  - Calls `MidiFileWriter.BuildChordSequence(request.Chords, request.Bpm)`
  - Returns `File(bytes, "audio/midi", $"{sanitizedFileName}.mid")` with HTTP 200
  - Sanitizes `FileName` to remove path separators and restrict to alphanumeric, hyphens, and underscores only

**Acceptance Criteria**
- [ ] `POST /Export/midi` with a valid body returns HTTP 200 with `Content-Type: audio/midi`
- [ ] The `Content-Disposition` header contains `attachment; filename="<name>.mid"`
- [ ] BPM out of range (e.g., 300) returns HTTP 400
- [ ] Empty chord list returns HTTP 400
- [ ] File name with path traversal characters (e.g., `../../evil`) is sanitised before use
- [ ] xUnit tests verify the response content type, disposition header, and that the byte array begins with `4D 54 68 64`
- [ ] `dotnet build` succeeds with zero warnings

---

## Milestone 5 — Backend Hardening

### ISSUE-71 — Standardise Error Responses with ProblemDetails

**Affected files**
- `server/ParametricMusic.Api/Program.cs`
- All existing controllers

**Summary**

Currently, validation errors from `ModelState` return a default ASP.NET error shape. Enabling `AddProblemDetails` and `InvalidModelStateResponseFactory` ensures every error response follows RFC 9457 (`application/problem+json`), making error handling on the frontend consistent and predictable.

**Requirements**
- Add `builder.Services.AddProblemDetails()` to `Program.cs`
- Configure `builder.Services.Configure<ApiBehaviorOptions>` to use the built-in `ProblemDetails` factory for `ModelState` errors:
  ```csharp
  options.InvalidModelStateResponseFactory = context =>
  {
      var factory = context.HttpContext.RequestServices
          .GetRequiredService<ProblemDetailsFactory>();
      var details = factory.CreateValidationProblemDetails(
          context.HttpContext, context.ModelState);
      return new BadRequestObjectResult(details)
      {
          ContentTypes = { "application/problem+json" }
      };
  };
  ```
- Add `app.UseExceptionHandler()` middleware for unhandled exceptions
- Update `HealthController` to include the API version in its response:
  ```csharp
  Ok(new { status = "healthy", timestamp = DateTime.UtcNow, version = "3.0.0" })
  ```

**Acceptance Criteria**
- [ ] Sending an invalid `scaleType` to `POST /Scale/from-root` returns a `application/problem+json` response with a `type` and `errors` dictionary
- [ ] Unhandled exceptions return HTTP 500 with a `ProblemDetails` body (not a raw stack trace)
- [ ] `GET /Health` returns a `version` field
- [ ] xUnit tests for existing controllers are updated to assert `application/problem+json` content type on 400 responses
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-72 — Expand xUnit Test Coverage and Add Integration Tests

**Affected files**
- `server/ParametricMusic.Tests/` — all test files

**Summary**

Unit tests exist for `ScaleGenerator` but there is no HTTP-level integration testing. Adding `WebApplicationFactory<Program>`-based integration tests verifies that the full middleware pipeline — routing, model binding, validation, and serialisation — works end-to-end, catching regressions that unit tests miss.

**Requirements**
- Add `Microsoft.AspNetCore.Mvc.Testing` package to `ParametricMusic.Tests.csproj`
- Add a `IntegrationTests/` sub-folder in the test project
- Write at least one `WebApplicationFactory` integration test class per controller:
  - `ScaleControllerIntegrationTests` — covers all seven scale modes and a 400 path
  - `ChordControllerIntegrationTests` — covers `/notes`, `/identify`, `/voice-lead` happy paths and one 400 path each
  - `ProgressionControllerIntegrationTests` — covers full CRUD round-trip
  - `ExportControllerIntegrationTests` — verifies MIDI bytes and 400 paths
- Each integration test class uses `IClassFixture<WebApplicationFactory<Program>>` and a shared `HttpClient`
- Unit tests in `ScaleGeneratorTests.cs` should be moved into a `UnitTests/` sub-folder for clarity; no test logic changes required — only file relocation

**Acceptance Criteria**
- [ ] `dotnet test` passes with zero failures
- [ ] Integration tests exercise the real HTTP pipeline (no mocks for controllers themselves)
- [ ] Test project builds and runs without requiring a live backend instance (use `WebApplicationFactory`)
- [ ] Each controller has at least one integration test for its primary happy path and at least one for a validation-failure path
- [ ] `dotnet build` succeeds with zero warnings

---

## Issue Dependency Map

```
ISSUE-61 (Scale modes)
  └── ISSUE-62 (Scale types list)   ← uses same ScaleType enum

ISSUE-63 (Chord notes)
  ├── ISSUE-64 (Chord identify)     ← reuses ChordGenerator interval tables
  └── ISSUE-65 (Voice lead)         ← reuses ChordGenerator.BuildChord

ISSUE-66 (ProgressionRecord + repo)
  ├── ISSUE-67 (POST/GET /Progression) ← depends on repository interface
  └── ISSUE-68 (GET/PUT/DELETE /Progression/{id}) ← depends on ISSUE-67

ISSUE-69 (MidiFileWriter)
  └── ISSUE-70 (POST /Export/midi)  ← wraps MidiFileWriter in HTTP endpoint

ISSUE-71 (ProblemDetails)
  └── ISSUE-72 (Integration tests)  ← tests assert application/problem+json
```

---

## File Impact Summary

| File | Issues |
|------|--------|
| `server/ParametricMusic.Api/ScaleGenerator.cs` | 61 |
| `server/ParametricMusic.Api/ScaleType.cs` | 61 |
| `server/ParametricMusic.Api/Controllers/ScaleController.cs` | 61, 62 |
| `server/ParametricMusic.Api/ScaleTypeInfo.cs` | 62 |
| `server/ParametricMusic.Api/ChordType.cs` | 63, 64, 65 |
| `server/ParametricMusic.Api/Controllers/ChordController.cs` | 63, 64, 65 |
| `server/ParametricMusic.Api/Models/ProgressionRecord.cs` | 66, 67, 68 |
| `server/ParametricMusic.Api/Repositories/IProgressionRepository.cs` | 66 |
| `server/ParametricMusic.Api/Repositories/InMemoryProgressionRepository.cs` | 66 |
| `server/ParametricMusic.Api/Controllers/ProgressionController.cs` | 67, 68 |
| `server/ParametricMusic.Api/Midi/MidiFileWriter.cs` | 69, 70 |
| `server/ParametricMusic.Api/Controllers/ExportController.cs` | 70 |
| `server/ParametricMusic.Api/Program.cs` | 66, 71 |
| `server/ParametricMusic.Api/Controllers/HealthController.cs` | 71 |
| `server/ParametricMusic.Tests/ScaleGeneratorTests.cs` | 61, 72 |
| `server/ParametricMusic.Tests/ChordControllerTests.cs` | 63, 64, 65, 72 |
| `server/ParametricMusic.Tests/ProgressionControllerTests.cs` | 67, 68, 72 |
| `server/ParametricMusic.Tests/MidiFileWriterTests.cs` | 69, 72 |
| `server/ParametricMusic.Tests/ExportControllerTests.cs` | 70, 72 |

---

## New API Surface

| Method | Path | Description | Issue |
|--------|------|-------------|-------|
| `POST` | `/Scale/from-root` | *(updated)* All 7 diatonic modes | 61 |
| `GET` | `/Scale/types` | List all scale type metadata | 62 |
| `POST` | `/Chord/notes` | Return chord tones with roles | 63 |
| `POST` | `/Chord/identify` | Identify chord from note indices | 64 |
| `POST` | `/Chord/voice-lead` | Compute minimal voice-leading paths | 65 |
| `GET` | `/Progression` | List all saved progressions | 67 |
| `POST` | `/Progression` | Save a new progression | 67 |
| `GET` | `/Progression/{id}` | Retrieve a progression by id | 68 |
| `PUT` | `/Progression/{id}` | Replace a progression | 68 |
| `DELETE` | `/Progression/{id}` | Delete a progression | 68 |
| `POST` | `/Export/midi` | Export progression as `.mid` file | 70 |
