# Data Flow

End-to-end data flow from user interaction through to backend computation, audio playback, and MIDI file export.

## Chord Selection & Visualisation

```mermaid
sequenceDiagram
    actor User
    participant Circle as ChromaticCircle
    participant App as App.tsx state
    participant Animation as ChordAnimation
    participant Audio as Web Audio API

    User->>Circle: Click note on chromatic circle
    Circle->>App: onCurrentChordChange(chord)
    App->>App: set currentChord + selectedTone
    App->>Animation: Trigger polygon morph
    Animation-->>Circle: Animated SVG update (350 ms)
    App->>Audio: Optional preview playback
```

## Key Context & Diatonic Row

```mermaid
sequenceDiagram
    actor User
    participant Settings as KeyContextPanel
    participant App as App.tsx state
    participant Controls as CircleControls
    participant Circle as ChromaticCircle

    User->>Settings: Select root + mode
    Settings->>App: onSetKeyContext(root, scale)
    App->>Controls: Pass keyRoot + keyScale props
    Controls->>Controls: buildDiatonicChordOptions(root, scale)
    User->>Controls: Click diatonic chord button
    Controls->>App: onDiatonicChordSelect(chord)
    App->>Circle: loadChord + current chord update
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
