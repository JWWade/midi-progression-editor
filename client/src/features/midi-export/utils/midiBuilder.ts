import { Midi } from "@tonejs/midi";
import type { Chord } from "@/features/current-chord/types";
import { getChordPitchClasses } from "@/features/chord/utils";
import { closeVoiceChord, minimalMotionVoicing } from "@/features/voice-leading";
import { getChordName } from "@/features/chord/data/chordNames";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ArpeggioPattern } from "@/features/audio/types/arpeggioPattern";
import {
  generateArpeggioSequence,
  computeArpeggioStartOffsets,
  getSubdivisionBeats,
} from "@/features/audio/utils/arpeggioUtils";

export interface MidiExportOptions {
  /** Beats per minute (40–240). Default: 120. */
  bpm: number;
  /** Number of beats each chord occupies (1 | 2 | 4). Default: 2. */
  beatsPerChord: number;
  /** Starting octave for the first chord (2–6). Default: 4. */
  startOctave: number;
  /**
   * When `true` (default), a MIDI Text meta event (0x01) and a Marker meta
   * event (0x06) are written at the start tick of every chord so that
   * notation tools and DAWs can display harmony labels.
   */
  includeChordSymbols: boolean;
  /**
   * Optional per-chord label overrides.  When `chordLabels[i]` is a non-empty
   * string it replaces the auto-derived symbol for chord `i`; otherwise the
   * auto-derived name is used.
   */
  chordLabels: string[];
  /**
   * When provided, each chord is exported as an arpeggiated sequence of notes
   * rather than simultaneous block voicings.
   */
  arpeggioPattern?: ArpeggioPattern;
}

const MIN_BPM = 40;
const MAX_BPM = 240;
const VALID_BEATS_PER_CHORD = [1, 2, 4] as const;
const DEFAULT_BPM = 120;
const DEFAULT_BEATS_PER_CHORD = 2;
const MIN_OCTAVE = 2;
const MAX_OCTAVE = 6;
const DEFAULT_OCTAVE = 4;
const VELOCITY = 100;
const MIDI_MAX_VELOCITY = 127;
const SECONDS_PER_MINUTE = 60;

const DEFAULT_OPTIONS: MidiExportOptions = {
  bpm: DEFAULT_BPM,
  beatsPerChord: DEFAULT_BEATS_PER_CHORD,
  startOctave: DEFAULT_OCTAVE,
  includeChordSymbols: true,
  chordLabels: [],
};

/** Derive a chord symbol string for use in MIDI meta events. */
function getChordSymbol(
  chord: Chord,
  labelOverride?: string,
  pitchClasses: readonly string[] = PITCH_CLASSES,
): string {
  if (labelOverride && labelOverride.trim().length > 0) {
    return labelOverride.trim();
  }
  return getChordName(chord.root, chord.quality, pitchClasses);
}

/**
 * Convert Unicode text into a byte-preserving string for MIDI meta writers that
 * emit one byte per code point. This yields UTF-8 bytes in the output file.
 */
function toMidiMetaUtf8Text(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (b) => String.fromCharCode(b)).join("");
}

/**
 * Converts a chord progression into raw MIDI bytes.
 *
 * @param chords  - Array of chords to export.
 * @param options - MIDI export options (BPM, beats per chord, start octave).
 * @returns A `Uint8Array` of MIDI file bytes suitable for a `Blob` with `type: "audio/midi"`.
 */
export function buildMidiFile(
  chords: Chord[],
  options: Partial<MidiExportOptions> = {},
): Uint8Array {
  const { bpm, beatsPerChord, startOctave, includeChordSymbols, chordLabels, arpeggioPattern } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (bpm < MIN_BPM || bpm > MAX_BPM) {
    throw new RangeError(`bpm must be between ${MIN_BPM} and ${MAX_BPM}, got ${bpm}`);
  }
  if (!(VALID_BEATS_PER_CHORD as readonly number[]).includes(beatsPerChord)) {
    throw new RangeError(
      `beatsPerChord must be one of ${VALID_BEATS_PER_CHORD.join(", ")}, got ${beatsPerChord}`,
    );
  }
  if (startOctave < MIN_OCTAVE || startOctave > MAX_OCTAVE) {
    throw new RangeError(
      `startOctave must be between ${MIN_OCTAVE} and ${MAX_OCTAVE}, got ${startOctave}`,
    );
  }

  const midi = new Midi();
  midi.header.setTempo(bpm);

  const track = midi.addTrack();
  const secondsPerBeat = SECONDS_PER_MINUTE / bpm;
  const chordDuration = beatsPerChord * secondsPerBeat;

  let prevMidi: number[] = [];

  chords.forEach((chord, index) => {
    const pitchClasses = getChordPitchClasses(chord);

    const midiNotes =
      index === 0
        ? closeVoiceChord(pitchClasses, startOctave)
        : minimalMotionVoicing(prevMidi, pitchClasses);

    const chordStartTime = index * chordDuration;

    if (arpeggioPattern) {
      // Arpeggiated export: write each note individually with staggered start times.
      const noteObjs = midiNotes.map((m) => ({ index: m % 12, midi: m }));
      const sequence = generateArpeggioSequence(noteObjs, arpeggioPattern);
      const startOffsets = computeArpeggioStartOffsets(
        sequence.length,
        secondsPerBeat,
        arpeggioPattern.subdivision,
        arpeggioPattern.swingPercent,
      );
      const beatsPerNote = getSubdivisionBeats(arpeggioPattern.subdivision);
      const noteDuration = beatsPerNote * secondsPerBeat * 0.9; // slight gap

      sequence.forEach((note, ni) => {
        const offset = startOffsets[ni] ?? ni * beatsPerNote * secondsPerBeat;
        // Wrap around if arpeggio overflows the chord duration
        const wrappedOffset = offset % chordDuration;
        track.addNote({
          midi: note.midi,
          time: chordStartTime + wrappedOffset,
          duration: noteDuration,
          velocity: VELOCITY / MIDI_MAX_VELOCITY,
        });
      });
    } else {
      // Block chord export (original behaviour).
      for (const note of midiNotes) {
        track.addNote({
          midi: note,
          time: chordStartTime,
          duration: chordDuration,
          velocity: VELOCITY / MIDI_MAX_VELOCITY,
        });
      }
    }

    if (includeChordSymbols) {
      const symbol = getChordSymbol(chord, chordLabels[index]);
      const midiText = toMidiMetaUtf8Text(symbol);
      const startTicks = index * beatsPerChord * midi.header.ppq;
      midi.header.meta.push({ type: "text", text: midiText, ticks: startTicks });
      midi.header.meta.push({ type: "marker", text: midiText, ticks: startTicks });
    }

    prevMidi = midiNotes;
  });

  return midi.toArray();
}
