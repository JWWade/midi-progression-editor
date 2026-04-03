# MIDI Progression Editor - Architecture Guide

## Overview

**MIDI Progression Editor** is a parametric MIDI sequencer designed for editing and exploring chord progressions. It combines a React/TypeScript frontend with an ASP.NET Core Web API backend, enabling musical exploration through an interactive web interface.

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19 | UI framework |
| **Frontend Build** | Vite | 7 | Fast build tooling and dev server |
| **Frontend Language** | TypeScript | 5.9 | Type-safe JavaScript |
| **API Client** | openapi-typescript | 7.13 | Type generation from OpenAPI spec |
| **Backend** | ASP.NET Core Web API | .NET 10 | REST API server |
| **Backend Language** | C# | Latest (implicit usings) | Type-safe backend logic |
| **API Documentation** | Swagger/Swashbuckle | 10.1.4 | OpenAPI specification generation |
| **Testing** | xUnit | 2.9.3 | Backend unit tests |

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Application (http://localhost:5173)            │  │
│  │  - Feature-based folder structure                     │  │
│  │  - Auto-generated API types (openapi-typescript)      │  │
│  │  - Handwritten API client (fetch-based)               │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST
                   │ (localhost:5110)
┌──────────────────▼──────────────────────────────────────────┐
│              ASP.NET CORE WEB API                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Controllers (Health, Chord, Scale, Progression)      │  │
│  │  ↓                                                     │  │
│  │  Business Logic (ChordGenerator, ScaleGenerator,      │  │
│  │                  ProgressionAnalyzer)                  │  │
│  │  ↓                                                     │  │
│  │  DTOs & Models (Note enum, NoteInfo, ChordDto, etc.)  │  │
│  │  ↓                                                     │  │
│  │  Swagger (OpenAPI specification)                      │  │
│  └───────────────────────────────────────────────────────┘  │
│  Port: 5110 (HTTP), 7088 (HTTPS)                           │
└─────────────────────────────────────────────────────────────┘
```

### Key Communication Flow

1. **Frontend** imports auto-generated types from `src/api/generated/`
2. **Frontend** uses handwritten client functions in `src/api/client/`
3. **Client functions** make HTTP requests to backend API
4. **Backend** processes requests via Controllers and returns JSON
5. **Frontend** renders responses using React components

### Hardening Contracts (Epic 11, ISSUE-E11-01)

The following contracts are canonical for geometry and custom-chord identity logic. Any new feature or refactor that touches these paths must preserve these boundaries.

#### Visual Geometry Contract

All rendered polygon inputs must be derived in this order:

1. Normalize note values to pitch classes in 0..11.
2. Deduplicate pitch classes.
3. Circularly order notes for polygon traversal.
4. Root-rotate ordering when root context exists.

Do not create alternative ordering pipelines in rendering call sites.

#### Custom-Chord Identity Contract

Custom note-set labeling must follow one policy:

1. Exact-match path: map to a known quality/pattern only when the full canonical match succeeds.
2. Non-exact fallback path: when exact match fails, use deterministic fallback scoring/classification that avoids misleading labels.
3. Display formatting path: apply naming/formatting only after identity resolution is complete.

Do not collapse exact and fallback paths into ad-hoc UI heuristics.

#### Ownership Boundaries

- Low-level pitch-class operations: `client/src/features/chord/utils/`
- Polygon ordering and geometry derivation: `client/src/features/chromatic-circle/utils/`
- Identity scoring and policy: `client/src/features/current-chord/utils/`
- Display naming formatting: `client/src/features/current-chord/utils/`

Call sites in UI components should consume these utilities, not reimplement them.

#### Migration Constraints and Non-Goals

Migration constraints:

- Prefer moving duplicated logic into canonical modules before adding new behavior.
- Preserve current public API shapes unless a migration note is provided.
- Add parity/regression tests whenever ownership moves across modules.

Non-goals for this hardening lane:

- Introducing new chord families or theory models.
- Backend contract redesign.
- UI redesign work unrelated to geometry/identity correctness.

---

## Frontend Architecture

### Project Structure

```
client/
├── src/
│   ├── api/                              # API integration layer
│   │   ├── client/
│   │   │   └── index.ts                 # Minimal wrapper: creates client instance, re-exports types
│   │   ├── generated/
│   │   │   └── index.ts                 # Auto-generated: types + client functions (DO NOT EDIT)
│   │   └── index.ts                      # Public exports
│   │
│   ├── app/                              # Application bootstrap
│   │   ├── App.tsx                      # Root component
│   │   ├── main.tsx                     # Entry point
│   │   ├── components/
│   │   │   └── AppHeader.tsx            # Header: visualization toggles, scale selector, cursor modes, theme
│   │   ├── providers/                   # Context providers
│   │   │   ├── ThemeContext.ts          # Theme type and context definition
│   │   │   ├── ThemeProvider.tsx        # Persistent dark/light theme (localStorage)
│   │   │   ├── useTheme.ts              # useTheme() hook
│   │   │   ├── EnharmonicContext.ts     # Enharmonic context (useFlats, pitchClasses, toggleEnharmonic)
│   │   │   ├── EnharmonicProvider.tsx   # Enharmonic provider (sharp/flat toggle, pitch-class mapping)
│   │   │   └── useEnharmonic.ts         # useEnharmonic() hook
│   │   ├── routes/                      # Client-side routing (placeholder)
│   │   └── store/                       # Global state management (placeholder)
│   │
│   ├── features/                         # Feature modules (feature-based architecture)
│   │   ├── audio/                        # In-browser chord audio playback
│   │   │   ├── hooks/                   # usePlayChord and related hooks
│   │   │   └── utils/                   # Audio synthesis helpers
│   │   │
│   │   ├── chord/                        # Core chord data, types & utilities
│   │   │   ├── api/                     # Chord-related API calls
│   │   │   ├── components/              # Chord selector UI (dropdown)
│   │   │   ├── constants/               # ChordQualityColors, chord definitions
│   │   │   ├── data/                    # Static chord interval tables
│   │   │   ├── types/                   # ChordType, ChordShape, etc.
│   │   │   └── utils/                   # Transpose, interval helpers
│   │   │
│   │   ├── chord-animation/              # Animated chord transitions
│   │   │   └── hooks/                   # useChordMorphing (easeInOutCubic, 260ms)
│   │   │
│   │   ├── chord-geometry/               # Polygon vertex calculations
│   │   │   └── utils/                   # CHORD_SHAPES, geometry helpers
│   │   │
│   │   ├── chord-inspection/             # Chord detail analysis panel
│   │   │   ├── components/              # ChordInspectionPanel component
│   │   │   ├── types/                   # Panel prop types
│   │   │   └── utils/                   # Analysis utilities
│   │   │
│   │   ├── chord-intervals/              # Interval pattern visualisation
│   │   │   ├── components/              # Interval display component
│   │   │   └── utils/                   # Interval calculation helpers
│   │   │
│   │   ├── chord-morphing/               # Smooth polygon morphing
│   │   │   ├── hooks/                   # Morphing animation hooks
│   │   │   └── utils/                   # Interpolation helpers
│   │   │
│   │   ├── midi-export/                  # MIDI file export
│   │   │   ├── components/              # MidiExportControls (BPM, beats/chord, export button)
│   │   │   ├── hooks/                   # useMidiExport (BPM/beats state, export trigger)
│   │   │   └── utils/                   # midiBuilder (SMF binary construction)
│   │   │
│   │   ├── chromatic-circle/             # Main 12-note circle visualisation
│   │   │   ├── api/                     # Scale API calls (getDiatonicNotes)
│   │   │   ├── components/              # ChromaticCircle SVG component
│   │   │   ├── constants/               # visualConstants (radii, fonts, colours)
│   │   │   ├── hooks/                   # Circle interaction hooks
│   │   │   ├── types/                   # Circle prop/state types
│   │   │   └── utils/                   # geometry, noteStyles, scaleUtils, etc.
│   │   │
│   │   ├── color-language/               # Quality-based color system
│   │   │   ├── constants/               # Color palette constants
│   │   │   └── utils/                   # chordColorUtils, harmonyOpacity, etc.
│   │   │
│   │   ├── current-chord/                # Current-chord info panel
│   │   │   ├── components/              # CurrentChordPanel component
│   │   │   ├── types/                   # Panel types
│   │   │   └── utils/                   # Thumbnail geometry helpers
│   │   │
│   │   ├── legend/                       # Visual legend for chord quality colours and note opacity
│   │   │   └── components/              # VisualLegend component
│   │   │
│   │   ├── progression-sidebar/          # Chord progression sidebar
│   │   │   ├── components/              # ProgressionSidebar, chord tile components
│   │   │   ├── constants/               # MAX_PROGRESSION_LENGTH (8), etc.
│   │   │   └── hooks/                   # useProgression (session-only state)
│   │   │
│   │   ├── scale/                        # Scale generation & display
│   │   │   ├── api/                     # POST /Scale/from-root wrapper
│   │   │   ├── components/              # Scale display components
│   │   │   ├── hooks/                   # useScale hook
│   │   │   ├── types/                   # ScaleType (8 modes), SCALE_INTERVALS, SCALE_LABELS
│   │   │   └── utils/                   # Scale helpers
│   │   │
│   │   ├── harmonic-graph/               # Harmonic relationship graph; shortest voice-leading path
│   │   │   └── utils/                   # findShortestVoiceLeading (Dijkstra's on 19-node T-canonical graph)
│   │   │
│   │   ├── ii-v-suggestions/             # Harmonic bridge suggestions (ii–V, tritone-sub, backchains)
│   │   │   ├── types/                   # BridgeSuggestion, BridgeType, BridgeRequest
│   │   │   └── utils/                   # suggestBridges, buildBridge, scoreCandidate, bridgeLabel
│   │   │
│   │   ├── negative-harmony/             # Negative harmony pitch-class reflection transform
│   │   │   ├── types/                   # Axis, TransformScope, NegativeHarmonyResult
│   │   │   └── utils/                   # reflectPitchClass, applyNegativeHarmony
│   │   │
│   │   ├── tutorial/                     # Interactive first-use tutorial (tooltips & modals)
│   │   │   ├── components/              # TutorialTooltip, TutorialModal
│   │   │   ├── context/                 # TutorialContext, TutorialProvider
│   │   │   ├── data/                    # tutorials.ts (TUTORIAL_CONTENT_VERSION, ALL_TUTORIAL_STEPS)
│   │   │   ├── hooks/                   # useTutorial
│   │   │   ├── types/                   # TutorialStep, TutorialDefinition, etc.
│   │   │   └── utils/                   # triggerManager (action/state/idle/composite triggers)
│   │   │
│   │   └── voice-leading/                # Voice-leading path utilities
│   │       └── utils/                   # closeVoiceChord, minimalMotionVoicing
│   │
│   ├── shared/                           # Shared across features
│   │   ├── components/                  # Reusable components
│   │   ├── hooks/                       # Reusable hooks
│   │   ├── types/
│   │   │   └── CursorMode.ts            # 'info' | 'select' cursor interaction modes
│   │   └── utils/                       # Helper functions
│   │
│   ├── assets/                           # Static assets (images, etc.)
│   ├── styles/                           # Global styles
│   └── index.css                         # Global CSS
│
├── public/                                # Static files (served as-is)
├── .env.example                           # Environment variable template
├── eslint.config.js                       # ESLint configuration (flat config)
├── tsconfig.json                          # TypeScript root configuration
├── tsconfig.app.json                      # App TypeScript configuration
├── tsconfig.node.json                     # Build tools TypeScript configuration
├── vite.config.ts                         # Vite configuration
├── package.json                           # Dependencies and scripts
└── README.md                              # Frontend-specific documentation
```

### Architecture Patterns

#### Feature-Based Structure

Each feature module is self-contained with:
- **api/**: Feature-specific API calls (wrapping shared client)
- **components/**: Feature React components
- **hooks/**: Feature-specific custom hooks
- **types/**: Feature TypeScript types
- **utils/**: Feature helper functions

#### API Client Pattern

**Unified Code Generation Approach**:

The API client is automatically generated from the OpenAPI specification. This ensures perfect synchronization between specification, types, and client code—no manual updates needed.

1. **Generated Client** (`src/api/generated/`):
   - Auto-generated types AND client functions from OpenAPI spec
   - Created via `npm run generate:api` from running backend
   - Includes all operations, schemas, and response types
   - **Never edit manually**

2. **Client Wrapper** (`src/api/client/`):
   - Minimal configuration layer
   - Creates pre-configured client instance with base URL
   - Re-exports all generated types
   - Single source for API configuration

**Usage in Components**:

```typescript
import { client } from '@/api/client';

// All operations are fully typed
const health = await client.get('/Health');
const scale = await client.post('/Scale/from-root', {
  query: { note: 'C' },
  body: { scaleType: 'major' }
});
```

**Benefits**:
- ✅ No manual function definitions to maintain
- ✅ Automatic type safety from OpenAPI spec
- ✅ Single source of truth (the backend spec)
- ✅ IDE autocomplete on all operations
- ✅ Change backend API → Regenerate → Everything updates

#### Path Alias

Configured in `vite.config.ts`:
```typescript
alias: {
  '@': '/src'
}
```

Use in imports:
```typescript
import { SomeComponent } from '@/shared/components';  // instead of ../../../shared/...
```

### Current Implementation Status

- ✅ **Chromatic Circle**: Full SVG visualisation with diatonic transparency, chord-tone emphasis, colour-responsive background, and note labels
- ✅ **Chord Selector**: Dropdown for selecting root note and chord quality across all 8 chord types
- ✅ **Chord Shapes**: Triangles for triads, quadrilaterals for seventh chords; dual-layer overlay supported
- ✅ **Chord Animation**: Smooth 260 ms easeInOutCubic polygon morphing on chord changes
- ✅ **Color Language**: Quality-based colour grammar (major → amber, minor → blue, dim → purple, aug → orange, dom7 → red-orange) with radial gradient fills
- ✅ **Current-Chord Panel**: Displays chord identity, stylised geometric thumbnail, and add-to-progression button
- ✅ **Progression Sidebar**: Right-hand vertical sidebar with chord tiles, thumbnails, add/remove controls, maximum 8 chords, session-only persistence
- ✅ **Voice Leading**: Utility functions for calculating voice-leading paths between consecutive chords
- ✅ **Audio Playback**: In-browser chord audio playback
- ✅ **Scale Modes**: 8 scale types supported client-side (Major, Natural Minor, Harmonic Minor, Melodic Minor, Dorian, Phrygian, Lydian, Mixolydian); diatonic highlighting computed locally via `SCALE_INTERVALS`
- ✅ **Scale Integration**: Scale generation via backend API (`/Scale/from-root`) available; diatonic circle highlighting uses client-side `SCALE_INTERVALS` for all 8 modes
- ✅ **Chord Inspection**: `ToneInfoPanel` displays note name, chord role, interval from root, and frequency when a note is clicked in Info mode
- ✅ **Cursor Modes**: Info mode (click a note to inspect it) and Select mode (click notes to toggle a custom selection); keyboard shortcuts `I` / `S`
- ✅ **AppHeader**: Visualization toggles (Voice Leads, Extension, Centroid, Intervals), scale mode selector, cursor mode buttons, and theme toggle
- ✅ **Dark/Light Theme**: Persistent theme toggle stored in `localStorage`; applied via `data-theme` attribute on `<html>`
- ✅ **MIDI Export**: Export current chord progression as a standard MIDI file (`.mid`); configurable BPM (40–240) and beats-per-chord (1, 2, 4)
- ✅ **Enharmonic Toggle**: Global sharp/flat notation switch via `EnharmonicProvider`; `useEnharmonic()` exposes `useFlats`, `pitchClasses`, and `toggleEnharmonic`
- ✅ **Visual Legend**: `VisualLegend` component displays chord quality colour bands (with polygon glyphs) and note opacity levels (diatonic, chord-tone chromatic, chromatic)
- ✅ **ii–V Suggestions**: `suggestBridges` generates ranked harmonic bridge chords (diatonic ii–V, tritone substitutions, backchains) between any two chords in the progression
- ✅ **Harmonic Graph**: `findShortestVoiceLeading` (Dijkstra's algorithm on a 19-node T-canonical chord graph) computes the optimal voice-leading path between any two chords
- ✅ **Structure**: Feature-based architecture across modules

---

## Backend Architecture

### Project Structure

```
server/ParametricMusic.Api/
├── Controllers/
│   ├── HealthController.cs               # GET /Health
│   ├── ChordController.cs                # POST /Chord/from-root, POST /Chord/quartal/from-scale
│   ├── ScaleController.cs                # POST /Scale/from-root
│   └── ProgressionController.cs          # POST /Progression/analyze
│
├── Models/
│   ├── Note.cs                           # Enum (C=0...B=11) + extensions
│   ├── ChordQuality.cs                   # Enum (Major, Minor, Diminished, Augmented, Dominant7, Major7, Minor7, HalfDiminished7)
│   ├── ScaleType.cs                      # Enum (Major, NaturalMinor, HarmonicMinor, MelodicMinor, Dorian, Phrygian, Lydian, Mixolydian)
│   ├── NoteInfo.cs                       # DTO (Index: int, Name: string)
│   ├── ChordDto.cs                       # DTO (Root, Quality, DisplayName, PitchClasses, NoteNames)
│   ├── ChordFromRootRequestDto.cs        # DTO (Quality: ChordQuality)
│   ├── PrimitiveShape.cs                 # Enum (Triangle, Quadrilateral, etc.)
│   ├── ScaleOptionsDto.cs                # DTO (ScaleType field)
│   ├── ProgressionAnalyzeRequestDto.cs   # DTO (Chords list of ChordRef)
│   ├── ProgressionAnalyzeResponseDto.cs  # DTO (Steps, ContinuityScore, TensionTrend)
│   ├── HealthResponse.cs                 # DTO (Status: string, Timestamp: DateTime)
│   ├── QuartalChordDto.cs                # DTO (Root, Quality, DisplayName, PitchClasses, NoteNames, Quartal metadata)
│   └── DiatonicQuartalRequestDto.cs      # DTO (ScaleType, Degree 1–7, Size 2–7)
│
├── Services/
│   ├── ChordGenerator.cs                 # Chord construction from root + quality
│   ├── ScaleGenerator.cs                 # Scale generation logic (all 8 modes)
│   ├── ProgressionAnalyzer.cs            # Progression motion, continuity, and tension
│   └── QuartalChordGenerator.cs          # Diatonic quartal chord builder and identifier
│
├── Configuration/
│   ├── Program.cs                        # App configuration, middleware setup
│   ├── Properties/
│   │   └── launchSettings.json          # Launch profiles & ports
│   ├── appsettings.json                  # Configuration
│   └── appsettings.Development.json      # Development overrides
│
├── ParametricMusic.Api.csproj            # Project file
└── ParametricMusic.Api.http              # HTTP requests for manual testing

server/ParametricMusic.Tests/
├── ChordGeneratorTests.cs                # Unit tests for ChordGenerator
├── ScaleGeneratorTests.cs                # Unit tests for ScaleGenerator
├── ProgressionAnalyzerTests.cs           # Unit tests for ProgressionAnalyzer
├── HealthControllerIntegrationTests.cs   # Integration tests for /Health
├── ChordControllerIntegrationTests.cs    # Integration tests for /Chord/from-root
├── ScaleControllerIntegrationTests.cs    # Integration tests for /Scale/from-root
├── ProgressionControllerIntegrationTests.cs # Integration tests for /Progression/analyze
├── GlobalUsings.cs                       # Global xUnit usings
└── ParametricMusic.Tests.csproj
```

### Architecture Pattern

**Layered Architecture**:

```
Controller Layer (HealthController, ChordController, ScaleController, ProgressionController)
    ↓
Services Layer (ChordGenerator, ScaleGenerator, ProgressionAnalyzer)
    ↓
DTOs & Models Layer (Note, ChordQuality, ScaleType, NoteInfo, ChordDto, etc.)
```

### Key Components

#### Controllers

**HealthController**
```csharp
[HttpGet]
public IActionResult Get() => Ok(new HealthResponse { Status = "healthy", Timestamp = DateTime.UtcNow });
```
- Endpoint: `GET /Health`
- Purpose: Simple liveness check
- Response: `HealthResponse` — `{ status: "healthy", timestamp: "<ISO 8601 UTC>" }`

**ChordController**
```csharp
[HttpPost("from-root")]
public IActionResult BuildChord([FromQuery] Note note, [FromBody] ChordFromRootRequestDto body)

[HttpPost("quartal/from-scale")]
public IActionResult BuildQuartalChord([FromQuery] Note note, [FromBody] DiatonicQuartalRequestDto body)
```
- Endpoint: `POST /Chord/from-root`
- Query: `note` (enum: C, CSharp, D, DSharp, E, F, FSharp, G, GSharp, A, ASharp, B)
- Body: `{ "quality": "Major" | "Minor" | "Diminished" | "Augmented" | "Dominant7" | "Major7" | "Minor7" | "HalfDiminished7" }`
- Response: `ChordDto` with root, quality, display name, pitch classes, and note names

- Endpoint: `POST /Chord/quartal/from-scale`
- Query: `note` (enum: C…B — scale root)
- Body: `{ "scaleType": ScaleType, "degree": 1–7, "size": 2–7 }`
- Response: `QuartalChordDto` with root, pitch classes, note names, and `quartal` metadata (isDiatonic, scaleRoot, scaleType, degree, size)

**ScaleController**
```csharp
[HttpPost("from-root")]
public IActionResult BuildScale([FromQuery] Note note, [FromBody] ScaleOptionsDto body)
```
- Endpoint: `POST /Scale/from-root`
- Query: `note` (enum: C, CSharp, D, DSharp, E, F, FSharp, G, GSharp, A, ASharp, B)
- Body: `{ "scaleType": "Major" | "NaturalMinor" | "HarmonicMinor" | "MelodicMinor" | "Dorian" | "Phrygian" | "Lydian" | "Mixolydian" }`
- Response: `NoteInfo[]` array with index and name for each scale tone

**ProgressionController**
```csharp
[HttpPost("analyze")]
public IActionResult Analyze([FromBody] ProgressionAnalyzeRequestDto body)
```
- Endpoint: `POST /Progression/analyze`
- Body: `{ "chords": [{ "root": 0, "quality": "Major", ... }, ...] }` (1–8 chords)
- Response: `ProgressionAnalyzeResponseDto` with step-by-step motion, continuity score, and tension trend

#### Models & Enums

**Note Enum**
```csharp
public enum Note { C=0, CSharp, D, DSharp, E, F, FSharp, G, GSharp, A, ASharp, B }
```
- Pitch class values (0-11)
- Display attributes: `[Display(Name = "C#")]` etc.
- Extensions: `GetDisplayName()`, `TryParse(string)`

**ChordQuality Enum**
```csharp
public enum ChordQuality { Major, Minor, Diminished, Augmented, Dominant7, Major7, Minor7, HalfDiminished7 }
```
- 4 triads + 4 seventh chord qualities
- Serialized as strings in JSON responses

**ScaleType Enum**
```csharp
public enum ScaleType { Major, NaturalMinor, HarmonicMinor, MelodicMinor, Dorian, Phrygian, Lydian, Mixolydian }
```
- All 8 diatonic modes and common scales fully implemented server-side
- Matches the frontend `ScaleType` values exactly (case-insensitive JSON binding)

**ChordDto**
```csharp
public class ChordDto {
    public string Root { get; init; }        // Root note display name (e.g., "C#")
    public ChordQuality Quality { get; init; }
    public string DisplayName { get; init; } // e.g., "C# Major"
    public int[] PitchClasses { get; init; } // MIDI pitch classes (0-11)
    public string[] NoteNames { get; init; } // Display names for each pitch class
}
```

**NoteInfo DTO**
```csharp
public class NoteInfo {
    public int Index { get; init; }      // MIDI pitch class (0-11)
    public string Name { get; init; }     // Display name (e.g., "C#")
}
```

**HealthResponse DTO**
```csharp
public class HealthResponse {
    public string Status { get; init; }    // e.g., "healthy"
    public DateTime Timestamp { get; init; } // UTC timestamp
}
```

**QuartalChordDto**
```csharp
public class QuartalChordDto {
    public string Root { get; init; }          // Root note display name
    public string Quality { get; init; }        // Always "Quartal"
    public string DisplayName { get; init; }    // e.g., "C Quartal3 (I)"
    public int[] PitchClasses { get; init; }   // MIDI pitch classes (size voices)
    public string[] NoteNames { get; init; }   // Display names for each voice
    public QuartalMetadata Quartal { get; init; } // Quartal-specific metadata
}
```

**QuartalMetadata DTO**
```csharp
public class QuartalMetadata {
    public bool IsDiatonic { get; init; }   // Always true for diatonic quartal
    public string ScaleRoot { get; init; }  // Scale root note display name
    public string ScaleType { get; init; }  // Scale type string (e.g., "Major")
    public int Degree { get; init; }        // Scale degree (1–7)
    public int Size { get; init; }          // Number of voices (default 3)
}
```

**DiatonicQuartalRequestDto**
```csharp
public class DiatonicQuartalRequestDto {
    public ScaleType ScaleType { get; set; }  // Scale type to derive diatonic fourths from
    public int Degree { get; set; }            // Scale degree, 1-based (1..7)
    public int Size { get; set; }              // Number of voices to stack (2..7, default 3)
}
```

#### Services

**ChordGenerator**
- Implements `IChordService`; registered as a singleton via DI; builds a `ChordDto` from a root `Note` and `ChordQuality`
- Applies standard Western tertian harmony interval patterns (triads and seventh chords)
- Throws `ArgumentOutOfRangeException` for unsupported quality values

**ScaleGenerator**
- Implements `IScaleService`; registered as a singleton via DI; builds a `NoteInfo[]` from a root pitch-class index and `ScaleType`
- Supports all 8 scale types via a lookup dictionary of interval arrays
- Throws `ArgumentOutOfRangeException` for unsupported scale type values

**ProgressionAnalyzer**
- Implements `IProgressionService`; registered as a singleton via DI; analyzes step-by-step voice motion, computes a normalized continuity score, and returns a per-chord tension trend
- Continuity score formula: `1 − (averageMotion / 12)` (higher = smoother voice leading)
- Tension trend: proportion of "rough" interval pairs (tritone, minor 2nd) per chord
- Input limited to 1–8 chords

**QuartalChordGenerator**
- Implements `IQuartalChordService`; registered as a singleton via DI; builds and identifies diatonic quartal chords for any 7-note scale
- `BuildDiatonicQuartal(root, scaleType, degree, size)`: stacks diatonic fourths using `Q(i) = [S[i], S[(i+3)%7], S[(i+6)%7], …]`
- `IdentifyDiatonicQuartal(root, scaleType, pitchClasses, size)`: searches all 7 scale degrees for a matching pitch-class set
- Supports degree range 1–7 and voice stack size 2–7

### Configuration

#### Program.cs Setup

```csharp
// DI: Register harmony-engine services as singletons (stateless pure functions)
builder.Services.AddSingleton<IChordService, ChordGenerator>();
builder.Services.AddSingleton<IScaleService, ScaleGenerator>();
builder.Services.AddSingleton<IProgressionService, ProgressionAnalyzer>();
builder.Services.AddSingleton<IQuartalChordService, QuartalChordGenerator>();

// CORS: Allow frontend dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalDev", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .WithMethods("GET", "POST", "OPTIONS"));
});

