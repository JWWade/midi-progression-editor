import { Midi } from "@tonejs/midi";
import type { Chord } from "@/features/current-chord/types";
import { formatChordSymbol } from "@/features/current-chord";
import {
  closeVoiceChord,
  minimalMotionVoicing,
  openVoiceChord,
  chordMatchingFlexible,
  buildVoicingTargets,
  enforceVoicingTargets,
} from "@/features/voice-leading";
import type { VoiceLeadingStyle, MotionBias, ExtensionRegisterPolicy } from "@/features/voice-leading";
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
   * Voice-leading algorithm used to voice chords during export.
   * - `'close'`    — close position for every chord (Tightly Stacked).
   * - `'minimal'`  — close position for chord 1, minimal-motion for subsequent (default).
   * - `'open'`     — open (spread) voicing for every chord (Wide & Spacious).
   * - `'flexible'` — optimal cross-chord assignment via chordMatchingFlexible.
   */
  voiceLeadingStyle: VoiceLeadingStyle;
  /**
   * Penalty for unmatched voices in cross-size transitions (0–4). Default: 2.
   * Maps to the `penalty` parameter in `chordMatchingFlexible`.
   * Only audibly meaningful for the `'flexible'` style when the progression
   * contains chords of mixed voice count.
   */
  strictness: number;
  /**
   * Directional tie-break preference for `minimalMotionVoicing`.
   * - `'neutral'` (default): no preference — keep the rounded base candidate.
   * - `'down'`: prefer the lower MIDI note on a tie.
   * - `'up'`: prefer the higher MIDI note on a tie.
   */
  motionBias: MotionBias;
  /** Extension register handling policy. */
  extensionRegisterPolicy: ExtensionRegisterPolicy;
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
 * Encode a non-negative integer as MIDI Variable-Length Quantity (VLQ) bytes.
 */
function encodeVLQ(value: number): number[] {
  if (value === 0) return [0];
  const bytes: number[] = [];
  let v = value;
  bytes.unshift(v & 0x7F);
  v >>>= 7;
  while (v > 0) {
    bytes.unshift((v & 0x7F) | 0x80);
    v >>>= 7;
  }
  return bytes;
}

/**
 * Fix the conductor track (track 0) end-of-track delta time so that the
 * conductor track extends to the true end of the piece.
 *
 * @tonejs/midi places the conductor track's EOT immediately after the last
 * meta event — which is the chord-symbol marker at the *start* of the final
 * chord.  Note tracks extend one full chord duration beyond that point.
 * Notation software that determines piece length from the conductor track will
 * see a discrepancy and render an extra empty measure at the end.
 *
 * This function patches the delta-time byte that precedes the EOT meta event
 * (`0xFF 0x2F 0x00`) so it spans the remaining ticks to the piece's true end.
 *
 * MIDI format-1 byte layout (same as `injectKeySignature`):
 *   0–13  : MThd chunk
 *   14–17 : "MTrk" marker of conductor track
 *   18–21 : conductor-track byte size, big-endian uint32
 *   22+   : conductor-track events
 */
