import { Midi } from "@tonejs/midi";
import type { Chord } from "@/features/current-chord/types";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";
import { closeVoiceChord, minimalMotionVoicing } from "@/features/voice-leading";

export interface MidiExportOptions {
  /** Beats per minute (40–240). Default: 120. */
  bpm: number;
  /** Number of beats each chord occupies (1 | 2 | 4). Default: 2. */
  beatsPerChord: number;
}

const DEFAULT_OPTIONS: MidiExportOptions = {
  bpm: 120,
  beatsPerChord: 2,
};

const VELOCITY = 100;

/**
 * Converts a chord progression into raw MIDI bytes.
 *
 * @param chords  - Array of chords to export.
 * @param options - MIDI export options (BPM, beats per chord).
 * @returns A `Uint8Array` of MIDI file bytes suitable for a `Blob` with `type: "audio/midi"`.
 */
export function buildMidiFile(
  chords: Chord[],
  options: Partial<MidiExportOptions> = {},
): Uint8Array {
  const { bpm, beatsPerChord } = { ...DEFAULT_OPTIONS, ...options };

  if (bpm < 40 || bpm > 240) {
    throw new RangeError(`bpm must be between 40 and 240, got ${bpm}`);
  }
  if (beatsPerChord !== 1 && beatsPerChord !== 2 && beatsPerChord !== 4) {
    throw new RangeError(`beatsPerChord must be 1, 2, or 4, got ${beatsPerChord}`);
  }

  const midi = new Midi();
  midi.header.setTempo(bpm);

  const track = midi.addTrack();
  const secondsPerBeat = 60 / bpm;
  const chordDuration = beatsPerChord * secondsPerBeat;

  let prevMidi: number[] = [];

  chords.forEach((chord, index) => {
    const pitchClasses =
      chord.customNotes && chord.customNotes.length > 0
        ? chord.customNotes
        : getChordNoteIndices(chord.root, chord.quality);

    const midiNotes =
      index === 0
        ? closeVoiceChord(pitchClasses)
        : minimalMotionVoicing(prevMidi, pitchClasses);

    const startTime = index * chordDuration;

    for (const note of midiNotes) {
      track.addNote({
        midi: note,
        time: startTime,
        duration: chordDuration,
        velocity: VELOCITY / 127,
      });
    }

    prevMidi = midiNotes;
  });

  return midi.toArray();
}