// Swagger: OpenAPI spec generation & UI
builder.Services.AddSwaggerGen();

// JSON: Enum serialization as strings
builder.Services.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(allowIntegerValues: false));
});
```

#### Launch Settings

Port configuration in `launchSettings.json`:
- **HTTP**: `http://localhost:5110` (primary)
- **HTTPS**: `https://localhost:7088` (secondary)
- Environment: `Development`

### Testing

**xUnit Tests** in `ParametricMusic.Tests/`:

```csharp
public class ScaleGeneratorTests
{
    private readonly IScaleService _service = new ScaleGenerator();

    [Theory]
    [InlineData(ScaleType.Major, new[] { 0, 2, 4, 5, 7, 9, 11 })]
    [InlineData(ScaleType.Dorian, new[] { 0, 2, 3, 5, 7, 9, 10 })]
    public void BuildScale_RootC_ReturnsExpectedPitchClasses(ScaleType scaleType, int[] expected)
    {
        var result = _service.BuildScale(0, scaleType);
        Assert.Equal(expected, result.Select(n => n.Index));
    }
}
```

Tests cover:
- `ChordGeneratorTests`: interval correctness for all 8 chord qualities, note name accuracy, wraparound behavior
- `ScaleGeneratorTests`: seven-note output for all 8 scale types, pitch-class wraparound, note name accuracy
- `ProgressionAnalyzerTests`: step motion values, continuity score formula, tension trend per chord
- Integration tests for each controller: happy-path responses, enum validation, boundary conditions

