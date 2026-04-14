# Data Flow

End-to-end data flow from user interaction through to backend computation, audio playback, and MIDI file export.

## Chord Selection & Visualisation

```mermaid
sequenceDiagram
    actor User
    participant Circle as ChromaticCircle
    participant ChordHook as useCustomChordState
    participant API as Backend API
    participant Animation as ChordAnimation
    participant Audio as Web Audio API

    User->>Circle: Click note on chromatic circle
    Circle->>ChordHook: handleNoteClick(noteIndex)
    ChordHook->>ChordHook: Build chord from selected notes
    ChordHook->>Animation: Trigger polygon morph
    Animation-->>Circle: Animated SVG update (350 ms)
    ChordHook->>Audio: Optional preview playback
```

## Scale Fetch & Display

```mermaid
sequenceDiagram
    actor User
    participant ScaleUI as Scale Panel
    participant Client as API Client
    participant Backend as /Scale/from-root
    participant Circle as ChromaticCircle

    User->>ScaleUI: Select root + mode
    ScaleUI->>Client: POST /Scale/from-root
    Client->>Backend: { note, scaleType }
    Backend-->>Client: ScaleDto { notes[], modeName }
    Client-->>ScaleUI: ScaleDto
    ScaleUI->>Circle: Highlight diatonic notes
```

## Chord Progression & MIDI Export

```mermaid
flowchart LR
    AddChord["Add chord to sidebar\n(useProgression.addChord)"]
    Progression["ProgressionNode[]\n(chords + placeholders)"]
    Playback["useProgressionPlayback\n(Audio API)"]
    VoiceLeading["Voice-leading computation\n(close / minimal / open)"]
    MIDIBuilder["midiBuilder\n(@tonejs/midi)"]
    Download["Browser download\n(.mid file)"]

    AddChord --> Progression
    Progression --> Playback
    Progression --> VoiceLeading
    VoiceLeading --> MIDIBuilder
    MIDIBuilder --> Download
```

## Harmonic Graph Shortest Path

```mermaid
flowchart TD
    Start["Start chord\n(pitch-class set)"]
    End["End chord\n(pitch-class set)"]
    Graph["19-node T-canonical\nchord graph"]
    Dijkstra["findShortestVoiceLeading\n(Dijkstra's algorithm)"]
    Path["PathResult\n(sequence of chords + weights)"]
    UI["Harmonic path visualisation"]

    Start --> Dijkstra
    End --> Dijkstra
    Graph --> Dijkstra
    Dijkstra --> Path
    Path --> UI
```
