import { describe, it, expect } from "vitest";
import { Midi } from "@tonejs/midi";
import { buildMidiFile } from "./midiBuilder";
import type { Chord } from "@/features/current-chord/types";

// MIDI header magic bytes: "MThd"
const MIDI_HEADER = [0x4d, 0x54, 0x68, 0x64];

const C_MAJOR: Chord = { root: 0, quality: "major" };
const G_MAJOR: Chord = { root: 7, quality: "major" };
const C_MAJ7: Chord = { root: 0, quality: "maj7" };

/** Parse raw MIDI bytes back into a Midi object for inspection. */
function parseMidi(bytes: Uint8Array): Midi {
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

describe("buildMidiFile", () => {
  it("returns a non-empty Uint8Array beginning with MIDI header magic bytes", () => {
    const result = buildMidiFile([C_MAJOR, G_MAJOR]);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    expect(Array.from(result.slice(0, 4))).toEqual(MIDI_HEADER);
  });

  it("includes exactly 3 notes for a C major triad", () => {
    const result = buildMidiFile([C_MAJOR]);
    const midi = parseMidi(result);
    expect(countNotes(midi)).toBe(3);
  });

  it("includes exactly 4 notes for a CMaj7 chord", () => {
    const result = buildMidiFile([C_MAJ7]);
    const midi = parseMidi(result);
    expect(countNotes(midi)).toBe(4);
  });

  it("uses customNotes pitch classes when non-empty, ignoring quality", () => {
    const customChord: Chord = { root: 0, quality: "major", customNotes: [0, 4, 8] };
    const result = buildMidiFile([customChord]);
    const midi = parseMidi(result);
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
    const midi120 = parseMidi(result120);
    const midi60 = parseMidi(result60);
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
    expect(countNotes(parseMidi(result))).toBe(0);
  });

  it("exports first chord notes at the specified startOctave", () => {
    // C3 = 48, E3 = 52, G3 = 55
    const result = buildMidiFile([C_MAJOR], { startOctave: 3 });
    const midi = parseMidi(result);
    const pitches = midi.tracks.flatMap((t) => t.notes.map((n) => n.midi)).sort((a, b) => a - b);
    expect(pitches).toEqual([48, 52, 55]);
  });

  it("throws RangeError when startOctave is out of range", () => {
    expect(() => buildMidiFile([C_MAJOR], { startOctave: 1 })).toThrow(RangeError);
    expect(() => buildMidiFile([C_MAJOR], { startOctave: 7 })).toThrow(RangeError);
  });
});