---

## API Contract

### OpenAPI/Swagger Integration

The backend automatically generates an OpenAPI specification that describes all endpoints, request/response types, and parameters. This specification enables **type-safe API client generation**.

### Type Generation Workflow

```
┌─────────────────────────────────────┐
│  Backend Running (http://localhost:  │
│  5110/swagger/v1/swagger.json)       │
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  Developer Runs:                      │
│  npm run generate:api                │
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  openapi-typescript Fetches Spec     │
│  and Generates TypeScript Types      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  client/src/api/generated/index.ts   │
│  Created with full type definitions  │
└──────────────────────────────────────┘
```

### Synchronization Strategy

**Keep frontend and backend in sync:**

1. **Backend changes** → Update controllers/DTOs → Start backend
2. **Run** `npm run generate:api` → Regenerates types
3. **Frontend changes** → Import fresh types → No type errors
4. **Commit** both backend and generated types to git

⚠️ **Critical**: Never edit `src/api/generated/index.ts` manually. Always regenerate.

### Current API Endpoints

| Method | Endpoint | Parameters | Response |
|--------|----------|-----------|----------|
| `GET` | `/Health` | None | `HealthResponse` — `{ status: string, timestamp: string }` |
| `POST` | `/Chord/from-root` | `note` (query), `{ quality: ChordQuality }` (body) | `ChordDto` |
| `POST` | `/Chord/quartal/from-scale` | `note` (query), `{ scaleType, degree, size }` (body) | `QuartalChordDto` |
| `POST` | `/Scale/from-root` | `note` (query), `{ scaleType: ScaleType }` (body) | `NoteInfo[]` |
| `POST` | `/Progression/analyze` | `{ chords: ChordRef[] }` (body, 1–8 chords) | `ProgressionAnalyzeResponseDto` |

