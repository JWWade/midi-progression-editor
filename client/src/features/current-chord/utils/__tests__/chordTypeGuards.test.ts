import { describe, it, expect } from "vitest";
import { isCustomChord, getChordNotes } from "../chordTypeGuards";
import type { Chord } from "@/features/current-chord/types";

describe("isCustomChord", () => {
  it("returns true when customNotes is an array", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [0, 4, 7] };
    expect(isCustomChord(chord)).toBe(true);
  });

  it("returns true for an empty customNotes array", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [] };
    expect(isCustomChord(chord)).toBe(true);
  });

  it("returns false when customNotes is undefined", () => {
    const chord: Chord = { root: 0, quality: "major" };
    expect(isCustomChord(chord)).toBe(false);
  });

  it("returns false for a minor chord without customNotes", () => {
    const chord: Chord = { root: 5, quality: "minor" };
    expect(isCustomChord(chord)).toBe(false);
  });

  it("returns false for a seventh chord without customNotes", () => {
    const chord: Chord = { root: 7, quality: "dom7" };
    expect(isCustomChord(chord)).toBe(false);
  });
});

describe("getChordNotes", () => {
  it("returns customNotes directly when defined (ignores root/quality)", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [1, 5, 9] };
    expect(getChordNotes(chord)).toEqual([1, 5, 9]);
  });

  it("returns an empty array when customNotes is empty", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [] };
    expect(getChordNotes(chord)).toEqual([]);
  });

  it("computes notes from root + quality when customNotes is absent", () => {
    const chord: Chord = { root: 0, quality: "major" };
    // C major: C(0), E(4), G(7)
    expect(getChordNotes(chord)).toEqual([0, 4, 7]);
  });

  it("computes notes from root + quality for a minor chord", () => {
    const chord: Chord = { root: 2, quality: "minor" };
    // D minor: D(2), F(5), A(9)
    expect(getChordNotes(chord)).toEqual([2, 5, 9]);
  });

  it("computes notes from root + quality for a seventh chord", () => {
    const chord: Chord = { root: 7, quality: "dom7" };
    // G7: G(7), B(11), D(2), F(5)
    expect(getChordNotes(chord)).toEqual([7, 11, 2, 5]);
  });

  it("wraps pitch classes correctly at the octave boundary (B major)", () => {
    const chord: Chord = { root: 11, quality: "major" };
    // B major: B(11), D#(3), F#(6)
    expect(getChordNotes(chord)).toEqual([11, 3, 6]);
  });

  it("all returned indices are in range 0–11 for all chord types across all roots", () => {
    const qualities: Chord["quality"][] = [
      "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7",
    ];
    for (let root = 0; root < 12; root++) {
      for (const quality of qualities) {
        const notes = getChordNotes({ root, quality });
        for (const note of notes) {
          expect(note).toBeGreaterThanOrEqual(0);
          expect(note).toBeLessThanOrEqual(11);
        }
      }
    }
  });
});
