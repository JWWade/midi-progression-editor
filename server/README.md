# Server Backend

This folder contains the ASP.NET Core backend for the MIDI Progression Editor. The backend is currently a stateless music-theory API: it exposes controller endpoints for health checks, chord construction, scale generation, and progression analysis, but it does not yet persist projects, manage users, or orchestrate longer-running sequencing workflows.

## Current Scope

- Framework: ASP.NET Core on .NET 10
- API style: controller-based REST API
- Documentation: Swagger/OpenAPI in development
- Test coverage: unit tests for domain logic plus integration tests for controller contracts
- State model: in-memory only, no database or file persistence

## Projects

- `ParametricMusic.Api/`: web API project
- `ParametricMusic.Tests/`: xUnit test project covering backend logic and HTTP behavior

## Implemented Operations

| Controller | Route | Purpose |
| --- | --- | --- |
| `HealthController` | `GET /Health` | Basic API health response with UTC timestamp |
| `ChordController` | `POST /Chord/from-root?note={Note}` | Build a chord from a root note and chord quality |
| `ChordController` | `POST /Chord/quartal/from-scale?note={Note}` | Build a diatonic quartal chord from a scale root, type, and degree |
| `ScaleController` | `POST /Scale/from-root?note={Note}` | Generate a scale from a root note and scale type |
| `ProgressionController` | `POST /Progression/analyze` | Analyze progression motion, continuity, and tension |

## Domain Capabilities

### Chord generation

The backend supports these chord qualities:

- `Major`
- `Minor`
- `Diminished`
- `Augmented`
- `Dominant7`
- `Major7`
- `Minor7`
- `HalfDiminished7`

Optional primitive shape metadata can be accepted and round-tripped on chord payloads.

### Scale generation

The backend supports these scale types:

- `Major`
- `NaturalMinor`
- `HarmonicMinor`
- `MelodicMinor`
- `Dorian`
- `Phrygian`
- `Lydian`
- `Mixolydian`

### Progression analysis

The progression endpoint currently returns:

- step-by-step motion between adjacent chords
- a normalized continuity score
- a tension trend across the chord sequence

Requests are limited to 1 through 8 chords.

### Quartal chord generation

The quartal endpoint builds a diatonic quartal chord by stacking diatonic fourths:

```
Q(i) = [ S[i], S[(i+3)%7], S[(i+6)%7], … ]
```

where `S[0..6]` is the 7-note scale and `i` is the 0-based degree index. Supports 2–7 voices and all 8 scale types.

## Local Development

### Run the API

From `server/ParametricMusic.Api/`:

```bash
dotnet run
```

Typical local endpoints:

- API base URL: `http://localhost:5110`
- Swagger UI: `http://localhost:5110/swagger`
- Health check: `http://localhost:5110/Health`

### Run backend tests

From the repository root:

```bash
dotnet test midi-progression-editor.sln
```

Or from `server/ParametricMusic.Tests/`:

```bash
dotnet test
```

### Build backend only

From `server/ParametricMusic.Api/`:

```bash
dotnet build
```

## Current Architecture Notes

- Controllers call static domain services directly.
- JSON enum values are serialized as strings.
- CORS is configured for localhost development.
- Swagger is enabled in development.
- XML comments are included in generated OpenAPI when available.
- `HealthController` returns a typed `HealthResponse` DTO (not an anonymous object).
- `QuartalChordGenerator` is a static service alongside `ChordGenerator`, `ScaleGenerator`, and `ProgressionAnalyzer`.

This keeps the backend simple, but it also means there is no service abstraction, persistence layer, authentication, or versioned application boundary yet.

## Manual Review Workflow

We are reviewing controller operations one by one with the user driving requests and validation, while Copilot documents outcomes and applies fixes when issues are discovered.

The live walkthrough plan and result log live in [CONTROLLER-REVIEW.md](CONTROLLER-REVIEW.md).

## Gaps Not Yet Addressed

- persistent storage for saved progressions or sessions
- authentication or per-user data separation
- MIDI export or render jobs owned by the backend
- richer validation and problem-detail standardization across all endpoints
- deeper architectural separation between HTTP layer and domain layer

## Related Docs

- Root project overview: `../README.md`
- Architecture notes: `../ARCHITECTURE.md`
- Controller walkthrough log: `./CONTROLLER-REVIEW.md`