import { describe, it, expect } from "vitest";
import { Midi } from "@tonejs/midi";
import { parseMidi } from "midi-file";
import { buildMidiFile } from "./midiBuilder";
import type { Chord } from "@/features/current-chord/types";
import type { ScaleContext } from "@/shared/types/ScaleContext";

// MIDI header magic bytes: "MThd"
const MIDI_HEADER = [0x4d, 0x54, 0x68, 0x64];

const C_MAJOR: Chord = { root: 0, quality: "major" };
const G_MAJOR: Chord = { root: 7, quality: "major" };
const C_MAJ7: Chord = { root: 0, quality: "maj7" };
const C_HALFDIM7: Chord = { root: 0, quality: "halfdim7" };

/** Parse raw MIDI bytes back into a Midi object for inspection. */
function parseMidiTone(bytes: Uint8Array): Midi {
  return new Midi(bytes);
}

/** Count total notes across all tracks. */
function countNotes(midi: Midi): number {
  return midi.tracks.reduce((sum, t) => sum + t.notes.length, 0);
}

/** Get pitch classes (0–11) of all notes across all tracks. */
function allPitchClasses(midi: Midi): number[] {
  return midi.tracks.flatMap((t) => t.notes.map((n) => n.midi % 12));
}

/** Collect all text and marker meta events from track 0 (header/conductor track). */
function collectChordSymbolEvents(bytes: Uint8Array): Array<{ type: string; text: string; absoluteTick: number }> {
  const midiData = parseMidi(bytes);
  const headerTrack = midiData.tracks[0] ?? [];
  const results: Array<{ type: string; text: string; absoluteTick: number }> = [];
  let absoluteTick = 0;
  for (const event of headerTrack) {
    absoluteTick += event.deltaTime;
    if ((event.type === "text" || event.type === "marker") && "text" in event) {
      results.push({ type: event.type, text: event.text, absoluteTick });
    }
  }
  return results;
}

/** Collect time signature events from track 0. */
function collectTimeSignatureEvents(
  bytes: Uint8Array,
): Array<{ numerator: number; denominator: number; absoluteTick: number }> {
  const midiData = parseMidi(bytes);
  const headerTrack = midiData.tracks[0] ?? [];
  const results: Array<{ numerator: number; denominator: number; absoluteTick: number }> = [];
  let absoluteTick = 0;
  for (const event of headerTrack) {
    absoluteTick += event.deltaTime;
    if (event.type === "timeSignature") {
      results.push({ numerator: event.numerator, denominator: event.denominator, absoluteTick });
    }
  }
  return results;
}

/** Collect key signature events from track 0. */
function collectKeySignatureEvents(
  bytes: Uint8Array,
): Array<{ key: number; scale: number; absoluteTick: number }> {
  const midiData = parseMidi(bytes);
  const headerTrack = midiData.tracks[0] ?? [];
  const results: Array<{ key: number; scale: number; absoluteTick: number }> = [];
  let absoluteTick = 0;
  for (const event of headerTrack) {
    absoluteTick += event.deltaTime;
    if (event.type === "keySignature") {
      results.push({ key: event.key, scale: event.scale, absoluteTick });
    }
  }
  return results;
}

/**
 * Return the absolute tick of the end-of-track event in the conductor track
 * (track 0 in the raw MIDI bytes).
 */
function getConductorTrackEOTTick(bytes: Uint8Array): number {
  const midiData = parseMidi(bytes);
  const conductorTrack = midiData.tracks[0] ?? [];
  let absoluteTick = 0;
  for (const event of conductorTrack) {
    absoluteTick += event.deltaTime;
  }
  return absoluteTick; // last delta accumulation = EOT position
}

/** Collect track name events from all tracks. */
function collectTrackNames(bytes: Uint8Array): string[] {
  const midiData = parseMidi(bytes);
  const names: string[] = [];
  for (const track of midiData.tracks) {
    for (const event of track) {
      if (event.type === "trackName" && "text" in event) {
        names.push(event.text);
      }
    }
  }
  return names;
}

