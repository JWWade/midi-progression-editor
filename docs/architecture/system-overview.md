# System Overview

High-level topology of the Parametric MIDI Sequencer: how the browser, frontend application, backend API, and music services relate to each other.

```mermaid
flowchart TD
    subgraph Browser["Browser"]
        direction TB
        UI["React + TypeScript\n(Vite 7 · port 5173)"]
        AudioCtx["Web Audio API\n(in-browser playback)"]
        MIDIFile[".mid export\n(client-side MIDI builder)"]
    end

    subgraph Backend["ASP.NET Core Web API (.NET 10 · port 5110)"]
        direction TB
        Controllers["Controllers\nHealth · Chord · Scale · Progression"]
        Services["Music Services\nChordGenerator · ScaleGenerator\nProgressionAnalyzer · QuartalChordGenerator"]
        Models["DTOs & Enums\nNote · ChordQuality · NoteInfo\nChordDto · ScaleDto · ProgressionDto"]
        Swagger["Swagger / OpenAPI\n(swagger.json)"]
    end

    User(["👤 User"]) -->|"Interacts with"| UI
    UI -->|"HTTP / JSON\nREST requests"| Controllers
    Controllers --> Services
    Services --> Models
    Controllers --> Models
    Backend --> Swagger
    Swagger -.->|"npm run generate:api\n(openapi-typescript)"| UI
    UI --> AudioCtx
    UI --> MIDIFile
    MIDIFile -->|"Download"| User
```

## Component Responsibilities

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| React Frontend | React 19, TypeScript 5.9, Vite 7 | Interactive UI, chord visualisation, audio playback, MIDI export |
| ASP.NET Core API | .NET 10, C# | Music theory computation, scale/chord generation, progression analysis |
| Web Audio API | Browser built-in | In-browser chord and arpeggio playback |
| MIDI Builder | `@tonejs/midi` | Client-side MIDI file construction and download |
| OpenAPI / Swagger | Swashbuckle 10.1.4 | API contract definition; drives TypeScript client code generation |
