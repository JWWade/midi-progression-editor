# ISSUE-18 — Frontend: Play the Chord I'm Looking At

## User Story

As a user, I want to **hear the chord** represented by the shape so I can connect the visual geometry to sound.

## Summary

Add an audio playback feature that plays the currently selected chord using Web Audio API or a library like Tone.js. This creates a tight feedback loop: visual shape ↔ sound.

## Requirements

### Audio Implementation
- Use **Web Audio API** or **Tone.js** to synthesize chord notes
- Create a utility function:
  ```ts
  export async function playChord(notes: NoteInfo[], duration: number = 1000) {
    // Synthesize audio for the given notes
  }
  ```

- Chord playback options:
  - **Option A**: Arpeggio (notes play sequentially, e.g., C → E → G)
  - **Option B**: All notes at once (simultaneous)
  - **Option C**: Both, with toggle
  - Recommend **Option C** for flexibility

### UI Controls
- Add **"Play" button** near the chord selector
  - Label: "Play" or "Hear" or "Play Chord"
  - Icon: speaker or music note (optional)
  - Disabled state: if audio is playing (prevent double-trigger)
  
- Optional: **Volume slider** to control playback level
- Optional: **Speed slider** for arpeggio duration

### Audio Parameters
- **Frequency**: Map note index (0-11) to MIDI pitch
  - Middle C = MIDI 60 = 261.63 Hz
  - Formula: `frequency = 440 * 2^((midiNote - 69) / 12)`
  
- **Duration**: 1-2 seconds for root listening
- **Envelope**: Simple attack/decay (ADSR)
  - Attack: 50ms, Decay: 200ms, Sustain: hold at lower volume, Release: 200ms
  - Or: use library defaults
  
- **Wave type**: Sine wave (clean), square (bright), or sawtooth (clear)

### Frontend Architecture
- Create `src/features/audio/` feature module
  
- Create `src/features/audio/utils/audioUtils.ts`:
  ```ts
  export function initAudioContext(): AudioContext;
  export async function playChord(notes: NoteInfo[], options: PlayOptions): Promise<void>;
  export function stopChord(): void;
  ```

- Create `src/features/audio/hooks/useAudioPlayback.ts`:
  ```ts
  export function useAudioPlayback() {
    const play = async (notes: NoteInfo[]) => { ... };
    const stop = () => { ... };
    return { play, stop, isPlaying };
  }
  ```

- Update `ChromaticCircle.tsx`:
  - Render "Play" button
  - Call `useAudioPlayback().play()` on button click
  - Disable button while playing

### Constraints
- Simple sine wave oscillators (no complex synthesis)
- Single playback mode per MVP (arpeggio OR simultaneous, not toggle)
- No looping or sustained play
- No MIDI input (output audio only)

## Acceptance Criteria
- [ ] "Play" button renders and is clickable
- [ ] Clicking "Play" produces audible sound
- [ ] Sound contains the correct notes for the chord
- [ ] Sound is pleasant (reasonable amplitude, envelope, frequency)
- [ ] Button disables during playback
- [ ] ES Lint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
- [ ] Works across browsers (Chrome, Firefox, Safari, Edge)

## Implementation Notes

### Web Audio API Example (Sine Wave)
```ts
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const now = audioContext.currentTime;

for (const note of notes) {
  const frequency = 440 * Math.pow(2, (note.index + 12 - 9) / 12); // A4=440Hz reference
  const osc = audioContext.createOscillator();
  osc.frequency.value = frequency;
  osc.type = "sine";
  
  osc.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 1);
}
```

### Tone.js Alternative
```ts
import * as Tone from "tone";

export async function playChord(notes: NoteInfo[]) {
  await Tone.start();
  const synth = new Tone.Synth().toDestination();
  
  const noteNames = notes.map(n => {
    const octave = Math.floor((n.index + 12) / 12) + 3;
    const noteName = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][n.index % 12];
    return `${noteName}${octave}`;
  });
  
  await synth.triggerAttackRelease(noteNames, "1n");
}
```

### MIDI Note to Frequency
Map chord note index (0-11) relative to a root octave:
```ts
const rootMidiNote = 60; // Middle C
const midiNote = rootMidiNote + noteIndex;
const frequency = 440 * Math.pow(2, (midiNote - 69) / 12); // A4 = 69 = 440Hz
```

### Accessibility
Consider:
- Mute button on page (in case audio is unwanted)
- Visual indicator that sound is playing
- Option to disable audio entirely

## Related Issues
- **ISSUE-16**: Add Chord Selector Dropdown (chord selection trigger)
- **ISSUE-11**: Rotate Chord Shape Around Circle (all chords playable)
- **ISSUE-20**: Animate Shape When Chord Changes (could play sound on change too)

## Testing Checklist
- [ ] "Play" button functions correctly
- [ ] Audio outputs sound at correct pitch
- [ ] All chord types produce correct notes
- [ ] All root note transpositions work
- [ ] Button state management (disable during play)
- [ ] No console errors
- [ ] Works in major browsers
- [ ] Lint passes
- [ ] TypeScript strict mode satisfied