**Example Request (chord)**:
```bash
curl -X POST "http://localhost:5110/Chord/from-root?note=C" \
  -H "Content-Type: application/json" \
  -d '{"quality":"Major"}'
```

**Example Response (chord)**:
```json
{
  "root": "C",
  "quality": "Major",
  "displayName": "C Major",
  "pitchClasses": [0, 4, 7],
  "noteNames": ["C", "E", "G"]
}
```

**Example Request (scale)**:
```bash
curl -X POST "http://localhost:5110/Scale/from-root?note=C" \
  -H "Content-Type: application/json" \
  -d '{"scaleType":"Major"}'
```

**Example Response (scale)**:
```json
[
  { "index": 0, "name": "C" },
  { "index": 2, "name": "D" },
  { "index": 4, "name": "E" },
  { "index": 5, "name": "F" },
  { "index": 7, "name": "G" },
  { "index": 9, "name": "A" },
  { "index": 11, "name": "B" }
]
```

---

## Development Workflow

### Prerequisites

- **Node.js** 18+ (for frontend)
- **.NET 10 SDK** (for backend)
- **npm** (comes with Node.js)

### Setup

#### First-Time Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd midi-progression-editor
   ```

2. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Restore backend packages**
   ```bash
   cd server/ParametricMusic.Api
   dotnet restore
   cd ../..
   ```

#### Local Development

**Option 1: Automated (macOS / Linux)**
```bash
chmod +x run-dev.sh
./run-dev.sh
```
- Frees port 5110 if already in use
- Starts backend on `http://localhost:5110`
- Starts frontend on `http://localhost:5173`
- Press Ctrl+C to stop both servers

