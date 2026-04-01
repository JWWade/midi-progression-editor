import { Midi } from "@tonejs/midi";
import type { Chord } from "@/features/current-chord/types";
import { formatChordSymbol } from "@/features/current-chord";
import { getChordPitchClasses } from "@/features/chord/utils";
import { closeVoiceChord, minimalMotionVoicing } from "@/features/voice-leading";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ArpeggioPattern } from "@/features/audio/types/arpeggioPattern";
import {
  generateArpeggioSequence,
  computeArpeggioStartOffsets,
  getSubdivisionBeats,
} from "@/features/audio/utils/arpeggioUtils";
import type { ScaleContext } from "@/shared/types/ScaleContext";

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
  /**
   * When provided, a MIDI key signature meta event (0x59) is written at tick 0
   * derived from the scale context root and mode.
   */
  scaleContext?: ScaleContext | null;
}

const MIN_BPM = 40;
const MAX_BPM = 240;
const VALID_BEATS_PER_CHORD = [1, 2, 4] as const;
const DEFAULT_BPM = 120;
const DEFAULT_BEATS_PER_CHORD = 2;
const MIN_OCTAVE = 2;
const MAX_OCTAVE = 6;
const DEFAULT_OCTAVE = 4;
/** Default note-on velocity (0–127). */
const DEFAULT_VELOCITY = 80;
const MIDI_MAX_VELOCITY = 127;
const SECONDS_PER_MINUTE = 60;

/**
 * MIDI key signature byte for each major key root (pitch class 0–11).
 *
 * In standard MIDI, the key signature byte is:
 *   positive = number of sharps, negative = number of flats.
 *
 *  C=0, Db=-5, D=2, Eb=-3, E=4, F=-1, F#=6, G=1, Ab=-4, A=3, Bb=-2, B=5
 */
const MAJOR_KEY_BYTES: readonly number[] = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5];

/**
 * MIDI key signature byte for each minor key root (pitch class 0–11).
 *
 * Each minor key shares its sharps/flats count with its relative major:
 *  Cm=-3, C#m=4, Dm=-1, Ebm=-6, Em=1, Fm=-4, F#m=3, Gm=-2, Abm=-7, Am=0, Bbm=-5, Bm=2
 */
const MINOR_KEY_BYTES: readonly number[] = [-3, 4, -1, -6, 1, -4, 3, -2, -7, 0, -5, 2];

/**
 * Semitone offsets added to a modal root to obtain the corresponding
 * relative-major root (used for encoding key signatures for modal scales).
 *
 * E.g. D Dorian (+10) → (2 + 10) % 12 = 0 = C (relative major).
 */
const MODE_TO_MAJOR_OFFSET: Partial<Record<ScaleContext["mode"], number>> = {
  dorian: 10,
  phrygian: 8,
  lydian: 7,
  mixolydian: 5,
};

/**
 * Derive the raw MIDI key signature values from a `ScaleContext`.
 *
 * Returns `{ keyByte, scaleByte }` where:
 * - `keyByte`   is the signed MIDI key byte (−7 = 7 flats … 0 = C … +7 = 7 sharps)
 * - `scaleByte` is 0 for major or 1 for minor
 *
 * Returns `null` when the mode cannot be mapped.  This should not occur with
 * the current `ScaleType` union (all 8 modes are handled), but provides a safe
 * fallback if future scale types are added without a corresponding mapping.
 */
function deriveKeySignatureByte(
  scaleContext: ScaleContext,
): { keyByte: number; scaleByte: number } | null {
  const { root, mode } = scaleContext;

  if (mode === "major") {
    return { keyByte: MAJOR_KEY_BYTES[root]!, scaleByte: 0 };
  }

  if (
    mode === "naturalMinor" ||
    mode === "harmonicMinor" ||
    mode === "melodicMinor"
  ) {
    return { keyByte: MINOR_KEY_BYTES[root]!, scaleByte: 1 };
  }

  const offset = MODE_TO_MAJOR_OFFSET[mode];
  if (offset !== undefined) {
    const majorRoot = (root + offset) % 12;
    return { keyByte: MAJOR_KEY_BYTES[majorRoot]!, scaleByte: 0 };
  }

  return null;
}

