# Frontend Feature Modules

Dependency graph of the React/TypeScript feature modules under `client/src/features/`.
Arrows represent "depends on / imports from" relationships.

```mermaid
flowchart LR
    %% Entry point
    App["app/\n(App, AppHeader, providers)"]

    %% Shared utilities
    Shared["shared/\n(components, hooks, utils)"]

    %% Core domain
    Chord["chord\n(ChordType, intervals, utils)"]
    Scale["scale\n(modes, generation)"]

    %% Visualisation
    ChromaticCircle["chromatic-circle\n(12-note SVG circle)"]
    ChordGeometry["chord-geometry\n(polygon vertices)"]
    ColorLanguage["color-language\n(quality → color)"]
    ChordIntervals["chord-intervals\n(interval visualisation)"]

    %% Audio
    Audio["audio\n(playback, arpeggio)"]

    %% Animation
    ChordAnimation["chord-animation\n(350 ms polygon morph)"]
    ChordMorphing["chord-morphing\n(smooth morph hooks)"]

    %% Inspection & sidebar
    ChordInspection["chord-inspection\n(ToneInfoPanel)"]
    CurrentChord["current-chord\n(info panel)"]
    ProgressionSidebar["progression-sidebar\n(up to 8 chords)"]
    Legend["legend\n(color band + glyphs)"]

    %% Export
    MidiExport["midi-export\n(BPM, beats/chord)"]

    %% Advanced harmony
    VoiceLeading["voice-leading\n(path utilities)"]
    HarmonicGraph["harmonic-graph\n(Dijkstra graph)"]
    NegativeHarmony["negative-harmony\n(reflect transform)"]
    IIVSuggestions["ii-v-suggestions\n(bridge chords)"]

    %% Intent & tutorial
    IntentCapture["intent-capture\n(Cmd+. capture)"]
    Tutorial["tutorial\n(guided tour)"]

    %% API layer
    API["api/\n(generated client + types)"]

    %% Dependency edges
    App --> ChromaticCircle
    App --> ProgressionSidebar
    App --> Scale
    App --> Tutorial
    App --> IntentCapture
    App --> Shared

    ChromaticCircle --> Chord
    ChromaticCircle --> ChordGeometry
    ChromaticCircle --> ColorLanguage
    ChromaticCircle --> ChordAnimation
    ChromaticCircle --> ChordIntervals
    ChromaticCircle --> ChordInspection
    ChromaticCircle --> VoiceLeading
    ChromaticCircle --> NegativeHarmony
    ChromaticCircle --> HarmonicGraph
    ChromaticCircle --> IIVSuggestions

    ChordAnimation --> ChordMorphing
    ChordAnimation --> ChordGeometry

    ProgressionSidebar --> Chord
    ProgressionSidebar --> Audio
    ProgressionSidebar --> MidiExport
    ProgressionSidebar --> VoiceLeading

    MidiExport --> Chord
    MidiExport --> VoiceLeading

    HarmonicGraph --> Chord
    NegativeHarmony --> Chord
    IIVSuggestions --> Chord

    Scale --> API
    ChromaticCircle --> API
```

## Module Summary

| Module | Purpose |
|--------|---------|
| `audio` | In-browser chord and arpeggio playback via Web Audio API |
| `chord` | Core chord data, `ChordType` values, interval maps, utilities |
| `chord-animation` | Animated 350 ms `easeInOutQuad` polygon morphing |
| `chord-geometry` | Polygon vertex calculations (`CHORD_SHAPES`) |
| `chord-inspection` | Tone detail panel (`ToneInfoPanel`) |
| `chord-intervals` | Interval pattern visualisation |
| `chord-morphing` | Smooth polygon morphing hooks |
| `chromatic-circle` | Main 12-note SVG circle visualisation |
| `color-language` | Quality-based color system |
| `current-chord` | Current-chord info panel |
| `harmonic-graph` | Dijkstra shortest voice-leading path across all chords |
| `ii-v-suggestions` | ii–V bridge and tritone-substitution suggestions |
| `intent-capture` | Keyboard shortcut (Cmd/Ctrl+.) intent capture |
| `legend` | Color bands and polygon glyphs legend |
| `midi-export` | MIDI file export (BPM, beats/chord, voice-leading) |
| `negative-harmony` | Negative harmony pitch-class reflection |
| `progression-sidebar` | Chord progression sidebar (max 8 chords, session-only) |
| `scale` | Scale generation and display (8 modes) |
| `tutorial` | Guided in-app tutorial (tooltips, modals, action triggers) |
| `voice-leading` | Voice-leading path and voicing utilities |