**Option 2: Automated (Windows)**
```bat
run-dev.bat
```
- Kills any existing processes
- Starts backend on `http://localhost:5110`
- Starts frontend on `http://localhost:5173`
- Opens separate terminal windows for each

**Option 3: Manual**

Terminal 1 - Backend:
```bash
cd server/ParametricMusic.Api
dotnet run
# Listens on http://localhost:5110
# Swagger UI at http://localhost:5110/swagger
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
# Listens on http://localhost:5173
```

### Environment Variables

**Frontend** (`client/.env`):
```
VITE_API_BASE_URL=http://localhost:5110
```

Default (if not set): `http://localhost:5110`

Create `client/.env.local` to override for local development:
```bash
cd client
echo 'VITE_API_BASE_URL=http://localhost:5110' > .env.local
```

### Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Backend HTTP | 5110 | `http://localhost:5110` |
| Backend HTTPS | 7088 | `https://localhost:7088` |
| Frontend Dev | 5173 | `http://localhost:5173` |
| Swagger UI | 5110 | `http://localhost:5110/swagger` |

⚠️ **Important**: API_BASE_URL must match backend port (5110). The default was historically 5000 but has been updated.

---

## Code Generation

### API Client Type Generation

Generate TypeScript types **and client functions** from OpenAPI spec:

