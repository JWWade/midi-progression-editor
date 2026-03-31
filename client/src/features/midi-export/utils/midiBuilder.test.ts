import { describe, it, expect } from "vitest";
import { Midi } from "@tonejs/midi";
import { parseMidi } from "midi-file";
import { buildMidiFile } from "./midiBuilder";
import type { Chord } from "@/features/current-chord/types";

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
});