function containsByteSequence(haystack: Uint8Array, needle: number[]): boolean {
  if (needle.length === 0) return true;
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        continue outer;
      }
    }
    return true;
  }
  return false;
}

describe("buildMidiFile", () => {
  const EGC_CUSTOM: Chord = { root: 4, quality: "major", customNotes: [4, 7, 0] };
  const GCE_CUSTOM: Chord = { root: 7, quality: "major", customNotes: [7, 0, 4] };

  it("returns a non-empty Uint8Array beginning with MIDI header magic bytes", () => {
    const result = buildMidiFile([C_MAJOR, G_MAJOR]);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    expect(Array.from(result.slice(0, 4))).toEqual(MIDI_HEADER);
  });

  it("includes exactly 3 notes for a C major triad", () => {
    const result = buildMidiFile([C_MAJOR]);
    const midi = parseMidiTone(result);
    expect(countNotes(midi)).toBe(3);
  });

  it("includes exactly 4 notes for a CMaj7 chord", () => {
    const result = buildMidiFile([C_MAJ7]);
    const midi = parseMidiTone(result);
    expect(countNotes(midi)).toBe(4);
  });

  it("uses customNotes pitch classes when non-empty, ignoring quality", () => {
    const customChord: Chord = { root: 0, quality: "major", customNotes: [0, 4, 8] };
    const result = buildMidiFile([customChord]);
    const midi = parseMidiTone(result);
    const pitchClasses = allPitchClasses(midi).sort((a, b) => a - b);
    expect(pitchClasses).toEqual([0, 4, 8]);
  });

  it("produces different byte output when BPM changes", () => {
    const slow = buildMidiFile([C_MAJOR, G_MAJOR], { bpm: 60 });
    const fast = buildMidiFile([C_MAJOR, G_MAJOR], { bpm: 120 });
    expect(slow).not.toEqual(fast);
    expect(Array.from(slow.slice(0, 4))).toEqual(MIDI_HEADER);
    expect(Array.from(fast.slice(0, 4))).toEqual(MIDI_HEADER);
  });

  it("encodes tempo correctly in the MIDI header", () => {
    const result120 = buildMidiFile([C_MAJOR], { bpm: 120 });
    const result60 = buildMidiFile([C_MAJOR], { bpm: 60 });
    const midi120 = parseMidiTone(result120);
    const midi60 = parseMidiTone(result60);
    // @tonejs/midi exposes BPM via header.tempos
    expect(midi120.header.tempos[0]?.bpm).toBeCloseTo(120);
    expect(midi60.header.tempos[0]?.bpm).toBeCloseTo(60);
  });

  it("throws RangeError when bpm is out of range", () => {
    expect(() => buildMidiFile([C_MAJOR], { bpm: 30 })).toThrow(RangeError);
    expect(() => buildMidiFile([C_MAJOR], { bpm: 300 })).toThrow(RangeError);
  });

  it("throws RangeError when beatsPerChord is invalid", () => {
    expect(() => buildMidiFile([C_MAJOR], { beatsPerChord: 3 })).toThrow(RangeError);
  });

  it("returns valid MIDI for an empty chord list", () => {
    const result = buildMidiFile([]);
    expect(Array.from(result.slice(0, 4))).toEqual(MIDI_HEADER);
    expect(countNotes(parseMidiTone(result))).toBe(0);
  });

  it("exports first chord notes at the specified startOctave", () => {
    // C3 = 48, E3 = 52, G3 = 55
    const result = buildMidiFile([C_MAJOR], { startOctave: 3 });
    const midi = parseMidiTone(result);
    const pitches = midi.tracks.flatMap((t) => t.notes.map((n) => n.midi)).sort((a, b) => a - b);
    expect(pitches).toEqual([48, 52, 55]);
  });

  it("throws RangeError when startOctave is out of range", () => {
    expect(() => buildMidiFile([C_MAJOR], { startOctave: 1 })).toThrow(RangeError);
    expect(() => buildMidiFile([C_MAJOR], { startOctave: 7 })).toThrow(RangeError);
  });

  describe("chord symbol meta events", () => {
    const AS_MAJ7: Chord = { root: 10, quality: "maj7" };  // A# / Bb major 7th
    const G_MINOR: Chord = { root: 7, quality: "minor" };  // Gm

    it("writes text (0x01) and marker (0x06) meta events for each chord by default", () => {
      const result = buildMidiFile([C_MAJOR, G_MAJOR]);
      const events = collectChordSymbolEvents(result);
      const textEvents = events.filter((e) => e.type === "text");
      const markerEvents = events.filter((e) => e.type === "marker");
      expect(textEvents).toHaveLength(2);
      expect(markerEvents).toHaveLength(2);
    });

    it("auto-derives correct chord symbol text for named chords", () => {
      const result = buildMidiFile([C_MAJOR, AS_MAJ7, G_MINOR]);
      const events = collectChordSymbolEvents(result);
      const textEvents = events.filter((e) => e.type === "text");
      expect(textEvents[0]?.text).toBe("C");
      expect(textEvents[1]?.text).toBe("A#maj7");  // default pitch classes use sharps
      expect(textEvents[2]?.text).toBe("Gm");
    });

    it("places text meta events at the correct tick positions", () => {
      // beatsPerChord=2, PPQ=480 → chord 0 at tick 0, chord 1 at tick 960
      const result = buildMidiFile([C_MAJOR, G_MAJOR], { beatsPerChord: 2 });
      const events = collectChordSymbolEvents(result);
      const textEvents = events.filter((e) => e.type === "text");
      expect(textEvents[0]?.absoluteTick).toBe(0);
      expect(textEvents[1]?.absoluteTick).toBe(960);
    });

    it("places marker meta events at the correct tick positions", () => {
      const result = buildMidiFile([C_MAJOR, G_MAJOR], { beatsPerChord: 4 });
      const events = collectChordSymbolEvents(result);
      const markerEvents = events.filter((e) => e.type === "marker");
      // beatsPerChord=4, PPQ=480 → chord 0 at 0, chord 1 at 1920
      expect(markerEvents[0]?.absoluteTick).toBe(0);
      expect(markerEvents[1]?.absoluteTick).toBe(1920);
    });

    it("omits chord symbol meta events when includeChordSymbols is false", () => {
      const result = buildMidiFile([C_MAJOR, G_MAJOR], { includeChordSymbols: false });
      const events = collectChordSymbolEvents(result);
      expect(events).toHaveLength(0);
    });

    it("produces no chord symbol events for an empty chord list", () => {
      const result = buildMidiFile([], { includeChordSymbols: true });
      const events = collectChordSymbolEvents(result);
      expect(events).toHaveLength(0);
    });

    it("uses manual chordLabels override when provided", () => {
      const result = buildMidiFile([C_MAJOR, G_MAJOR], {
        chordLabels: ["I", "V"],
      });
      const events = collectChordSymbolEvents(result);
      const textEvents = events.filter((e) => e.type === "text");
      expect(textEvents[0]?.text).toBe("I");
      expect(textEvents[1]?.text).toBe("V");
    });

    it("falls back to auto-derived name when chordLabels entry is empty string", () => {
      const result = buildMidiFile([C_MAJOR, G_MAJOR], {
        chordLabels: ["", "G override"],
      });
      const events = collectChordSymbolEvents(result);
      const textEvents = events.filter((e) => e.type === "text");
      expect(textEvents[0]?.text).toBe("C");
      expect(textEvents[1]?.text).toBe("G override");
    });

    it("exports rerooted custom chord symbols anchored to the selected root", () => {
      const result = buildMidiFile([C_MAJOR, EGC_CUSTOM, GCE_CUSTOM]);
      const events = collectChordSymbolEvents(result);
      const textEvents = events.filter((e) => e.type === "text");
      expect(textEvents[0]?.text).toBe("C");
      expect(textEvents[1]?.text).toBe("Em");
      expect(textEvents[2]?.text).toBe("Gq");
    });

    it("still prefers manual label overrides for custom chords", () => {
      const result = buildMidiFile([EGC_CUSTOM], {
        chordLabels: ["alt"],
      });
      const events = collectChordSymbolEvents(result);
      const textEvents = events.filter((e) => e.type === "text");
      expect(textEvents[0]?.text).toBe("alt");
    });

    it("does not change note count or pitches when chord symbols are enabled", () => {
      const withSymbols = buildMidiFile([C_MAJOR], { includeChordSymbols: true });
      const withoutSymbols = buildMidiFile([C_MAJOR], { includeChordSymbols: false });
      expect(countNotes(parseMidiTone(withSymbols))).toBe(3);
      expect(countNotes(parseMidiTone(withoutSymbols))).toBe(3);
    });

    it("encodes half-diminished symbol as UTF-8 bytes for meta text", () => {
      const result = buildMidiFile([C_HALFDIM7]);
      // "Cø7" in UTF-8 bytes = 43 C3 B8 37
      expect(containsByteSequence(result, [0x43, 0xc3, 0xb8, 0x37])).toBe(true);
      // Ensure we are not emitting single-byte 0xF8 for "ø"
      expect(containsByteSequence(result, [0x43, 0xf8, 0x37])).toBe(false);
    });
  });

  describe("time signature meta event", () => {
    it("writes a time signature event at tick 0 with numerator matching beatsPerChord", () => {
      const result = buildMidiFile([C_MAJOR], { beatsPerChord: 4 });
      const events = collectTimeSignatureEvents(result);
      expect(events).toHaveLength(1);
      expect(events[0]?.numerator).toBe(4);
      expect(events[0]?.denominator).toBe(4); // quarter note denominator
      expect(events[0]?.absoluteTick).toBe(0);
    });

    it("encodes 2/4 time when beatsPerChord is 2", () => {
      const result = buildMidiFile([C_MAJOR], { beatsPerChord: 2 });
      const events = collectTimeSignatureEvents(result);
      expect(events[0]?.numerator).toBe(2);
      expect(events[0]?.denominator).toBe(4);
    });

    it("encodes 1/4 time when beatsPerChord is 1", () => {
      const result = buildMidiFile([C_MAJOR], { beatsPerChord: 1 });
      const events = collectTimeSignatureEvents(result);
      expect(events[0]?.numerator).toBe(1);
      expect(events[0]?.denominator).toBe(4);
    });

    it("does not change note count or pitches when time signature is encoded", () => {
      const result = buildMidiFile([C_MAJOR, G_MAJOR], { beatsPerChord: 4 });
      expect(countNotes(parseMidiTone(result))).toBe(6);
    });
  });

  describe("key signature meta event", () => {
    it("writes no key signature event when scaleContext is not provided", () => {
      const result = buildMidiFile([C_MAJOR]);
      const events = collectKeySignatureEvents(result);
      expect(events).toHaveLength(0);
    });

    it("writes no key signature event when scaleContext is null", () => {
      const result = buildMidiFile([C_MAJOR], { scaleContext: null });
      const events = collectKeySignatureEvents(result);
      expect(events).toHaveLength(0);
    });

    it("encodes C major key signature (0 sharps/flats) at tick 0", () => {
      const ctx: ScaleContext = { root: 0, mode: "major" };
      const result = buildMidiFile([C_MAJOR], { scaleContext: ctx });
      const events = collectKeySignatureEvents(result);
      expect(events).toHaveLength(1);
      expect(events[0]?.key).toBe(0); // 0 sharps/flats
      expect(events[0]?.scale).toBe(0); // major
      expect(events[0]?.absoluteTick).toBe(0);
    });

    it("encodes G major key signature (1 sharp)", () => {
      const ctx: ScaleContext = { root: 7, mode: "major" };
      const result = buildMidiFile([C_MAJOR], { scaleContext: ctx });
      const events = collectKeySignatureEvents(result);
      expect(events[0]?.key).toBe(1); // 1 sharp (G major)
      expect(events[0]?.scale).toBe(0); // major
    });

    it("encodes F major key signature (1 flat)", () => {
      const ctx: ScaleContext = { root: 5, mode: "major" };
      const result = buildMidiFile([C_MAJOR], { scaleContext: ctx });
      const events = collectKeySignatureEvents(result);
      expect(events[0]?.key).toBe(-1); // 1 flat (F major)
      expect(events[0]?.scale).toBe(0); // major
    });

    it("encodes A natural minor key signature (0 sharps/flats, minor)", () => {
      const ctx: ScaleContext = { root: 9, mode: "naturalMinor" };
      const result = buildMidiFile([C_MAJOR], { scaleContext: ctx });
      const events = collectKeySignatureEvents(result);
      expect(events[0]?.key).toBe(0); // 0 sharps/flats (relative to C major)
      expect(events[0]?.scale).toBe(1); // minor
    });

    it("encodes E natural minor key signature (1 sharp, minor)", () => {
      const ctx: ScaleContext = { root: 4, mode: "naturalMinor" };
      const result = buildMidiFile([C_MAJOR], { scaleContext: ctx });
      const events = collectKeySignatureEvents(result);
      expect(events[0]?.key).toBe(1); // 1 sharp (E minor → G major)
      expect(events[0]?.scale).toBe(1); // minor
    });

    it("encodes D Dorian as C major key signature (relative major)", () => {
      // D Dorian has the same notes as C major
      const ctx: ScaleContext = { root: 2, mode: "dorian" };
      const result = buildMidiFile([C_MAJOR], { scaleContext: ctx });
      const events = collectKeySignatureEvents(result);
      expect(events[0]?.key).toBe(0); // C major (0 sharps/flats)
      expect(events[0]?.scale).toBe(0); // major (relative major key)
    });

    it("encodes G Mixolydian as C major key signature (relative major)", () => {
      // G Mixolydian has the same notes as C major
      const ctx: ScaleContext = { root: 7, mode: "mixolydian" };
      const result = buildMidiFile([C_MAJOR], { scaleContext: ctx });
      const events = collectKeySignatureEvents(result);
      expect(events[0]?.key).toBe(0); // C major (0 sharps/flats)
      expect(events[0]?.scale).toBe(0); // major
    });

    it("encodes harmonic minor as minor key signature", () => {
      const ctx: ScaleContext = { root: 9, mode: "harmonicMinor" }; // A harmonic minor
      const result = buildMidiFile([C_MAJOR], { scaleContext: ctx });
      const events = collectKeySignatureEvents(result);
      expect(events[0]?.scale).toBe(1); // minor
    });

    it("encodes melodic minor as minor key signature", () => {
      const ctx: ScaleContext = { root: 9, mode: "melodicMinor" }; // A melodic minor
      const result = buildMidiFile([C_MAJOR], { scaleContext: ctx });
      const events = collectKeySignatureEvents(result);
      expect(events[0]?.scale).toBe(1); // minor
    });
  });

  describe("note velocity", () => {
    it("uses the default velocity of 80 for block chord notes", () => {
      const result = buildMidiFile([C_MAJOR]);
      const midi = parseMidiTone(result);
      const note = midi.tracks[0]?.notes[0];
      expect(note).toBeDefined();
      // velocity is normalised (0–1); 80/127 ≈ 0.6299
      expect(note!.velocity).toBeCloseTo(80 / 127, 2);
    });
  });

  describe("voice separation", () => {
    it("creates one track per voice for a block chord triad (3 voices)", () => {
      const result = buildMidiFile([C_MAJOR]);
      const midi = parseMidiTone(result);
      expect(midi.tracks).toHaveLength(3);
    });

    it("creates one track per voice for a seventh chord (4 voices)", () => {
      const result = buildMidiFile([C_MAJ7]);
      const midi = parseMidiTone(result);
      expect(midi.tracks).toHaveLength(4);
    });

    it("uses the max voice count across all chords for the track count", () => {
      // C major triad (3 notes) followed by CMaj7 (4 notes) → 4 tracks
      const result = buildMidiFile([C_MAJOR, C_MAJ7]);
      const midi = parseMidiTone(result);
      expect(midi.tracks).toHaveLength(4);
    });

    it("assigns each voice to the correct track (lowest note in track 0)", () => {
      // C major close voicing from octave 3: C3=48, E3=52, G3=55
      const result = buildMidiFile([C_MAJOR], { startOctave: 3 });
      const midi = parseMidiTone(result);
      const voice1Note = midi.tracks[0]?.notes[0];
      expect(voice1Note?.midi).toBe(48); // C3 = lowest (bass)
    });

    it("total note count is preserved across all voice tracks", () => {
      // 2 chords × 3 notes = 6 total notes
      const result = buildMidiFile([C_MAJOR, G_MAJOR]);
      const midi = parseMidiTone(result);
      expect(countNotes(midi)).toBe(6);
    });

    it("uses a single track for arpeggiated export", () => {
      const result = buildMidiFile([C_MAJOR], {
        arpeggioPattern: { direction: "up", subdivision: "eighth", swingPercent: 0, repeats: 1 },
      });
      const midi = parseMidiTone(result);
      expect(midi.tracks).toHaveLength(1);
    });

    it("returns an empty track list for an empty chord list", () => {
      const result = buildMidiFile([]);
      const midi = parseMidiTone(result);
      expect(midi.tracks).toHaveLength(0);
    });
  });

  describe("track names", () => {
    it("names block chord tracks 'Voice 1', 'Voice 2', 'Voice 3' for a triad", () => {
      const result = buildMidiFile([C_MAJOR]);
      const names = collectTrackNames(result).filter((n) => n.startsWith("Voice"));
      expect(names).toEqual(["Voice 1", "Voice 2", "Voice 3"]);
    });

    it("names the arpeggio track 'Arpeggio'", () => {
      const result = buildMidiFile([C_MAJOR], {
        arpeggioPattern: { direction: "up", subdivision: "eighth", swingPercent: 0, repeats: 1 },
      });
      const names = collectTrackNames(result);
      expect(names).toContain("Arpeggio");
    });
  });

  describe("conductor track EOT placement", () => {
    // The conductor track's end-of-track event must land at the piece's true
    // final tick (numChords × beatsPerChord × ppq), not at the start of the
    // last chord.  A misplaced EOT causes notation software to render an extra
    // empty measure after the final chord.

    it("places conductor track EOT at the piece's final tick for 2 chords (beatsPerChord=2)", () => {
      // 2 chords × 2 beats × 480 ppq = 1920 ticks
      const result = buildMidiFile([C_MAJOR, G_MAJOR], { beatsPerChord: 2 });
      expect(getConductorTrackEOTTick(result)).toBe(1920);
    });

    it("places conductor track EOT at the piece's final tick for 1 chord", () => {
      // 1 chord × 2 beats × 480 ppq = 960 ticks
      const result = buildMidiFile([C_MAJOR], { beatsPerChord: 2 });
      expect(getConductorTrackEOTTick(result)).toBe(960);
    });

    it("places conductor track EOT at the piece's final tick for 4 beatsPerChord", () => {
      // 2 chords × 4 beats × 480 ppq = 3840 ticks
      const result = buildMidiFile([C_MAJOR, G_MAJOR], { beatsPerChord: 4 });
      expect(getConductorTrackEOTTick(result)).toBe(3840);
    });

    it("places conductor track EOT correctly when chord symbols are omitted", () => {
      // Even without chord symbol meta events the EOT must extend to finalTicks.
      // 2 chords × 2 beats × 480 ppq = 1920 ticks
      const result = buildMidiFile([C_MAJOR, G_MAJOR], {
        beatsPerChord: 2,
        includeChordSymbols: false,
      });
      expect(getConductorTrackEOTTick(result)).toBe(1920);
    });

    it("places conductor track EOT at tick 0 for an empty chord list", () => {
      const result = buildMidiFile([]);
      expect(getConductorTrackEOTTick(result)).toBe(0);
    });
  });
});