/** Read a big-endian unsigned 32-bit integer from a byte array. */
function readBigEndianUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset]! << 24) |
     (bytes[offset + 1]! << 16) |
     (bytes[offset + 2]! << 8) |
     bytes[offset + 3]!) >>> 0
  );
}

/** Write a big-endian unsigned 32-bit integer into a byte array. */
function writeBigEndianUint32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset]     = (value >>> 24) & 0xFF;
  bytes[offset + 1] = (value >>> 16) & 0xFF;
  bytes[offset + 2] = (value >>> 8)  & 0xFF;
  bytes[offset + 3] = value          & 0xFF;
}

/**
 * Inject a MIDI key signature meta event (0xFF 0x59) at tick 0 in the
 * conductor track (track 0) of a format-1 MIDI byte array.
 *
 * @tonejs/midi v2.0.28 has a known bug where it encodes key signatures with
 * `keyIndex + 7` instead of `keyIndex − 7`, producing non-standard byte values
 * that external DAWs and notation software misread.  This function injects the
 * correct bytes directly, bypassing the library's encoder.
 *
 * MIDI format-1 byte layout used here:
 *   0–13  : MThd chunk (4 "MThd" + 4 length + 6 header data = 14 bytes)
 *   14–17 : "MTrk" marker of conductor track (4 bytes)
 *   18–21 : conductor-track byte size, big-endian uint32 (18 = 14 + 4)
 *   22+   : conductor-track events           (22 = 18 + 4)
 */
function injectKeySignature(
  midiBytes: Uint8Array,
  keyByte: number,
  scaleByte: number,
): Uint8Array {
  // Byte offsets for the conductor track's size field and first event.
  const SIZE_OFFSET   = 18; // 14 (MThd) + 4 ("MTrk")
  const EVENTS_START  = 22; // 18 + 4 (size field)

  // Key signature meta event: delta-time=0, 0xFF 0x59 0x02, key, scale (6 bytes)
  const keySigEvent = new Uint8Array([
    0x00,                    // delta-time = 0
    0xFF, 0x59, 0x02,        // meta type 0x59, length 2
    (keyByte + 256) & 0xFF,  // key byte: convert signed (−7…+7) to unsigned 8-bit
    scaleByte & 0xFF,        // 0 = major, 1 = minor
  ]);

  // Assemble the new byte array with the event inserted at the start of events.
  const result = new Uint8Array(midiBytes.length + keySigEvent.length);
  result.set(midiBytes.slice(0, EVENTS_START), 0);
  result.set(keySigEvent, EVENTS_START);
  result.set(midiBytes.slice(EVENTS_START), EVENTS_START + keySigEvent.length);

  // Patch the conductor track size field to account for the 6 new bytes.
  const newSize = readBigEndianUint32(midiBytes, SIZE_OFFSET) + keySigEvent.length;
  writeBigEndianUint32(result, SIZE_OFFSET, newSize);

  return result;
}
/**
 * Fraction of the subdivision duration used as note-on time for arpeggiated
 * notes.  The remaining 10 % provides a subtle gap (articulation) between
 * consecutive arpeggiated notes so that DAWs render them as distinct events.
 */
const ARPEGGIO_NOTE_DURATION_FACTOR = 0.9;

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
  return formatChordSymbol(chord, pitchClasses);
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
 * @param options - MIDI export options (BPM, beats per chord, start octave, key signature, etc.).
 * @returns A `Uint8Array` of MIDI file bytes suitable for a `Blob` with `type: "audio/midi"`.
 */
