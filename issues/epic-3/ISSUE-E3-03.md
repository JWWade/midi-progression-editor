# ISSUE-E3-03 - Add primitive shape payload support

## Objective
Allow primitive shape metadata to be accepted and returned by chord/progression endpoints.

## API Contract Extension
- Primitive shape enum values:
  - `equilateral-triangle`
  - `suspended-triangle`
  - `square`
  - `rectangle`
- Extend chord payloads with optional property:
```json
"primitiveShape": "rectangle"
```

## Files To Add/Edit
- DTOs introduced in E3-01/E3-02 where chord objects are represented.
- OpenAPI-visible models must include enum schema.

## Acceptance Criteria
- Primitive shape round-trips on successful responses.
- Unknown primitive string returns 400.
- OpenAPI enum includes all four values.

## Verification Commands
- `dotnet build server/ParametricMusic.Api`
- `dotnet test server/ParametricMusic.Tests`
