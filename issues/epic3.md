# Epic 3 — Backend Foundations for Musical Intelligence

## Theme

Establish the backend as a musical computation engine, not a persistence layer.

Epic 1 built the interactive frontend visualisation. Epic 2 polished the UI. Epic 3 is the backend counterpart: it introduces the core musical primitives the system needs for transform layers, generative workflows, and MIDI export — while keeping scope tight and backend-only.

This epic deliberately avoids persistence work. The focus is on musical intelligence: interval tables, chord construction, voice-leading analysis, progression analysis, and export — all as stateless computation services that the frontend can call on demand.

---

## Tech Stack Context

| Layer | Details |
|-------|---------|
| Framework | ASP.NET Core Web API, .NET 10 |
| Language | C# with nullable reference types enabled |
| Serialisation | `System.Text.Json` with `JsonStringEnumConverter` |
| API Docs | Swashbuckle (Swagger / OpenAPI 3) |
| Testing | xUnit 2.9.3 |
| Architecture | Stateless computation services (no persistence this epic) |
| MIDI | Hand-rolled Standard MIDI File writer (Format 0, no third-party library) |
| Validation | `System.ComponentModel.DataAnnotations` + `ModelState` |
| Client codegen | `openapi-typescript` — frontend re-generates after each spec change (`npm run generate:api`) |

---

## Milestone 1 — Musical Primitives (Intervals, Chords, DTOs)

These foundational types underpin every milestone that follows. Defining them first ensures that the chord construction service, voice-leading engine, and progression analyser all share a single, consistent vocabulary.

---

### ISSUE-61 — Add `Interval` Enum + Helpers

**Affected files**
- `server/ParametricMusic.Api/Interval.cs` *(new)*
- `server/ParametricMusic.Tests/IntervalTests.cs` *(new)*

**Summary**

An `Interval` enum with semitone values gives the rest of the system a type-safe way to express musical distances. Helper methods make conversions readable without magic numbers scattered across service code.

**Requirements**
- Define `Interval` enum with named semitone values:
  ```csharp
  public enum Interval
  {
      Unison = 0,
      MinorSecond = 1,
      MajorSecond = 2,
      MinorThird = 3,
      MajorThird = 4,
      PerfectFourth = 5,
      Tritone = 6,
      PerfectFifth = 7,
      MinorSixth = 8,
      MajorSixth = 9,
      MinorSeventh = 10,
      MajorSeventh = 11,
      Octave = 12
  }
  ```
- Add extension methods in `IntervalExtensions`:
  - `GetSemitones(this Interval interval)` — returns the integer semitone value
  - `FromSemitones(int semitones)` — returns the matching `Interval` (mod 12), or throws `ArgumentOutOfRangeException` for values outside 0–12
  - `GetDisplayName(this Interval interval)` — returns a human-readable string (e.g., `"Perfect Fifth"`)
- Add `[Display(Name = "...")]` attribute on each enum value for Swagger documentation

**Acceptance Criteria**
- [ ] `Interval.PerfectFifth.GetSemitones()` returns `7`
- [ ] `IntervalExtensions.FromSemitones(7)` returns `Interval.PerfectFifth`
- [ ] `FromSemitones` with a value outside 0–12 throws `ArgumentOutOfRangeException`
- [ ] xUnit tests cover `GetSemitones`, `FromSemitones`, and `GetDisplayName` for every enum member
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-62 — Add `ChordQuality` Enum

**Affected files**
- `server/ParametricMusic.Api/ChordQuality.cs` *(new)*

**Summary**

`ChordQuality` is the server-side counterpart to the frontend `ChordType` union. The enum names follow C# conventions while the JSON serialisation names match what the frontend already sends, keeping the API client compatible.

**Requirements**
- Define `ChordQuality` enum:
  ```csharp
  public enum ChordQuality
  {
      [Display(Name = "Major")]        Major,
      [Display(Name = "Minor")]        Minor,
      [Display(Name = "Diminished")]   Diminished,
      [Display(Name = "Augmented")]    Augmented,
      [Display(Name = "Dominant 7")]   Dominant7,
      [Display(Name = "Major 7")]      Major7,
      [Display(Name = "Minor 7")]      Minor7,
      [Display(Name = "Sus2")]         Sus2,
      [Display(Name = "Sus4")]         Sus4
  }
  ```
- Annotate each value with `[Display]` attributes for Swagger documentation
- The enum must serialise to and from its string name (enforced by the existing `JsonStringEnumConverter` already registered in `Program.cs`)

**Acceptance Criteria**
- [ ] `ChordQuality` deserialises correctly from the JSON string `"Major"`, `"Minor7"`, etc.
- [ ] Swagger UI lists all nine quality values with their display names
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-63 — Add `ChordDto`

