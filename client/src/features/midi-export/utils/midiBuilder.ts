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

const MIN_BPM = 40;
const MAX_BPM = 240;
const VALID_BEATS_PER_CHORD = [1, 2, 4] as const;
const DEFAULT_BPM = 120;
const DEFAULT_BEATS_PER_CHORD = 2;
const VELOCITY = 100;
const MIDI_MAX_VELOCITY = 127;
const SECONDS_PER_MINUTE = 60;

const DEFAULT_OPTIONS: MidiExportOptions = {
  bpm: DEFAULT_BPM,
  beatsPerChord: DEFAULT_BEATS_PER_CHORD,
};

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

  if (bpm < MIN_BPM || bpm > MAX_BPM) {
    throw new RangeError(`bpm must be between ${MIN_BPM} and ${MAX_BPM}, got ${bpm}`);
  }
  if (!(VALID_BEATS_PER_CHORD as readonly number[]).includes(beatsPerChord)) {
    throw new RangeError(
      `beatsPerChord must be one of ${VALID_BEATS_PER_CHORD.join(", ")}, got ${beatsPerChord}`,
    );
  }

  const midi = new Midi();
  midi.header.setTempo(bpm);

  const track = midi.addTrack();
  const secondsPerBeat = SECONDS_PER_MINUTE / bpm;
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
        velocity: VELOCITY / MIDI_MAX_VELOCITY,
      });
    }

    prevMidi = midiNotes;
  });

  return midi.toArray();
}