```bash
cd client
npm run generate:api
```

This command:
1. Fetches OpenAPI spec from `http://localhost:5110/swagger/v1/swagger.json`
2. Generates TypeScript types for all schemas
3. Generates typed client functions for all operations
4. Outputs everything into `src/api/generated/index.ts`

**Requirements**:
- Backend must be running on port 5110
- Network access to localhost (usually allowed locally)

**When to regenerate**:
- After changing any API endpoint in backend
- After changing request/response DTOs
- After changing enum values
- After adding new controllers

**Workflow**:
1. Modify backend code (add controller, change DTO, change enum, etc.)
2. Run backend: `dotnet run`
3. Generate client: `npm run generate:api`
4. Use new types/functions in frontend (IDE will guide you)
5. Commit both backend changes and generated client code

**Example Generated Code**:
```typescript
// Fully typed client functions auto-generated from OpenAPI spec
export const getHealth = createOperation('GET', '/Health');
export const postScaleFromRoot = createOperation('POST', '/Scale/from-root');

// Full type safety - errors at compile time, not runtime
const result = await client.post('/Scale/from-root', {
  query: { note: 'C' },
  body: { scaleType: 'major' }
});
```

---

## Build & Deployment

### Frontend Build

```bash
cd client
npm run build
```

Outputs optimized files to `client/dist/`:
- TypeScript compiled to JavaScript
- Assets bundled and minified
- Vite handles code-splitting and tree-shaking