export function buildMidiFile(
  chords: Chord[],
  options: Partial<MidiExportOptions> = {},
): Uint8Array {
  const {
    bpm,
    beatsPerChord,
    startOctave,
    includeChordSymbols,
    chordLabels,
    arpeggioPattern,
    scaleContext,
  } = {
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

  // ── Tempo (already supported; written to conductor track 0) ──────────────
  midi.header.setTempo(bpm);

  // ── Time signature (meta event 0x58) ─────────────────────────────────────
  // Denominator is the actual note-value number (4 = quarter note).
  midi.header.timeSignatures.push({ ticks: 0, timeSignature: [beatsPerChord, 4] });

  // ── Key signature (meta event 0x59) ──────────────────────────────────────
  // Note: @tonejs/midi v2.0.28 has a bug in its key signature encoder.  We
  // skip midi.header.keySignatures and inject the correct bytes manually after
  // calling midi.toArray().
  let keySigByte: { keyByte: number; scaleByte: number } | null = null;
  if (scaleContext) {
    keySigByte = deriveKeySignatureByte(scaleContext);
  }

  const secondsPerBeat = SECONDS_PER_MINUTE / bpm;
  const chordDuration = beatsPerChord * secondsPerBeat;
  const normalizedVelocity = DEFAULT_VELOCITY / MIDI_MAX_VELOCITY;

  // ── Pre-compute all voicings ──────────────────────────────────────────────
  const allVoicings: number[][] = [];
  let prevMidi: number[] = [];
  for (let i = 0; i < chords.length; i++) {
    const pitchClasses = getChordPitchClasses(chords[i]!);
    const midiNotes =
      i === 0
        ? closeVoiceChord(pitchClasses, startOctave)
        : minimalMotionVoicing(prevMidi, pitchClasses);
    allVoicings.push(midiNotes);
    prevMidi = midiNotes;
  }

  if (arpeggioPattern) {
    // ── Arpeggiated export: single named track ───────────────────────────
    const track = midi.addTrack();
    track.name = "Arpeggio";

    allVoicings.forEach((midiNotes, index) => {
      const chordStartTime = index * chordDuration;
      const noteObjs = midiNotes.map((m) => ({ index: m % 12, midi: m }));
      const sequence = generateArpeggioSequence(noteObjs, arpeggioPattern);
      const startOffsets = computeArpeggioStartOffsets(
        sequence.length,
        secondsPerBeat,
        arpeggioPattern.subdivision,
        arpeggioPattern.swingPercent,
      );
      const beatsPerNote = getSubdivisionBeats(arpeggioPattern.subdivision);
      const noteDuration = beatsPerNote * secondsPerBeat * ARPEGGIO_NOTE_DURATION_FACTOR;

      sequence.forEach((note, ni) => {
        const offset = startOffsets[ni] ?? ni * beatsPerNote * secondsPerBeat;
        // Wrap around if arpeggio overflows the chord duration
        const wrappedOffset = offset % chordDuration;
        track.addNote({
          midi: note.midi,
          time: chordStartTime + wrappedOffset,
          duration: noteDuration,
          velocity: normalizedVelocity,
        });
      });
    });
  } else {
    // ── Block chord export: one track per voice ───────────────────────────
    // Determine the maximum number of simultaneous voices across all chords.
    const maxVoices = allVoicings.reduce((max, v) => Math.max(max, v.length), 0);

    // Create a named track for each voice (Voice 1 = lowest / bass).
    const voiceTracks = Array.from({ length: maxVoices }, (_, i) => {
      const track = midi.addTrack();
      track.name = `Voice ${i + 1}`;
      return track;
    });

    allVoicings.forEach((midiNotes, index) => {
      const chordStartTime = index * chordDuration;
      midiNotes.forEach((note, voiceIndex) => {
        voiceTracks[voiceIndex]!.addNote({
          midi: note,
          time: chordStartTime,
          duration: chordDuration,
          velocity: normalizedVelocity,
        });
      });
    });
  }

  // ── Chord symbol meta events ──────────────────────────────────────────────
  chords.forEach((chord, index) => {
    if (includeChordSymbols) {
      const symbol = getChordSymbol(chord, chordLabels[index]);
      const midiText = toMidiMetaUtf8Text(symbol);
      const startTicks = index * beatsPerChord * midi.header.ppq;
      midi.header.meta.push({ type: "text", text: midiText, ticks: startTicks });
      midi.header.meta.push({ type: "marker", text: midiText, ticks: startTicks });
    }
  });

  const midiBytes = midi.toArray();

  // ── Inject key signature bytes directly (bypasses @tonejs/midi encoder bug) ──
  if (keySigByte) {
    return injectKeySignature(midiBytes, keySigByte.keyByte, keySigByte.scaleByte);
  }

  return midiBytes;
}
