# Epic 15 — Coltrane Changes as an Advanced Bridging Technique

## Purpose

Add Coltrane-style bridge substitutions as an advanced harmonic exploration feature so users can generate bold, symmetric, major-third-based motion when connecting stable chords.

This epic extends the existing bridge suggestion system with a recognizable jazz reharmonization device inspired by Countdown-style tonicization chains. The goal is to support experimentation, education, and musically rich progression design without disrupting the existing default workflow.

## Current Baseline (Verified)

The repository already contains relevant foundations for this work:

- existing bridge suggestion UI and bridge preview flows in the progression sidebar feature
- chord progression playback and audition support on the frontend
- harmonic transformation and advanced chord exploration features already present in the app
- voice-leading and harmonic-graph infrastructure that can help evaluate bridge quality
- current issue and docs structure that supports spike-driven feature development

## Goals

1. Add Coltrane changes as a first-class advanced bridge suggestion type.
2. Support destination-aware major-third tonic cycles and dominant preparation chords.
3. Integrate preview, audition, and insertion into the existing bridge workflow.
4. Keep the feature educational and discoverable without overwhelming non-jazz users.
5. Preserve accessibility and predictable interaction behavior.

## Non-Goals

- Replacing the existing bridge suggestion system
- Building a full jazz reharmonization engine in the first pass
- Supporting every possible rhythmic or voicing variant in the MVP
- Introducing theory-heavy UI that raises the learning barrier for casual users

## Sprint / Issue Breakdown

1. [ISSUE-E15-01](./ISSUE-E15-01.md) — Define the Coltrane bridge generation model and MVP scope
2. [ISSUE-E15-02](./ISSUE-E15-02.md) — Implement destination-aware Coltrane tonic-cycle generation
3. [ISSUE-E15-03](./ISSUE-E15-03.md) — Integrate Coltrane bridge suggestions into the bridge UI and preview flow
4. [ISSUE-E15-04](./ISSUE-E15-04.md) — Add explanation, naming, and accessibility support for advanced bridge suggestions
5. [ISSUE-E15-05](./ISSUE-E15-05.md) — Validate playback, insertion behavior, and musical usefulness of Coltrane bridges

## Recommended Execution Order

1. ISSUE-E15-01
2. ISSUE-E15-02
3. ISSUE-E15-03
4. ISSUE-E15-04
5. ISSUE-E15-05

## Expected Outcome

At the end of this epic, users should be able to generate, preview, understand, and insert Coltrane-style harmonic bridges when moving toward a destination chord.

The product should gain a more adventurous and educational reharmonization option while preserving the simplicity of the core progression-building experience.
