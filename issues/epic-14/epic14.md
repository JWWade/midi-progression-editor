# Epic 14 — Expose High-Impact Musical Controls to Enhance Expression, Exploration, and Accessibility

## Purpose

Expose a curated, minimal set of high-value musical controls that increase user agency, improve learnability, and make the sequencer more expressive without overwhelming the default experience.

This epic is grounded in the existing product architecture:

- progression playback already supports loop, BPM, beats-per-chord, and arpeggio controls
- the app already tracks key root and scale mode in the main app state
- the chromatic circle already supports transformations such as rerooting, rotation, mirroring, and custom chord mutation
- voice-leading infrastructure already exists as a feature module
- MIDI export already understands tempo, scale context, and arpeggio pattern

The work in this epic should surface the right controls more intentionally and ensure they are accessible by default.

## Current Baseline (Verified)

The repository already contains the following relevant capabilities:

- Progression playback and loop controls in `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- Play-all, loop, and arpeggio playback state in `client/src/features/audio/hooks/useProgressionPlayback.ts`
- Audio synthesis and arpeggio scheduling in `client/src/features/audio/utils/audioUtils.ts`
- App-level scale and tempo state in `client/src/app/App.tsx`
- Voice-leading types and configuration primitives in `client/src/features/voice-leading/types/index.ts`
- Negative harmony / reflection helpers in `client/src/features/chord/utils/reflectChord.ts`
- Chromatic-circle custom chord controls in `client/src/features/chromatic-circle/hooks/useCustomChordState.ts`

## Goals

1. Increase user control over harmony, transformation, playback, and iteration.
2. Preserve a minimal and approachable default UI.
3. Make system behavior more legible and easier to learn.
4. Ensure all new controls meet accessibility-first expectations.
5. Validate the feature set with usability and accessibility testing.

## Non-Goals

- Adding purely cosmetic controls such as color customization
- Replacing the current music engine or playback architecture
- Introducing a highly technical expert-only control panel as the default UI
- Shipping experimental controls without clear value, reversibility, or accessibility coverage

## Sprint / Issue Breakdown

1. [ISSUE-E14-01](./ISSUE-E14-01.md) — Define the MVP control set and control-surface architecture
2. [ISSUE-E14-02](./ISSUE-E14-02.md) — Add harmonic intent controls for scale lock and tonal constraint
3. [ISSUE-E14-03](./ISSUE-E14-03.md) — Add transformation controls for mirror axis and mutation intensity
4. [ISSUE-E14-04](./ISSUE-E14-04.md) — Add expressive playback controls for octave range and pattern presets
5. [ISSUE-E14-05](./ISSUE-E14-05.md) — Add workflow controls for exploration modes, looping behavior, and scoped randomness
6. [ISSUE-E14-06](./ISSUE-E14-06.md) — Implement accessibility-first interaction and semantics for all surfaced controls
7. [ISSUE-E14-07](./ISSUE-E14-07.md) — Add learning and explainability cues so users understand what changed and why
8. [ISSUE-E14-08](./ISSUE-E14-08.md) — Validate the new control set with accessibility and usability testing

## Recommended Execution Order

1. ISSUE-E14-01
2. ISSUE-E14-02
3. ISSUE-E14-03
4. ISSUE-E14-04
5. ISSUE-E14-05
6. ISSUE-E14-06
7. ISSUE-E14-07
8. ISSUE-E14-08

## Expected Outcome

At the end of this epic, the app should feel more like a playable instrument and less like a black-box generator.

Users should be able to:

- shape musical behavior intentionally
- experiment safely and reversibly
- understand the effect of major controls
- use the experience with keyboard and assistive technology support

## Success Criteria

- A prioritized, high-value control set is shipped without cluttering the default experience
- New controls improve expressiveness, experimentation, and learnability
- Accessibility testing shows measurable improvement in keyboard, focus, and screen-reader behavior
- Users have more perceived ownership over generated and edited musical results
