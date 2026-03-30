# Architecture Audit — Parametric MIDI Sequencer

**Audit date:** 2026-03-30
**Auditor:** Copilot (automated audit via ISSUE-E9-04)
**Scope:** Full codebase — `client/` (React/TypeScript) and `server/` (ASP.NET Core C#)

---

## 1. Executive Summary

The Parametric MIDI Sequencer follows a clean feature-based architecture with well-defined
boundaries at every layer. The codebase shows strong fundamentals: strict TypeScript, nullable
C# reference types, explicit service interfaces, and clear feature module conventions. No
rewrites are required or recommended.

This audit identifies four medium-priority risks and zero critical risks. All risks are
manageable within the existing architecture; no major structural changes are warranted.

| Severity | Count | Notes |
|---|---|---|
| Critical | 0 | No blockers to feature development or correctness |
| High | 2 | Address before adding significant new features |
| Medium | 3 | Address within the next 2–3 epics |
| Low | 2 | Background hygiene; address opportunistically |

---

## 2. System Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════╗
║                         BROWSER                                  ║
║  ╔════════════════════════════════════════════════════════════╗  ║
║  ║  React Application  (http://localhost:5173)                ║  ║
║  ║                                                            ║  ║
║  ║  ┌───────────────┐   ┌──────────────────────────────────┐ ║  ║
║  ║  │  App Layer    │   │  Feature Modules (17)            │ ║  ║
║  ║  │  App.tsx      │──▶│  audio, chord, chord-animation,  │ ║  ║
║  ║  │  AppHeader    │   │  chord-geometry, chord-inspection │ ║  ║
║  ║  │  Providers    │   │  chord-intervals, chord-morphing  │ ║  ║
║  ║  │  (Theme,      │   │  chromatic-circle, color-language │ ║  ║
║  ║  │  Enharmonic)  │   │  current-chord, harmonic-graph   │ ║  ║
║  ║  └───────────────┘   │  ii-v-suggestions, legend,       │ ║  ║
║  ║                      │  midi-export, progression-sidebar │ ║  ║
║  ║  ┌───────────────┐   │  scale, voice-leading            │ ║  ║
║  ║  │ Shared Layer  │   └──────────────────────────────────┘ ║  ║
║  ║  │  types/       │                    │                    ║  ║
║  ║  │  utils/       │◀───────────────────┘                   ║  ║
║  ║  │  components/  │                                        ║  ║
║  ║  └───────────────┘                                        ║  ║
║  ║                                                            ║  ║
║  ║  ┌─────────────────────────────────────────────────────┐  ║  ║
║  ║  │  API Layer                                          │  ║  ║
║  ║  │  client/  ←── generated/index.ts (DO NOT EDIT)     │  ║  ║
║  ║  └────────────────────────┬────────────────────────────┘  ║  ║
║  ╚═══════════════════════════╪════════════════════════════════╝  ║
╚══════════════════════════════╪══════════════════════════════════╝
                               │ HTTP/REST (JSON)
                               │ localhost:5110
╔══════════════════════════════╪══════════════════════════════════╗
║              ASP.NET Core Web API                                ║
║                              │                                   ║
║  ┌───────────────────────────▼──────────────────────────────┐   ║
║  │  Controllers                                              │   ║
║  │  HealthController · ChordController                       │   ║
║  │  ScaleController · ProgressionController                  │   ║
║  └───────────────────────────┬──────────────────────────────┘   ║
║                              │ (DI interfaces)                   ║
║  ┌───────────────────────────▼──────────────────────────────┐   ║
║  │  Service Interfaces (stable boundaries)                   │   ║
║  │  IChordService · IScaleService                           │   ║
║  │  IProgressionService · IQuartalChordService               │   ║
║  └───────────────────────────┬──────────────────────────────┘   ║
║                              │ (concrete implementations)        ║
║  ┌───────────────────────────▼──────────────────────────────┐   ║
║  │  Harmony Engine (Services)                                │   ║
║  │  ChordGenerator · ScaleGenerator                          │   ║
║  │  ProgressionAnalyzer · QuartalChordGenerator              │   ║
║  └───────────────────────────┬──────────────────────────────┘   ║
║                              │                                   ║
║  ┌───────────────────────────▼──────────────────────────────┐   ║
║  │  DTOs & Models                                            │   ║
║  │  ChordDto · ChordRef · ProgressionAnalyzeRequestDto       │   ║
║  │  ProgressionAnalyzeResponseDto · ScaleContextDto          │   ║
║  │  NoteInfo · QuartalChordDto · Note (enum) · ChordQuality  │   ║
║  │  ScaleType · PrimitiveShape                               │   ║
║  └──────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 3. Module Boundaries and Responsibilities

### 3.1 Backend Layers

| Layer | Files | Responsibility | Boundary Rule |
|---|---|---|---|
| **Controllers** | `*Controller.cs` | HTTP request/response translation; input validation; routing | Never contain business logic; call one service per action |
| **Service Interfaces** | `I*Service.cs` | Stable contract between HTTP layer and harmony engine | Interface never changes without a version bump; `Controllers` and tests depend only on the interface |
| **Harmony Engine** | `*Generator.cs`, `ProgressionAnalyzer.cs` | Music-domain algorithms (interval stacking, voice-leading motion, scale derivation) | No HTTP concerns; pure functions; safe as singletons |
| **DTOs & Models** | `Models/` | Data shapes crossing the HTTP boundary | Serialisation-annotated; no domain logic inside DTOs |

All backend services are registered as **singletons** and are safe because they are fully stateless. See `Program.cs` for the DI configuration.

### 3.2 Frontend Layers

| Layer | Location | Responsibility | Boundary Rule |
|---|---|---|---|
| **App Layer** | `app/App.tsx`, `app/components/`, `app/providers/` | Root layout, context providers (Theme, Enharmonic), top-level state, route-level orchestration | Owns cross-cutting state; delegates domain logic to feature hooks |
| **Feature Modules** | `features/*/` | Self-contained domain slices; each has its own `index.ts` public API | Import from `shared/` and `@/features/…` via barrel only; no relative `../../` cross-feature imports |
| **Shared Layer** | `shared/` | Reusable primitives used by ≥2 features: `HarmonySnapshot`, `ScaleContext`, `CursorMode`, `Toast`, `logger` | No feature-specific logic; no imports from `features/` |
| **API Layer** | `api/` | OpenAPI-generated types + thin hand-written client wrapper | `generated/index.ts` is never edited manually; `client/index.ts` is the only public surface |

### 3.3 Frontend Feature Module Map

| Module | Responsibility | Public API surface |
|---|---|---|
| `audio` | Browser Web Audio synthesis and progression playback | `useProgressionPlayback`, `useAudioPlayback`, `AudioDebugPanel` |
| `chord` | Core chord domain: types, interval tables, transpose/rotate/mirror utilities, UI selectors | `ChordType`, `CHORD_INTERVALS`, `getChordPitchClasses`, `transposeChord`, `ChordSelector` |
| `chord-animation` | easeInOutCubic polygon morphing over 260 ms | `useChordMorphing` |
| `chord-geometry` | Static polygon vertex layout (triangle/quadrilateral) | `CHORD_SHAPES` |
| `chord-inspection` | Tone detail inspection panel | `ToneInfoPanel` |
| `chord-intervals` | Interval label visualisation overlay | `IntervalLabel` |
| `chord-morphing` | Low-level interpolation primitives used by `chord-animation` | `morphPoints`, `interpolateColor` |
| `chromatic-circle` | Main 12-note SVG visualisation, drag/select interactions | `ChromaticCircle` |
| `color-language` | Quality-to-colour mapping, harmony opacity | `getChordColor`, `getHarmonyOpacity`, `ChordQualityColors` |
| `current-chord` | Current-chord info panel and `Chord` domain type | `CurrentChordPanel`, `Chord` (type), `formatChordName` |
| `harmonic-graph` | T-canonical chord graph + Dijkstra shortest voice-leading path | `buildChordGraph`, `findShortestVoiceLeading` |
| `ii-v-suggestions` | Bridge suggestion engine (8 bridge types, scored) | `suggestBridges`, `BridgeSuggestion` |
| `legend` | Visual legend (colour bands + polygon glyphs) | `VisualLegend` |
| `midi-export` | MIDI file builder + JSON snapshot export/import | `buildMidiFile`, `MidiExportControls`, `useMidiExport` |
| `progression-sidebar` | Progression editor UI (≤8 chords, bridge UI, playback controls) | `ProgressionSidebar`, `useProgression` |
| `scale` | Scale generation and display (8 modes) | `ScaleSelector`, `getScaleNotes`, `ScaleType` |
| `voice-leading` | **Transform layer** — chord distance, canonicalisation, voicing optimisation | `chordDistance`, `canonicalizeChord`, `minimalMotionVoicing` |

---

## 4. Transform Layer Analysis

The **transform layer** consists of pure mathematical transformations applied to pitch-class
sets. These operations are independent of any particular musical theory model and form the
foundation for the harmony engine, bridge suggestions, and harmonic graph search.

### 4.1 Transform Layer Modules

```
voice-leading/utils/
├── canonicalizeChord.ts   — normalize(), transpose(), invert(), canonicalizeChord()
│                            (Lex-min pitch-class representative; transposition-invariant)
├── chordDistance.ts       — pitchClassDistance(), chordDistance(), chordMatching()
│                            (Minimal sum-of-movements voice-leading metric)
└── voicing.ts             — closeVoiceChord(), minimalMotionVoicing()
                             (Optimal voicing pair with lowest voice-leading cost)
```

The `chord/utils/transpose.ts` module is a companion but operates at a different level:
it works with named chord structures (root + quality + octave), while `voice-leading/utils/`
works with abstract pitch-class sets.

### 4.2 Transform Layer Boundary Rules

| Rule | Rationale |
|---|---|
| Transform functions take `number[]` pitch-class arrays, not `Chord` objects | Keeps the transform layer free of domain model coupling |
| Transform functions are pure — no side effects, no React imports | Enables direct reuse in backend-aligned unit tests |
| `voice-leading` module is imported by `harmonic-graph` and `ii-v-suggestions` only | Prevents transform primitives from leaking into UI components |

### 4.3 Frontend–Backend Metric Alignment

The same voice-leading distance concept is implemented independently in:
- **Frontend**: `voice-leading/utils/chordDistance.ts → chordDistance()`
- **Backend**: `ProgressionAnalyzer.cs → ComputeMotion()` (sum of minimal pitch-class
  distances)

Both compute the same metric. This is intentional duplication: the frontend needs the metric
for local bridge scoring (no round-trip) while the backend needs it for server-side
progression analysis. The `intervalContract.test.ts` contract test suite ensures the two
implementations agree on chord interval tables, partially guarding against drift.

**Risk (ARCH-03):** No direct automated test verifies the two distance implementations
return identical results for the same inputs. See § 6 Risk Catalog.

---

## 5. API Contract Reference

### 5.1 API Version

The backend API is versioned at **v1** via the Swagger document identifier:

```csharp
// Program.cs
options.SwaggerDoc("v1", new OpenApiInfo { Version = "v1", … });
```

The frontend `HarmonySnapshot` type carries a parallel schema version:

```typescript
// shared/types/HarmonySnapshot.ts
export type HarmonySnapshotVersion = 1;
```

These are independent versioning axes:
- **API version** governs HTTP endpoint shapes (routes, request/response DTOs).
- **Snapshot schema version** governs the on-disk/localStorage JSON format.

### 5.2 Endpoint Reference

| Method | Route | Request | Response | Notes |
|---|---|---|---|---|
| `GET` | `/health` | — | `{ status, timestamp }` | Always returns 200 in healthy state |
| `POST` | `/chord/from-root?note={Note}` | `ChordFromRootRequestDto` | `ChordDto` | `note` is a `Note` enum value (e.g. `C`, `CSharp`) |
| `POST` | `/chord/quartal/from-scale?note={Note}` | `DiatonicQuartalRequestDto` | `QuartalChordDto` | Stacks diatonic fourths: Q(i) = [S[i], S[(i+3)%7], S[(i+6)%7]] |
| `POST` | `/scale/from-root?note={Note}` | `ScaleOptionsDto` | `NoteInfo[]` | Returns all 7 scale tones with MIDI indices |
| `POST` | `/progression/analyze` | `ProgressionAnalyzeRequestDto` | `ProgressionAnalyzeResponseDto` | 1–8 chords; `scaleContext` accepted but not yet consumed |

### 5.3 Request / Response Shape Summary

**`ChordDto`** (chord build response):
```json
{
  "root": "C",
  "quality": "Major",
  "displayName": "C Major",
  "pitchClasses": [0, 4, 7],
  "noteNames": ["C", "E", "G"]
}
```

**`ProgressionAnalyzeRequestDto`**:
```json
{
  "chords": [
    { "root": "C", "quality": "Major" },
    { "root": "G", "quality": "Major" }
  ],
  "scaleContext": { "root": 0, "mode": "Major" }
}
```

**`ProgressionAnalyzeResponseDto`**:
```json
{
  "steps": [
    { "from": { "root": "C", "quality": "Major" },
      "to":   { "root": "G", "quality": "Major" },
      "motion": 2 }
  ],
  "continuityScore": 0.833,
  "tensionTrend": [0.25, 0.33]
}
```

### 5.4 Enum Mapping (Frontend ↔ Backend)

Frontend `ChordType` strings map to backend `ChordQuality` enum values:

| Frontend (`ChordType`) | Backend (`ChordQuality`) |
|---|---|
| `"major"` | `Major` |
| `"minor"` | `Minor` |
| `"dim"` | `Diminished` |
| `"aug"` | `Augmented` |
| `"dom7"` | `Dominant7` |
| `"maj7"` | `Major7` |
| `"min7"` | `Minor7` |
| `"halfdim7"` | `HalfDiminished7` |
| `"quartal"` | `Quartal` |

This mapping is enforced by the OpenAPI-generated client and validated by the contract tests
in `intervalContract.test.ts`.

### 5.5 Frontend–Backend Contract Stability

The frontend–backend contract is stabilised by three mechanisms:

1. **OpenAPI code generation** — `npm run generate:api` regenerates
   `src/api/generated/index.ts` from the live backend. Any breaking change in the backend
   immediately breaks the generated types, surfacing the mismatch at build time.

2. **Contract tests** — `intervalContract.test.ts` asserts that frontend `CHORD_INTERVALS`
   match backend-served intervals for all 9 chord qualities.
   `scaleIntervalContract.test.ts` does the same for all 8 scale modes.

3. **`HarmonySnapshot` schema versioning** — `schemaVersion: 1` ensures that on-disk
   snapshots can be detected as compatible or incompatible at runtime via `isHarmonySnapshot()`.

---

## 6. Risk Catalog

### ARCH-01 — `Chord` Type Fan-out · Severity: **High**

**Description:** The `Chord` interface (defined in `current-chord/types/`) is imported
by over a dozen features across the frontend codebase. It is a de-facto shared kernel type.

**Impact:** Any change to `Chord` (adding a required field, renaming a property, narrowing a
type) propagates to all consumers. Risk of cascading breakage is high.

**Likelihood:** Medium — the `Chord` type has been stable so far, but future features
(extensions, custom shapes) may force additions.

**Mitigation (current):** `HarmonySnapshot` introduces a schema version (`schemaVersion: 1`)
for serialised forms, providing a versioning escape hatch.

**Recommended action:** Treat `Chord` as a stable, versioned domain type. Add a JSDoc
comment documenting the backward-compatibility contract (optional fields may be added; no
field may be removed or narrowed without a major version bump). Link from `current-chord/types/`.

**Related SPIKE:** SPIKE-architecture-boundaries § 1

---

### ARCH-02 — `App.tsx` Orchestration Complexity · Severity: **High**

**Description:** `App.tsx` directly holds 12+ state variables, imports from 10+ feature
modules, and orchestrates progression playback, bridge previews, chord selection, scale
state, UI toggles, and file import in a single component.

**Impact:** High cognitive load for contributors; long render cycles; difficult to write
focused unit tests for individual behaviors.

**Likelihood:** Increasing — every new cross-cutting feature adds state to `App.tsx`.

**Mitigation (current):** None; orchestration is grown organically.

**Recommended action:** Extract a `useAppOrchestration()` hook (or a small set of
domain hooks) from `App.tsx` to hold the derived/combined state and callbacks. This does
not change architecture; it reduces cognitive load and enables isolated testing.

**Related SPIKE:** SPIKE-architecture-boundaries § 2

---

### ARCH-03 — Voice-Leading Metric Duplication · Severity: **Medium**

**Description:** The chord voice-leading distance metric is implemented independently in:
- Frontend: `voice-leading/utils/chordDistance.ts`
- Backend: `ProgressionAnalyzer.cs → ComputeMotion()`

Both compute the same algorithm (sum of pitch-class minimal distances), but there is no
automated test that runs both against the same input and asserts equal output.

**Impact:** Silent divergence — if one implementation is updated, the other is not,
the bridge-scoring results (frontend) and progression-analysis results (backend) could
disagree without any build-time warning.

**Likelihood:** Low — the algorithm is simple and stable. However, any future enhancement
(e.g. octave-weighted distance) could diverge silently.

**Recommended action:** Add a comment in both files cross-referencing each other and the
shared algorithm specification. Optionally, add a cross-environment integration test that
POSTs a known progression to `/progression/analyze` and asserts the `motion` values match
the frontend `chordDistance()` output for the same chord pairs. See SPIKE-architecture-
boundaries § 3 for investigation notes.

---

### ARCH-04 — `scaleContext` API Field Not Yet Consumed · Severity: **Medium**

**Description:** `ProgressionAnalyzeRequestDto.ScaleContext` is accepted by the
`/progression/analyze` endpoint but is documented as "not yet consumed by the analyzer"
in the source code comment. The field exists in the contract but has no effect on the
response.

**Impact:** Clients sending `scaleContext` receive no benefit; documentation may mislead
contributors into assuming harmonic-function analysis is already live.

**Likelihood:** N/A — this is an existing, documented gap.

**Recommended action:** Either (a) implement scale-aware analysis (harmonic function
labeling) in `ProgressionAnalyzer`, which was the stated intent, or (b) leave the field
in the contract but add a Swagger `[Obsolete]`-style notice or XML doc note clarifying
that the field is reserved for a future analysis pass. Choosing (b) avoids a breaking
change while making the status unambiguous.

---

### ARCH-05 — CORS Policy Hardcoded for Local Development · Severity: **Medium**

**Description:** The CORS policy in `Program.cs` is hardcoded to allow requests from
`http://localhost:5173` only:

```csharp
policy.WithOrigins("http://localhost:5173")
```

**Impact:** Any staging/production deployment must manually edit `Program.cs` or introduce
environment-specific configuration. The current setup is not deployment-ready.

**Likelihood:** Medium — once the app is deployed beyond a local dev machine, this will
block all cross-origin requests.

**Recommended action:** Read allowed origins from `appsettings.json` /
`appsettings.{Environment}.json` via `IConfiguration`. Local dev retains `localhost:5173`;
staging/production configs supply their own origins. No code-path changes are required.

---

### ARCH-06 — `progression-sidebar` High Fan-in · Severity: **Low**

**Description:** The `ProgressionSidebar` component and its companion hooks import from
7+ other feature modules: `audio`, `chord`, `harmonic-graph`, `ii-v-suggestions`,
`midi-export`, `scale`, and `voice-leading`.

**Impact:** The sidebar is a stable aggregator (by design), but changes in any dependency
require re-testing the full sidebar flow. This is a coupling smell but not a correctness
risk.

**Recommended action:** No structural change needed. Document in
`progression-sidebar/index.ts` that the sidebar is intentionally an aggregator, so future
contributors don't try to break it apart. Keep `ProgressionSidebar.tsx` as thin as
possible — logic should live in the domain hooks, not the component itself.

---

### ARCH-07 — No API Versioning Header / Route Prefix · Severity: **Low**

**Description:** The API is documented as "v1" in the Swagger doc, but there is no
`/v1/` route prefix or `api-version` header enforcement in the controllers. All routes
are flat (e.g. `/chord/from-root`).

**Impact:** A future API v2 would require either new flat routes (confusing) or retrofitting
a versioning scheme onto existing endpoints.

**Likelihood:** Low in the short term. Most API contracts are stable and the spec is not
published publicly.

**Recommended action:** If the API is expected to evolve toward a publicly consumed
surface, introduce route versioning (`/api/v1/chord/from-root`) before v2 work begins.
This is a low-urgency, forward-looking improvement.

---

## 7. Remediation Plans

### RP-01 — Document `Chord` backward-compatibility contract (High)

**Owner:** Architecture / Frontend
**Effort:** 1 hour
**Steps:**
1. Add a JSDoc block to `current-chord/types/index.ts` stating: "This type is a shared
   domain kernel. Optional fields may be added. No field may be removed or given an
   incompatible type without coordinating all consumers and bumping the `HarmonySnapshot`
   schema version."
2. Add a short note to `docs/data-model-audit.md` cross-referencing this rule.

---

### RP-02 — Extract `useAppOrchestration()` from `App.tsx` (High)

**Owner:** Frontend
**Effort:** 3–5 hours
**Steps:**
1. Create `app/hooks/useAppOrchestration.ts`.
2. Move state and callbacks that do not directly touch the render tree into this hook:
   `chords`, `currentChord`, `keyRoot/keyScale`, `addGuardRef`, bridge apply/undo,
   playback controls, file import logic.
3. `App.tsx` becomes a thin layout component that renders `<AppHeader>`,
   `<ChromaticCircle>`, `<CurrentChordPanel>`, `<ProgressionSidebar>` with props
   supplied by `useAppOrchestration`.
4. Update tests; no UI behavior changes.

---

### RP-03 — Cross-reference voice-leading distance implementations (Medium)

**Owner:** Both layers
**Effort:** 1 hour
**Steps:**
1. Add a comment block to `voice-leading/utils/chordDistance.ts` describing the algorithm
   and cross-referencing `ProgressionAnalyzer.cs ComputeMotion()`.
2. Add the symmetric comment to `ProgressionAnalyzer.cs`.
3. Optionally create a minimal integration test (see SPIKE-architecture-boundaries § 3)
   verifying that the two produce equal output for a representative chord pair set.

---

### RP-04 — Resolve `scaleContext` contract ambiguity (Medium)

**Owner:** Backend
**Effort:** 2–8 hours depending on chosen path
**Option A (implement):** Add harmonic-function labeling to `ProgressionAnalyzer.Analyze()`
using `scaleContext.Root` and `scaleContext.Mode` to tag each chord as tonic/subdominant/dominant.
**Option B (document):** Add an XML `<remarks>` block to `ProgressionAnalyzeRequestDto.ScaleContext`
stating "Reserved for future scale-aware analysis. Currently not consumed by the analyzer.
Sending this field has no effect on the response."

---

### RP-05 — Externalise CORS allowed origins (Medium)

**Owner:** Backend / DevOps
**Effort:** 1 hour
**Steps:**
1. Add `"AllowedOrigins": ["http://localhost:5173"]` to `appsettings.Development.json`.
2. Inject `IConfiguration` (or `IOptions`) into the CORS setup in `Program.cs` and read
   the list from config.
3. Add an `appsettings.Production.json` stub with an empty origins list and a comment
   explaining where to fill it in.

---

## 8. Modules with Overlapping Concerns (Noted, Not Blocking)

| Pair | Overlap | Resolution |
|---|---|---|
| `chord-animation` and `chord-morphing` | Both deal with polygon transition animation | `chord-morphing` provides low-level interpolation primitives; `chord-animation` provides the React hook. Intentional two-layer separation — no action needed. |
| `chromatic-circle` and `chord-geometry` | Both deal with polygon geometry | `chord-geometry` defines abstract shapes (`CHORD_SHAPES`); `chromatic-circle` projects them onto a specific SVG coordinate system. Correct layering. |
| `current-chord` and `chord` | `Chord` type lives in `current-chord` | `Chord` is a domain model type, not a UI type, and would sit better in `shared/types/`. However, moving it is a non-trivial refactor; the current location is acceptable if the backward-compatibility contract (RP-01) is documented. |

---

## 9. Verification Commands

```bash
# Frontend
cd client
npm run lint
npm run build
npm test

# Backend
cd server/ParametricMusic.Tests
dotnet test
```

All commands must exit with code 0 before merging architectural changes.