**Build process**:
1. TypeScript compilation (`tsc -b`)
2. Vite production build (rollup bundling)
3. Outputs ready-to-serve static files

### Backend Build

```bash
cd server/ParametricMusic.Api
dotnet build
```

Outputs to `bin/Debug/net10.0/`:
- Compiled assemblies
- Dependencies resolved
- Ready to run via `dotnet run`

**For production publish**:
```bash
dotnet publish -c Release -o ./publish
```

### Running Tests

**Backend tests**:
```bash
cd server/ParametricMusic.Tests
dotnet test
```

**Frontend tests**: Vitest is configured; `midiBuilder.test.ts` covers MIDI file construction. Run with `cd client && npm test`.

---

## Known Issues & Future Improvements

### ⚠️ Known Issues

_No blocking issues — see the [issues/](issues/) directory for the full backlog._

### 🚀 Future Improvements

- [ ] Add state management (Zustand or Redux) — `app/store/` directory is scaffolded
- [ ] Implement client-side routing — `app/routes/` directory is scaffolded
- [ ] Docker configuration
- [ ] Performance monitoring
- [ ] Expand frontend test coverage (components, hooks)
- [ ] Add quartal chord visualisation to the chromatic circle

---

## References

- **Frontend**: [React 19 Docs](https://react.dev), [Vite Docs](https://vitejs.dev)
- **Backend**: [ASP.NET Core Docs](https://learn.microsoft.com/en-us/aspnet/core/), [Swashbuckle Docs](https://github.com/domaindrivendev/Swashbuckle.AspNetCore)
- **API Generation**: [openapi-typescript](https://openapi-ts.dev/)
- **Testing**: [xUnit Docs](https://xunit.net/)
- **Geometric Harmony System**: [docs/geometric-harmony-system.md](docs/geometric-harmony-system.md)

---

**Last Updated**: March 21, 2026
