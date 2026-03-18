import { describe, it, expect } from "vitest";
import { getChordPitchClasses } from "../getChordPitchClasses";
import type { Chord } from "@/features/current-chord/types";
import type { ChordType } from "@/features/chord/types";

const ALL_8_CHORD_TYPES: ChordType[] = [
  "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7",
];

describe("getChordPitchClasses", () => {
  describe("named chords", () => {
    it("returns [0, 4, 7] for C major", () => {
      const chord: Chord = { root: 0, quality: "major" };
      expect(getChordPitchClasses(chord)).toEqual([0, 4, 7]);
    });

    it("returns [0, 3, 7] for C minor", () => {
      const chord: Chord = { root: 0, quality: "minor" };
      expect(getChordPitchClasses(chord)).toEqual([0, 3, 7]);
    });

    it("returns [0, 3, 6] for C diminished", () => {
      const chord: Chord = { root: 0, quality: "dim" };
      expect(getChordPitchClasses(chord)).toEqual([0, 3, 6]);
    });

    it("returns [0, 4, 8] for C augmented", () => {
      const chord: Chord = { root: 0, quality: "aug" };
      expect(getChordPitchClasses(chord)).toEqual([0, 4, 8]);
    });

    it("returns [0, 4, 7, 11] for C maj7", () => {
      const chord: Chord = { root: 0, quality: "maj7" };
      expect(getChordPitchClasses(chord)).toEqual([0, 4, 7, 11]);
    });

    it("returns [0, 3, 7, 10] for C min7", () => {
      const chord: Chord = { root: 0, quality: "min7" };
      expect(getChordPitchClasses(chord)).toEqual([0, 3, 7, 10]);
    });

    it("returns [0, 4, 7, 10] for C dom7", () => {
      const chord: Chord = { root: 0, quality: "dom7" };
      expect(getChordPitchClasses(chord)).toEqual([0, 4, 7, 10]);
    });

    it("returns [0, 3, 6, 10] for C halfdim7", () => {
      const chord: Chord = { root: 0, quality: "halfdim7" };
      expect(getChordPitchClasses(chord)).toEqual([0, 3, 6, 10]);
    });

    it("transposes to the correct root: G major (root=7) → [7, 11, 2]", () => {
      const chord: Chord = { root: 7, quality: "major" };
      expect(getChordPitchClasses(chord)).toEqual([7, 11, 2]);
    });

    it("wraps at octave boundary: B major (root=11) → [11, 3, 6]", () => {
      const chord: Chord = { root: 11, quality: "major" };
      expect(getChordPitchClasses(chord)).toEqual([11, 3, 6]);
    });

    it("produces valid 0–11 indices for all 8 chord types at every root", () => {
      for (let root = 0; root < 12; root++) {
        for (const quality of ALL_8_CHORD_TYPES) {
          const chord: Chord = { root, quality };
          const pitches = getChordPitchClasses(chord);
          expect(pitches.length).toBeGreaterThan(0);
          for (const p of pitches) {
            expect(p).toBeGreaterThanOrEqual(0);
            expect(p).toBeLessThanOrEqual(11);
          }
        }
      }
    });
  });

  describe("custom chords", () => {
    it("returns customNotes directly, ignoring root/quality", () => {
      const chord: Chord = { root: 0, quality: "major", customNotes: [0, 4, 8] };
      expect(getChordPitchClasses(chord)).toEqual([0, 4, 8]);
    });

    it("returns customNotes for a different quality than the notes imply", () => {
      const chord: Chord = { root: 5, quality: "minor", customNotes: [1, 5, 9] };
      expect(getChordPitchClasses(chord)).toEqual([1, 5, 9]);
    });

    it("returns an empty array when customNotes is empty", () => {
      const chord: Chord = { root: 0, quality: "major", customNotes: [] };
      expect(getChordPitchClasses(chord)).toEqual([]);
    });

    it("returns a single-note array when customNotes has one element", () => {
      const chord: Chord = { root: 0, quality: "major", customNotes: [7] };
      expect(getChordPitchClasses(chord)).toEqual([7]);
    });
  });
});
