# ISSUE-E8-08 — Optional Backend `suggest-bridges` Endpoint

**Epic:** Epic 8 — ii–V Bridge Suggestions  
**Priority:** Low  
**Estimate:** 2–3 story points  
**Depends on:** ISSUE-E8-01  
**Note:** This endpoint is optional. Implement only if progression history is persisted server-side or if the suggestion algorithm becomes too expensive to run in the browser.

---

## Summary

Add a `POST /Progression/suggest-bridges` endpoint to `ProgressionController` that accepts two neighbouring chords and a scale, runs the bridge suggestion algorithm server-side, and returns ranked `BridgeSuggestion` candidates. Mirror the scoring logic from the frontend `suggestBridges` util.

---

## Files to Modify / Create

| File | Action |
|---|---|
| `server/ParametricMusic.Api/Controllers/ProgressionController.cs` | Modify — add `SuggestBridges` action |
| `server/ParametricMusic.Api/Models/BridgeModels.cs` | Create — DTOs |
| `server/ParametricMusic.Api/Services/BridgeSuggestionService.cs` | Create |
| `server/ParametricMusic.Tests/Controllers/ProgressionControllerTests.cs` | Modify — add tests |
| `server/ParametricMusic.Tests/Services/BridgeSuggestionServiceTests.cs` | Create |

---

## Request / Response Schema

### Request — `POST /Progression/suggest-bridges`

```json
{
  "sourceChord": {
    "root": "A",
    "quality": "Minor7"
  },
  "targetChord": {
    "root": "C",
    "quality": "Major7"
  },
  "scale": {
    "root": "C",
    "mode": "Major"
  },
  "options": {
    "maxBridgeLength": 2,
    "minScore": 0.0
  }
}
```

### Response — `200 OK`

```json
[
  {
    "type": "IIV",
    "score": 0.87,
    "chords": [
      { "root": "D", "quality": "Minor7" },
      { "root": "G", "quality": "Dominant7" }
    ]
  }
]
```

### Error responses

| Condition | Status |
|---|---|
| `sourceChord` or `targetChord` is null | `400 Bad Request` |
| `maxBridgeLength` < 0 or > 4 | `400 Bad Request` |
| Unknown `root` or `quality` enum value | `400 Bad Request` |

---

## C# Models (`BridgeModels.cs`)

```csharp
public record BridgeRequest(
    ChordRef SourceChord,
    ChordRef TargetChord,
    ScaleRef Scale,
    BridgeOptions? Options
);

public record ChordRef(Note Root, ChordQuality Quality);

public record ScaleRef(Note Root, ScaleMode Mode);

public record BridgeOptions(int MaxBridgeLength = 2, double MinScore = 0.0);

public record BridgeSuggestionDto(
    BridgeType Type,
    double Score,
    IReadOnlyList<ChordRef> Chords
);

public enum BridgeType { IIV, TritoneSub, ChromaticApproach, DiatonicPassing, SecondaryDominant }
```

---

## `BridgeSuggestionService` logic

Mirror the frontend scoring from `scoreCandidate.ts` (ISSUE-E8-01):

1. Enumerate bridge candidates for each `BridgeType` up to `maxBridgeLength`.
2. Score: **shared notes with target** (×0.4) + **diatonic conformance** (×0.3) + **voice-leading smoothness** (×0.3).
3. Filter by `minScore`, sort descending.
4. Return as `IReadOnlyList<BridgeSuggestionDto>`.

---

## API Code Generation

After adding the endpoint, regenerate the TypeScript client:

```bash
cd client
npm run generate:api
```

Update `useBridgeSuggestions` (ISSUE-E8-02) to optionally call the backend endpoint instead of the client-side engine, controlled by a feature flag or hook parameter.

---

## Tests (`BridgeSuggestionServiceTests.cs`)

- `IIV_Bridge_ForAmToC_ReturnsDmGSuggestion` — verify the canonical test vector
- `EmptyResult_WhenMaxBridgeLengthIsZero`
- `ReturnsError_WhenSourceChordIsNull` (controller validation test)
- `ScoreOrder_HigherDiatonicConformance_RanksHigher`

---

## Acceptance Criteria

- [ ] `POST /Progression/suggest-bridges` returns `200` with ranked suggestions for valid input
- [ ] Returns `400` for invalid / missing chord or scale references
- [ ] Canonical test vector `Am7 → [Dm7, G7] → Cmaj7` in C major returns `IIV` with score ≥ 0.7
- [ ] `dotnet test` passes
- [ ] Swagger UI shows the new endpoint with correct schema
- [ ] TypeScript client regenerated; no manual edits to `src/api/generated/index.ts`
- [ ] Nullable reference types satisfied — no `#nullable disable` suppressions