**Affected files**
- `server/ParametricMusic.Api/Dtos/ChordDto.cs` *(new)*
- `server/ParametricMusic.Api/Dtos/ChordToneDto.cs` *(new)*
- `server/ParametricMusic.Tests/ChordDtoSerializationTests.cs` *(new)*

**Summary**

`ChordDto` is the canonical outbound representation of a chord. Every chord-returning endpoint uses it so that the frontend always receives the same structure regardless of which endpoint produced the chord.

**Requirements**
- Add `ChordToneDto`:
  ```csharp
  public record ChordToneDto(int PitchClass, string Name, string Role);
  // Role: "root" | "third" | "fifth" | "seventh" | "suspended"
  ```
- Add `ChordDto`:
  ```csharp
  public record ChordDto(
      Note Root,
      ChordQuality Quality,
      string DisplayName,      // e.g. "C Major", "A♭ min7"
      int[] PitchClasses,      // sorted, e.g. [0, 4, 7]
      string[] NoteNames,      // e.g. ["C", "E", "G"]
      Interval[] Intervals,    // intervals from root
      ChordToneDto[] Tones     // one entry per note with Role
  );
  ```
- Add `[ProducesResponseType<ChordDto>(StatusCodes.Status200OK)]` annotations on endpoints that return this type

**Acceptance Criteria**
- [ ] `ChordDto` serialises correctly to JSON (all fields present, enums as strings)
- [ ] `PitchClasses` is always sorted ascending
- [ ] xUnit serialisation tests round-trip a `ChordDto` through `System.Text.Json` and assert all field values
- [ ] OpenAPI schema for `ChordDto` is visible in Swagger UI with correct field types
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-64 — Implement `ChordConstructionService`

**Affected files**
- `server/ParametricMusic.Api/Services/ChordConstructionService.cs` *(new)*
- `server/ParametricMusic.Api/Program.cs`
- `server/ParametricMusic.Tests/ChordConstructionServiceTests.cs` *(new)*

**Summary**

`ChordConstructionService` is the authoritative source for chord interval tables on the server. It constructs a `ChordDto` from a root note and quality, using the `Interval` enum from ISSUE-61 for all distances.

**Requirements**
- Implement `ChordConstructionService` with a public method:
  ```csharp
  public ChordDto Build(Note root, ChordQuality quality)
  ```
- Use an `IReadOnlyDictionary<ChordQuality, Interval[]>` lookup table covering all nine qualities:
  | Quality | Intervals from root |
  |---------|-------------------|
  | Major | Unison, MajorThird, PerfectFifth |
  | Minor | Unison, MinorThird, PerfectFifth |
  | Diminished | Unison, MinorThird, Tritone |
  | Augmented | Unison, MajorThird, MinorSixth |
  | Dominant7 | Unison, MajorThird, PerfectFifth, MinorSeventh |
  | Major7 | Unison, MajorThird, PerfectFifth, MajorSeventh |
  | Minor7 | Unison, MinorThird, PerfectFifth, MinorSeventh |
  | Sus2 | Unison, MajorSecond, PerfectFifth |
  | Sus4 | Unison, PerfectFourth, PerfectFifth |
- Derive `NoteNames` from the existing `Note` enum and `NoteExtensions.GetDisplayName()`
- Assign `Role` to each `ChordToneDto` based on its position in the interval array (`"root"`, `"third"` / `"suspended"`, `"fifth"`, `"seventh"`)
- Register as a scoped service: `builder.Services.AddScoped<ChordConstructionService>()`

