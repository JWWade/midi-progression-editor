# ISSUE-E14-01 — Define the MVP Control Set and Control-Surface Architecture

## Objective

Define the first release of surfaced musical controls so the UI gains meaningful power without becoming cluttered, confusing, or inaccessible.

## Background

The app already exposes some controls for playback and arpeggiation, but several other capabilities appear to exist in the underlying architecture without being presented as intentional, user-facing controls.

Before implementation work begins, we need a focused product and UX definition that answers:

- which controls belong in the MVP
- where they should live in the layout
- which controls are default-visible versus progressively disclosed
- how accessibility and learnability requirements will be enforced from the start

## Scope

1. Audit current user-facing musical controls.
2. Create a prioritized value-versus-effort matrix for candidate controls.
3. Define the initial 3 to 5 controls for the first release.
4. Group controls into coherent domains:
   - harmonic intent
   - transformation and exploration
   - playback expression
   - workflow and iteration
   - learning and insight
5. Define the accessibility contract for every proposed control.

## Files To Inspect

- `client/src/app/App.tsx`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/audio/hooks/useProgressionPlayback.ts`
- `client/src/features/chromatic-circle/hooks/useCustomChordState.ts`
- `client/src/features/voice-leading/types/index.ts`
- `docs/accessibility-audit.md`
- `docs/architecture/frontend-features.md`

## Requirements

### Product Definition

- Prioritize controls that meaningfully change output or exploration quality.
- Avoid purely cosmetic options.
- Keep the default surface minimal and approachable.
- Prefer controls that map cleanly to existing state or existing logic in the repo.

### Accessibility Definition

For each proposed control, define:

- keyboard interaction model
- semantic labeling needs
- visible focus behavior
- whether dynamic changes need announcement text
- whether a non-audio fallback is needed

## Acceptance Criteria

- [ ] A prioritized control matrix exists with rationale and rough effort estimates.
- [ ] The MVP set is explicitly approved and documented.
- [ ] The default UI remains intentionally minimal.
- [ ] Accessibility expectations are defined for each control before build work starts.
- [ ] Follow-on implementation issues reference this issue as the agreed MVP plan.