function extendConductorTrackEOT(
  midiBytes: Uint8Array,
  eotDeltaTicks: number,
): Uint8Array {
  if (eotDeltaTicks === 0) return midiBytes;

  const SIZE_OFFSET  = 18;
  const EVENTS_START = 22;

  const ctkSize  = readBigEndianUint32(midiBytes, SIZE_OFFSET);
  const eotStart = EVENTS_START + ctkSize - 4; // EOT: [0x00, 0xFF, 0x2F, 0x00]

  // Safety check — bail if the bytes don't match the expected EOT pattern.
  if (
    midiBytes[eotStart]     !== 0x00 ||
    midiBytes[eotStart + 1] !== 0xFF ||
    midiBytes[eotStart + 2] !== 0x2F ||
    midiBytes[eotStart + 3] !== 0x00
  ) {
    return midiBytes;
  }

  const vlq        = encodeVLQ(eotDeltaTicks);
  const extraBytes = vlq.length - 1; // old delta was always 1 byte (0x00)

  const result = new Uint8Array(midiBytes.length + extraBytes);
  result.set(midiBytes.slice(0, eotStart), 0);
  result.set(vlq, eotStart);
  result.set([0xFF, 0x2F, 0x00], eotStart + vlq.length);
  result.set(midiBytes.slice(eotStart + 4), eotStart + vlq.length + 3);

  writeBigEndianUint32(result, SIZE_OFFSET, ctkSize + extraBytes);

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
  voiceLeadingStyle: 'close',
  strictness: 2,
  motionBias: 'neutral',
  extensionRegisterPolicy: 'strict',
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
 * Voice a chord using chordMatchingFlexible for optimal cross-chord assignment.
 * Each matched voice is placed at the octave closest to the corresponding
 * previous MIDI note; unmatched voices anchor to the last previous note.
 */
function flexibleVoicing(
  prevMidi: number[],
  nextPitchClasses: number[],
  strictness: number,
  motionBias: MotionBias,
): number[] {
  if (prevMidi.length === 0) return [];

  const prevPCs = prevMidi.map((m) => ((m % 12) + 12) % 12);
  const { mapping } = chordMatchingFlexible(prevPCs, nextPitchClasses, { penalty: strictness });

  // Place each matched next pitch class near its matched prev voice.
  // Use a sparse array and fill unmatched slots from the last prev voice.
  const result: (number | undefined)[] = new Array(nextPitchClasses.length);

  for (const { fromIdx, toIdx } of mapping) {
    const prevNote = prevMidi[Math.min(fromIdx, prevMidi.length - 1)]!;
    const pc = nextPitchClasses[toIdx]!;
    const k = Math.round((prevNote - pc) / 12);
    const base = 12 * k + pc;
    const candidates = [base - 12, base, base + 12];
    let best = base;
    for (const candidate of candidates) {
      const candDist = Math.abs(candidate - prevNote);
      const bestDist = Math.abs(best - prevNote);
      if (candDist < bestDist) {
        best = candidate;
      } else if (candDist === bestDist) {
        if (motionBias === 'down' && candidate < best) best = candidate;
        else if (motionBias === 'up' && candidate > best) best = candidate;
      }
    }
    result[toIdx] = best;
  }

  // Fill unmatched slots (new voices from size expansion) near the last prev note.
  const lastPrev = prevMidi[prevMidi.length - 1]!;
  for (let i = 0; i < nextPitchClasses.length; i++) {
    if (result[i] === undefined) {
      const pc = nextPitchClasses[i]!;
      const k = Math.round((lastPrev - pc) / 12);
      const base = 12 * k + pc;
      const candidates = [base - 12, base, base + 12];
      let best = base;
      for (const candidate of candidates) {
        const candDist = Math.abs(candidate - lastPrev);
        const bestDist = Math.abs(best - lastPrev);
        if (candDist < bestDist) {
          best = candidate;
        } else if (candDist === bestDist) {
          if (motionBias === 'down' && candidate < best) best = candidate;
          else if (motionBias === 'up' && candidate > best) best = candidate;
        }
      }
      result[i] = best;
    }
  }

  return result as number[];
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
    voiceLeadingStyle,
    strictness,
    motionBias,
    extensionRegisterPolicy,
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
    const targets = buildVoicingTargets(chords[i]!);
    const pitchClasses = targets.pitchClasses;
    let midiNotes: number[];

    if (voiceLeadingStyle === 'close') {
      midiNotes = closeVoiceChord(pitchClasses, startOctave);
    } else if (voiceLeadingStyle === 'open') {
      midiNotes = openVoiceChord(pitchClasses, startOctave);
    } else if (voiceLeadingStyle === 'flexible') {
      midiNotes =
        i === 0
          ? closeVoiceChord(pitchClasses, startOctave)
          : flexibleVoicing(prevMidi, pitchClasses, strictness, motionBias);
    } else {
      // 'minimal' (default): close position for chord 1, minimal motion for subsequent
      midiNotes =
        i === 0
          ? closeVoiceChord(pitchClasses, startOctave)
          : minimalMotionVoicing(prevMidi, pitchClasses, motionBias);
    }

    midiNotes = enforceVoicingTargets(midiNotes, targets, {
      extensionRegisterPolicy,
    });

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

  const rawMidi = midi.toArray();

  // ── Fix conductor track EOT so it lands at the piece's true final tick ──────
  // @tonejs/midi places the conductor EOT at the last chord-symbol tick (the
  // *start* of the final chord).  Note tracks run one chord duration longer.
  // This one-measure gap causes notation software to render a spurious extra
  // measure at the end of the score.
  const ppq = midi.header.ppq;
  const finalTicks = chords.length * beatsPerChord * ppq;
  const lastConductorEventTick =
    includeChordSymbols && chords.length > 0
      ? (chords.length - 1) * beatsPerChord * ppq
      : 0;
  const eotDelta = finalTicks - lastConductorEventTick;
  const withFixedEOT = extendConductorTrackEOT(rawMidi, eotDelta);

  // ── Inject key signature bytes directly (bypasses @tonejs/midi encoder bug) ──
  if (keySigByte) {
    return injectKeySignature(withFixedEOT, keySigByte.keyByte, keySigByte.scaleByte);
  }

  return withFixedEOT;
}