**Acceptance Criteria**
- [ ] `Build(Note.C, ChordQuality.Major)` returns `PitchClasses = [0, 4, 7]` and `NoteNames = ["C", "E", "G"]`
- [ ] `Build(Note.B, ChordQuality.Major7)` correctly wraps around (B, D#, F#, A# — all within 0–11)
- [ ] All nine qualities produce the correct pitch classes for root C
- [ ] xUnit tests cover all nine qualities plus at least two wrap-around root values
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-65 — Add `POST /Chord/from-root` Endpoint

**Affected files**
- `server/ParametricMusic.Api/Controllers/ChordController.cs` *(new)*
- `server/ParametricMusic.Api/Dtos/ChordFromRootRequestDto.cs` *(new)*
- `server/ParametricMusic.Tests/ChordControllerTests.cs` *(new)*

**Summary**

Expose `ChordConstructionService` via a REST endpoint. This is the primary way the frontend will request chord data from the server.

**Requirements**
- Add `ChordFromRootRequestDto`:
  ```csharp
  public class ChordFromRootRequestDto
  {
      [Required] public ChordQuality Quality { get; set; }
  }
  ```
- Add `[HttpPost("from-root")]` action on `ChordController`:
  ```
  POST /Chord/from-root?note=C
  Body: { "quality": "Major" }
  Response: ChordDto
  ```
- Inject `ChordConstructionService` via constructor injection
- Return HTTP 200 with `ChordDto`, or HTTP 400 for invalid `note` or `quality` values

**Acceptance Criteria**
- [ ] `POST /Chord/from-root?note=C` with `{ "quality": "Major" }` returns the full `ChordDto` for C Major
- [ ] All nine chord qualities are supported
- [ ] An unknown `quality` string in the body returns HTTP 400 with a `ProblemDetails` response
- [ ] Swagger UI documents the endpoint with correct request and response schemas
- [ ] xUnit tests cover the happy path for each quality and the 400 path for an invalid quality
- [ ] `dotnet build` succeeds with zero warnings

---

## Milestone 2 — Voice Leading Engine

Voice leading already has utility functions in the frontend (`features/voice-leading/utils/`). Milestone 2 moves the authoritative computation to the server, augmenting it with a centroid shift and a tension score that the frontend does not currently calculate.

---

### ISSUE-66 — Add `VoiceLeadingDto`

**Affected files**
- `server/ParametricMusic.Api/Dtos/VoiceLeadingDto.cs` *(new)*
- `server/ParametricMusic.Api/Dtos/VoicePathDto.cs` *(new)*

**Summary**

Define the outbound DTO that the voice-leading endpoint returns. All fields are derived from the two input chords — no state is stored.

**Requirements**
- Add `VoicePathDto`:
  ```csharp
  public record VoicePathDto(
      int FromPitchClass, string FromName,
      int ToPitchClass,   string ToName,
      int Displacement    // semitones moved; negative = downward motion
  );
  ```
- Add `VoiceLeadingDto`:
  ```csharp
  public record VoiceLeadingDto(
      VoicePathDto[] Paths,
      int TotalMotion,      // sum of absolute displacements
      double CentroidShift, // difference in mean pitch class between chords
      double TensionScore   // heuristic: sum of tritone/semitone intervals in target chord
  );
  ```

**Acceptance Criteria**
- [ ] `VoiceLeadingDto` serialises to JSON with all fields present and correctly typed
- [ ] OpenAPI schema is visible in Swagger UI
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-67 — Implement `VoiceLeadingService`

**Affected files**
- `server/ParametricMusic.Api/Services/VoiceLeadingService.cs` *(new)*
- `server/ParametricMusic.Api/Program.cs`
- `server/ParametricMusic.Tests/VoiceLeadingServiceTests.cs` *(new)*

**Summary**

`VoiceLeadingService` computes the minimal-motion voice-leading assignment between two `ChordDto` objects and derives the centroid shift and tension score.

**Requirements**
- Implement `VoiceLeadingService` with:
  ```csharp
  public VoiceLeadingDto Compute(ChordDto from, ChordDto to)
  ```
- Voice assignment: for each "from" tone, choose the "to" pitch class that minimizes absolute semitone displacement, considering octave equivalence within ±6 semitones (i.e., use `Math.Min(dist, 12 - dist)` for circular distance)
- Centroid shift: mean pitch class of `to` minus mean pitch class of `from`
- Tension score: count of semitone-adjacent or tritone intervals within the `to` chord's pitch-class set, normalized by chord size
- Register as scoped: `builder.Services.AddScoped<VoiceLeadingService>()`

**Acceptance Criteria**
- [ ] C Major → G Major: `TotalMotion` ≤ 4
- [ ] C Major → C Minor: exactly one path has `Displacement ≠ 0` (E → E♭, displacement = -1)
- [ ] C Major → F Major: returns correct centroid shift direction (F is a fourth above C)
- [ ] xUnit tests cover C→G, C→F, C→Am, and at least one seventh-chord transition
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-68 — Add `POST /VoiceLeading/between` Endpoint

**Affected files**
- `server/ParametricMusic.Api/Controllers/VoiceLeadingController.cs` *(new)*
- `server/ParametricMusic.Api/Dtos/VoiceLeadingRequestDto.cs` *(new)*
- `server/ParametricMusic.Tests/VoiceLeadingControllerTests.cs` *(new)*

**Summary**

Expose `VoiceLeadingService` as a REST endpoint. The request body contains two fully-specified chords (using the same shape as `ChordFromRootRequestDto`).

**Requirements**
- Add `VoiceLeadingRequestDto`:
  ```csharp
  public class VoiceLeadingRequestDto
  {
      [Required] public Note FromNote { get; set; }
      [Required] public ChordQuality FromQuality { get; set; }
      [Required] public Note ToNote { get; set; }
      [Required] public ChordQuality ToQuality { get; set; }
  }
  ```
- Add `[HttpPost("between")]` action on `VoiceLeadingController`:
  ```
  POST /VoiceLeading/between
  Body: { "fromNote": "C", "fromQuality": "Major", "toNote": "G", "toQuality": "Major" }
  Response: VoiceLeadingDto
  ```
- Internally construct both chords via `ChordConstructionService`, then pass them to `VoiceLeadingService.Compute`

**Acceptance Criteria**
- [ ] `POST /VoiceLeading/between` with C Major → G Major returns a `VoiceLeadingDto` with three paths and `TotalMotion` ≤ 4
- [ ] Invalid `fromQuality` returns HTTP 400 with a `ProblemDetails` body
- [ ] Swagger UI documents the endpoint
- [ ] xUnit integration test covers the happy path and a 400 path
- [ ] `dotnet build` succeeds with zero warnings

---

## Milestone 3 — Progression Analysis API

With chord construction and voice leading in place, Milestone 3 builds the progression analysis layer. The endpoint accepts a sequence of chords and returns a continuity score, a centroid path, a tension curve, and rule-based next-chord suggestions.

---

### ISSUE-69 — Add `ProgressionDto`

**Affected files**
- `server/ParametricMusic.Api/Dtos/ProgressionDto.cs` *(new)*

**Summary**

`ProgressionDto` is the inbound representation of a chord sequence. It reuses the `ChordFromRootRequestDto` shape for each chord entry, keeping the API surface consistent.

**Requirements**
- Add `ProgressionChordDto` (one chord entry in a progression):
  ```csharp
  public class ProgressionChordDto
  {
      [Required] public Note Root { get; set; }
      [Required] public ChordQuality Quality { get; set; }
  }
  ```
- Add `ProgressionDto`:
  ```csharp
  public class ProgressionDto
  {
      [Required, MinLength(1), MaxLength(8)]
      public List<ProgressionChordDto> Chords { get; set; } = [];
  }
  ```

**Acceptance Criteria**
- [ ] `ProgressionDto` deserialises correctly from a JSON array of chord objects
- [ ] Validation rejects progressions with zero chords or more than eight chords
- [ ] OpenAPI schema is visible in Swagger UI
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-70 — Add `ProgressionAnalysisDto`

**Affected files**
- `server/ParametricMusic.Api/Dtos/ProgressionAnalysisDto.cs` *(new)*

**Summary**

`ProgressionAnalysisDto` is the outbound analysis result. It packages all computed metrics into a single structure so the frontend has everything it needs in one response.

**Requirements**
- Add `ProgressionAnalysisDto`:
  ```csharp
  public record ProgressionAnalysisDto(
      double ContinuityScore,         // 0–1; higher = smoother voice leading
      double[] CentroidPath,          // one entry per chord: mean pitch class
      double[] TensionCurve,          // one entry per chord: tension score
      ChordDto[] SuggestedNextChords  // 1–3 rule-based suggestions for the next chord
  );
  ```

**Acceptance Criteria**
- [ ] `ProgressionAnalysisDto` serialises to JSON with all fields present
- [ ] Array lengths: `CentroidPath.Length == input.Chords.Count`, `TensionCurve.Length == input.Chords.Count`
- [ ] `SuggestedNextChords` is an array of 1–3 `ChordDto` objects
- [ ] OpenAPI schema is visible in Swagger UI
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-71 — Implement `ProgressionAnalysisService`

**Affected files**
- `server/ParametricMusic.Api/Services/ProgressionAnalysisService.cs` *(new)*
- `server/ParametricMusic.Api/Program.cs`
- `server/ParametricMusic.Tests/ProgressionAnalysisServiceTests.cs` *(new)*

**Summary**

`ProgressionAnalysisService` aggregates chord construction, voice-leading scores, and a simple rule-based next-chord suggestion algorithm into a single `Analyze` method.

**Requirements**
- Implement `ProgressionAnalysisService` with:
  ```csharp
  public ProgressionAnalysisDto Analyze(IReadOnlyList<ProgressionChordDto> chords)
  ```
- **Continuity score**: average of `(1 - normalized TotalMotion)` across all consecutive chord pairs; normalize by dividing by 12 (maximum possible motion per voice); clamp to [0, 1]
- **Centroid path**: for each chord, compute the mean pitch class across its tones using `ChordConstructionService`
- **Tension curve**: compute directly from each chord's interval content (count of semitone-adjacent or tritone intervals, normalized by chord size)
- **Suggested next chords**: apply two simple rules to the final chord in the progression:
  - *Dominant resolution*: if the last chord is a `Dominant7`, suggest its tonic (root a perfect fifth below, `Major` quality)
  - *Common-tone motion*: suggest the chord sharing the most pitch classes with the last chord from a candidate set of the 12 major and 12 minor chords
  - *Contrary motion*: suggest the chord whose centroid is furthest from the last chord's centroid
  - Return 1–3 unique suggestions (deduplicate by root + quality)
- Register as scoped: `builder.Services.AddScoped<ProgressionAnalysisService>()`

**Acceptance Criteria**
- [ ] I–IV–V progression (C Major, F Major, G Major) produces `ContinuityScore > 0.7`
- [ ] `CentroidPath` has the same length as the input chord list
- [ ] Dominant-resolution rule fires for a progression ending on G Dominant7: a C Major suggestion is present
- [ ] xUnit tests cover I–IV–V, I–vi–IV–V (50s progression), and a single-chord progression
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-72 — Add `POST /Progression/analyze` Endpoint

**Affected files**
- `server/ParametricMusic.Api/Controllers/ProgressionController.cs` *(new)*
- `server/ParametricMusic.Tests/ProgressionControllerTests.cs` *(new)*

**Summary**

Expose `ProgressionAnalysisService` as a REST endpoint. The frontend sends the current sidebar progression and receives the full analysis result in a single round-trip.

**Requirements**
- Add `[HttpPost("analyze")]` action on `ProgressionController`:
  ```
  POST /Progression/analyze
  Body: ProgressionDto
  Response: ProgressionAnalysisDto
  ```
- Inject `ProgressionAnalysisService` via constructor injection
- Return HTTP 200 with `ProgressionAnalysisDto`, or HTTP 400 for validation failures

**Acceptance Criteria**
- [ ] `POST /Progression/analyze` with a valid `ProgressionDto` returns `ProgressionAnalysisDto` with all fields populated
- [ ] Empty chord list returns HTTP 400
- [ ] Progression with more than 8 chords returns HTTP 400
- [ ] Swagger UI documents the endpoint with correct request and response schemas
- [ ] xUnit integration test covers the happy path and two 400 paths
- [ ] `dotnet build` succeeds with zero warnings

---

## Milestone 4 — MIDI Export

MIDI export is the most tangible output of this tool. A user should be able to take their progression out of the browser and into any DAW (Logic, Ableton, GarageBand) as a standard MIDI file.

---

### ISSUE-73 — Add `MidiExportOptionsDto`

**Affected files**
- `server/ParametricMusic.Api/Dtos/MidiExportOptionsDto.cs` *(new)*
- `server/ParametricMusic.Api/Dtos/MidiExportRequestDto.cs` *(new)*

**Summary**

Define the export options DTO so the frontend has per-export control over tempo, chord duration, and voicing.

**Requirements**
- Add `VoicingMode` enum:
  ```csharp
  public enum VoicingMode { ClosedPosition, OpenPosition }
  ```
- Add `MidiExportOptionsDto`:
  ```csharp
  public class MidiExportOptionsDto
  {
      [Range(40, 240)] public int Bpm { get; set; } = 120;
      [Range(1, 8)]    public int BeatsPerChord { get; set; } = 4;
      public VoicingMode Voicing { get; set; } = VoicingMode.ClosedPosition;
  }
  ```
- Add `MidiExportRequestDto`:
  ```csharp
  public class MidiExportRequestDto
  {
      [Required] public ProgressionDto Progression { get; set; } = new();
      public MidiExportOptionsDto Options { get; set; } = new();
      [MaxLength(50)] public string FileName { get; set; } = "progression";
  }
  ```

**Acceptance Criteria**
- [ ] `MidiExportOptionsDto` deserialises with defaults when fields are omitted from the JSON body
- [ ] BPM out of the 40–240 range fails validation
- [ ] OpenAPI schema is visible in Swagger UI
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-74 — Implement `MidiExportService`

**Affected files**
- `server/ParametricMusic.Api/Services/MidiExportService.cs` *(new)*
- `server/ParametricMusic.Api/Midi/MidiFileBuilder.cs` *(new)*
- `server/ParametricMusic.Api/Midi/MidiConstants.cs` *(new)*
- `server/ParametricMusic.Api/Program.cs`
- `server/ParametricMusic.Tests/MidiExportServiceTests.cs` *(new)*

**Summary**

`MidiExportService` converts a `ProgressionDto` and options into a valid Standard MIDI File. It uses pitch classes from `ChordConstructionService` and the hand-rolled `MidiFileBuilder` for the SMF byte layout.

**Requirements**
- Add `MidiConstants`:
  ```csharp
  public static class MidiConstants
  {
      public const int TicksPerQuarterNote = 480;
      public const byte NoteOn = 0x90;
      public const byte NoteOff = 0x80;
      public const byte AcousticGrandPiano = 0x00;
      public const int MiddleCMidi = 60; // pitch class 0 in octave 4
  }
  ```
- Implement `MidiFileBuilder` as an internal helper that:
  - Writes the SMF header chunk (`MThd`): format 0, 1 track, ticks-per-quarter-note
  - Writes a single track chunk (`MTrk`) with:
    - Tempo meta-event (`0xFF 0x51 0x03`) derived from BPM
    - For each chord: simultaneous note-on events (delta = 0 after the first), then note-off events after `BeatsPerChord × TicksPerQuarterNote` ticks
    - End-of-track meta-event (`0xFF 0x2F 0x00`)
  - All multi-byte integers big-endian; delta times as variable-length quantities (VLQ)
  - Closed position: all notes in octave 4 (MIDI 60–71); open position: alternate octaves per voice
- Implement `MidiExportService.Export(ProgressionDto progression, MidiExportOptionsDto options)` returning `byte[]`
- Register: `builder.Services.AddScoped<MidiExportService>()`

**Acceptance Criteria**
- [ ] Returned bytes begin with `4D 54 68 64` (the `MThd` magic bytes)
- [ ] A single-chord export produces at least one note-on and one note-off per chord tone
- [ ] A two-chord export produces events for both chords in sequence with non-zero delta time between them
- [ ] xUnit tests assert magic bytes, track chunk header, note-on count (= total tones across all chords), and correct BPM encoding
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-75 — Add `POST /Export/midi` Endpoint

**Affected files**
- `server/ParametricMusic.Api/Controllers/ExportController.cs` *(new)*
- `server/ParametricMusic.Tests/ExportControllerTests.cs` *(new)*

**Summary**

Expose `MidiExportService` via an HTTP endpoint that returns a binary `.mid` file for browser download.

**Requirements**
- Add `[HttpPost("midi")]` action on `ExportController`:
  ```
  POST /Export/midi
  Body: MidiExportRequestDto
  Response: application/octet-stream (.mid file)
  ```
- Inject `MidiExportService` via constructor injection
- Sanitize `FileName`: strip path separators; restrict to alphanumeric characters, hyphens, and underscores
- Return `File(bytes, "application/octet-stream", $"{sanitizedFileName}.mid")` with HTTP 200

**Acceptance Criteria**
- [ ] `POST /Export/midi` with a valid body returns HTTP 200 with `Content-Type: application/octet-stream`
- [ ] `Content-Disposition` header contains `attachment; filename="<name>.mid"`
- [ ] BPM out of range returns HTTP 400
- [ ] Empty progression returns HTTP 400
- [ ] `FileName` containing path traversal characters (e.g., `../../evil`) is sanitized before use
- [ ] xUnit tests verify content type, disposition header, and that the response bytes begin with `4D 54 68 64`
- [ ] `dotnet build` succeeds with zero warnings

---

## Milestone 5 — Hardening & Documentation

### ISSUE-76 — Add RFC 9457 ProblemDetails to All Error Paths

**Affected files**
- `server/ParametricMusic.Api/Program.cs`
- All controllers

**Summary**

All error responses should follow RFC 9457 (`application/problem+json`) for predictable client-side error handling.

**Requirements**
- Add `builder.Services.AddProblemDetails()` to `Program.cs`
- Configure `ApiBehaviorOptions.InvalidModelStateResponseFactory` to return `ProblemDetails`-formatted 400 responses:
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
- Add `app.UseExceptionHandler()` for unhandled exceptions returning HTTP 500 in `ProblemDetails` format

**Acceptance Criteria**
- [ ] Invalid `quality` value on any chord endpoint returns `application/problem+json` with an `errors` dictionary
- [ ] Unhandled exceptions return HTTP 500 with a `ProblemDetails` body (no raw stack trace)
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-77 — Add Integration Tests Using `WebApplicationFactory`

**Affected files**
- `server/ParametricMusic.Tests/` — new `IntegrationTests/` sub-folder
- `server/ParametricMusic.Tests/ParametricMusic.Tests.csproj`

**Summary**

Unit tests exist for `ScaleGenerator` but there is no HTTP-level integration testing. `WebApplicationFactory<Program>`-based tests verify the full middleware pipeline end-to-end.

**Requirements**
- Add `Microsoft.AspNetCore.Mvc.Testing` package reference to `ParametricMusic.Tests.csproj`
- Write one integration test class per new controller, each using `IClassFixture<WebApplicationFactory<Program>>`:
  - `ChordControllerIntegrationTests` — happy path for `/from-root` + a 400 path
  - `VoiceLeadingControllerIntegrationTests` — happy path for `/between` + a 400 path
  - `ProgressionControllerIntegrationTests` — happy path for `/analyze` + two 400 paths
  - `ExportControllerIntegrationTests` — verifies MIDI magic bytes, content type, and a 400 path

**Acceptance Criteria**
- [ ] `dotnet test` passes with zero failures
- [ ] No live server required (all tests use `WebApplicationFactory`)
- [ ] Each controller has at least one happy-path and one 400-path integration test
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-78 — Add XML Comments and Swagger Annotations

**Affected files**
- All new controllers and service classes

**Summary**

Improve OpenAPI documentation so that Swagger UI is useful as a standalone API reference, not just a schema viewer.

**Requirements**
- Add `/// <summary>` XML doc comments to every public controller action and every public service method
- Add `[ProducesResponseType]` attributes on all controller actions covering at minimum HTTP 200 and HTTP 400 paths
- Enable XML documentation generation in `ParametricMusic.Api.csproj`:
  ```xml
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <NoWarn>$(NoWarn);1591</NoWarn>
  ```
- Configure Swashbuckle to include the XML file:
  ```csharp
  builder.Services.AddSwaggerGen(c =>
  {
      var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
      c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFile));
  });
  ```

**Acceptance Criteria**
- [ ] Swagger UI shows description text for every new endpoint
- [ ] All 200 and 400 response schemas are documented in Swagger UI
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-79 — Regenerate Frontend API Client

**Affected files**
- `client/src/api/generated/index.ts`

**Summary**

After all new endpoints are in place, regenerate the frontend's auto-generated API client so the TypeScript types stay in sync with the new OpenAPI spec.

**Requirements**
- Start the backend (`dotnet run` from `server/ParametricMusic.Api`)
- Run `npm run generate:api` from the `client/` directory
- Commit the updated `client/src/api/generated/index.ts`
- Verify that `npm run build` in the `client/` directory succeeds after regeneration

**Acceptance Criteria**
- [ ] `client/src/api/generated/index.ts` reflects all new endpoints and DTOs
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm run lint` passes with `--max-warnings=0`

---

## Optional Stretch Issues

These issues are lower priority and can be addressed if time allows after Milestone 5 is complete.

---

### ISSUE-80 — Add `POST /Chord/identify` Endpoint

**Summary**

Given an unordered set of pitch-class indices (e.g., `[0, 4, 7]`), return the best-matching chord name, root, and quality. Useful when the user selects arbitrary notes on the chromatic circle.

**Requirements**
- Accept `int[]` of pitch classes (3–4 values)
- Test every root (0–11) and `ChordQuality` against the input; return the highest-overlap match
- Return a `ChordDto` extended with a `bool IsExactMatch` field, or HTTP 422 when identification is impossible

**Acceptance Criteria**
- [ ] `[0, 4, 7]` → C Major, `IsExactMatch: true`
- [ ] `[9, 0, 4]` → A Minor (inversion handled)
- [ ] Fewer than 2 distinct notes → HTTP 422
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-81 — Add `GET /Scale/types` Endpoint

**Summary**

Return metadata for all scale types currently defined in `ScaleType`, so the frontend scale selector can be populated dynamically rather than hard-coding label strings.

**Requirements**
- Return `IEnumerable<ScaleTypeInfo>` with `Value`, `DisplayName`, and `Description` for each `ScaleType` member
- Derive values from the existing `[Display]` attributes on `ScaleType`

**Acceptance Criteria**
- [ ] All current `ScaleType` members are returned with non-empty `DisplayName` and `Description`
- [ ] `dotnet build` succeeds with zero warnings

---

### ISSUE-82 — Add `POST /Transform/rotate` Endpoint

**Summary**

Rotate a chord's pitch classes by N semitones (chromatic transposition), returning a new `ChordDto`. This is the first step toward a transform layer for generative workflows.

**Requirements**
- Accept a root + quality and an integer `semitones` parameter (range: -11 to 11)
- Return a `ChordDto` for the transposed chord using `ChordConstructionService`
- Out-of-range `semitones` returns HTTP 400

**Acceptance Criteria**
- [ ] Rotating C Major by 7 semitones returns G Major
- [ ] Rotating A Minor by -2 semitones returns G Minor
- [ ] `semitones` outside -11 to 11 returns HTTP 400
- [ ] `dotnet build` succeeds with zero warnings

---

## Issue Dependency Map

```
ISSUE-61 (Interval enum)
  └── ISSUE-64 (ChordConstructionService) ← uses Interval for all distances

ISSUE-62 (ChordQuality enum)
  └── ISSUE-63 (ChordDto)                 ← Quality field
  └── ISSUE-64 (ChordConstructionService) ← interval lookup keyed by ChordQuality
  └── ISSUE-65 (POST /Chord/from-root)    ← request body

ISSUE-63 (ChordDto)
  └── ISSUE-65 (POST /Chord/from-root)    ← response type
  └── ISSUE-66 (VoiceLeadingDto)          ← Paths reference chord tones
  └── ISSUE-70 (ProgressionAnalysisDto)   ← SuggestedNextChords type

ISSUE-64 (ChordConstructionService)
  └── ISSUE-67 (VoiceLeadingService)      ← builds both chords internally
  └── ISSUE-71 (ProgressionAnalysisService) ← builds each chord

ISSUE-66 (VoiceLeadingDto) + ISSUE-67 (VoiceLeadingService)
  └── ISSUE-68 (POST /VoiceLeading/between)

ISSUE-69 (ProgressionDto) + ISSUE-70 (ProgressionAnalysisDto) + ISSUE-71 (ProgressionAnalysisService)
  └── ISSUE-72 (POST /Progression/analyze)

ISSUE-73 (MidiExportOptionsDto) + ISSUE-74 (MidiExportService)
  └── ISSUE-75 (POST /Export/midi)

ISSUE-76 (ProblemDetails)
  └── ISSUE-77 (Integration tests) ← tests assert application/problem+json on 400 paths

ISSUE-75, 72, 68, 65 (all new endpoints complete)
  └── ISSUE-78 (Swagger XML comments)
  └── ISSUE-79 (Regenerate API client)
```

---

## File Impact Summary

| File | Issues |
|------|--------|
| `server/ParametricMusic.Api/Interval.cs` | 61 |
| `server/ParametricMusic.Api/ChordQuality.cs` | 62 |
| `server/ParametricMusic.Api/Dtos/ChordDto.cs` | 63 |
| `server/ParametricMusic.Api/Dtos/ChordToneDto.cs` | 63 |
| `server/ParametricMusic.Api/Services/ChordConstructionService.cs` | 64 |
| `server/ParametricMusic.Api/Controllers/ChordController.cs` | 65, 80 |
| `server/ParametricMusic.Api/Dtos/VoiceLeadingDto.cs` | 66 |
| `server/ParametricMusic.Api/Dtos/VoicePathDto.cs` | 66 |
| `server/ParametricMusic.Api/Services/VoiceLeadingService.cs` | 67 |
| `server/ParametricMusic.Api/Controllers/VoiceLeadingController.cs` | 68 |
| `server/ParametricMusic.Api/Dtos/ProgressionDto.cs` | 69, 72 |
| `server/ParametricMusic.Api/Dtos/ProgressionAnalysisDto.cs` | 70 |
| `server/ParametricMusic.Api/Services/ProgressionAnalysisService.cs` | 71 |
| `server/ParametricMusic.Api/Controllers/ProgressionController.cs` | 72 |
| `server/ParametricMusic.Api/Dtos/MidiExportOptionsDto.cs` | 73 |
| `server/ParametricMusic.Api/Dtos/MidiExportRequestDto.cs` | 73 |
| `server/ParametricMusic.Api/Midi/MidiConstants.cs` | 74 |
| `server/ParametricMusic.Api/Midi/MidiFileBuilder.cs` | 74 |
| `server/ParametricMusic.Api/Services/MidiExportService.cs` | 74 |
| `server/ParametricMusic.Api/Controllers/ExportController.cs` | 75 |
| `server/ParametricMusic.Api/Program.cs` | 64, 67, 71, 74, 76 |
| `server/ParametricMusic.Tests/IntervalTests.cs` | 61 |
| `server/ParametricMusic.Tests/ChordConstructionServiceTests.cs` | 64 |
| `server/ParametricMusic.Tests/ChordControllerTests.cs` | 65 |
| `server/ParametricMusic.Tests/VoiceLeadingServiceTests.cs` | 67 |
| `server/ParametricMusic.Tests/VoiceLeadingControllerTests.cs` | 68 |
| `server/ParametricMusic.Tests/ProgressionAnalysisServiceTests.cs` | 71 |
| `server/ParametricMusic.Tests/ProgressionControllerTests.cs` | 72 |
| `server/ParametricMusic.Tests/MidiExportServiceTests.cs` | 74 |
| `server/ParametricMusic.Tests/ExportControllerTests.cs` | 75 |
| `client/src/api/generated/index.ts` | 79 |

---

## New API Surface

| Method | Path | Description | Issue |
|--------|------|-------------|-------|
| `POST` | `/Chord/from-root` | Construct chord from root + quality | 65 |
| `POST` | `/VoiceLeading/between` | Minimal voice-leading analysis between two chords | 68 |
| `POST` | `/Progression/analyze` | Full analysis: continuity, centroid path, tension, suggestions | 72 |
| `POST` | `/Export/midi` | Export progression as `.mid` file | 75 |
| `POST` | `/Chord/identify` | *(stretch)* Identify chord from pitch-class set | 80 |
| `GET` | `/Scale/types` | *(stretch)* List scale type metadata | 81 |
| `POST` | `/Transform/rotate` | *(stretch)* Chromatic transposition of a chord | 82 |
