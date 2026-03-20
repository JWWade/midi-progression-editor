import { describe, it, expect } from "vitest";
import { findNearestChord } from "../findNearestChord";
import { CHORD_INTERVALS } from "../transpose";
import type { ChordType } from "@/features/chord/types";

const ALL_8_CHORD_TYPES: ChordType[] = [
  "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7",
];

describe("findNearestChord", () => {
  describe("exact matches return matchScore = 1", () => {
    it("returns C major (root=0, quality='major') with score 1 for [0, 4, 7]", () => {
      const result = findNearestChord([0, 4, 7]);
      expect(result.root).toBe(0);
      expect(result.quality).toBe("major");
      expect(result.matchScore).toBe(1);
    });

    it("returns C minor (root=0, quality='minor') with score 1 for [0, 3, 7]", () => {
      const result = findNearestChord([0, 3, 7]);
      expect(result.root).toBe(0);
      expect(result.quality).toBe("minor");
      expect(result.matchScore).toBe(1);
    });

    it("returns C dim (root=0, quality='dim') with score 1 for [0, 3, 6]", () => {
      const result = findNearestChord([0, 3, 6]);
      expect(result.root).toBe(0);
      expect(result.quality).toBe("dim");
      expect(result.matchScore).toBe(1);
    });

    it("returns C aug (root=0, quality='aug') with score 1 for [0, 4, 8]", () => {
      const result = findNearestChord([0, 4, 8]);
      expect(result.root).toBe(0);
      expect(result.quality).toBe("aug");
      expect(result.matchScore).toBe(1);
    });

    it("returns C maj7 (root=0, quality='maj7') with score 1 for [0, 4, 7, 11]", () => {
      const result = findNearestChord([0, 4, 7, 11]);
      expect(result.root).toBe(0);
      expect(result.quality).toBe("maj7");
      expect(result.matchScore).toBe(1);
    });

    it("returns G major (root=7, quality='major') with score 1 for [7, 11, 2]", () => {
      const result = findNearestChord([7, 11, 2]);
      expect(result.root).toBe(7);
      expect(result.quality).toBe("major");
      expect(result.matchScore).toBe(1);
    });

    it("returns B major (root=11, quality='major') with score 1 for [11, 3, 6]", () => {
      const result = findNearestChord([11, 3, 6]);
      expect(result.root).toBe(11);
      expect(result.quality).toBe("major");
      expect(result.matchScore).toBe(1);
    });
  });

  describe("exact match for all 8 chord types at root=0", () => {
    it.each(ALL_8_CHORD_TYPES)(
      "exact match for %s chord type returns score 1",
      (quality) => {
        const intervals = Array.from(CHORD_INTERVALS[quality]);
        const noteIndices = intervals.map((i) => (0 + i) % 12);
        const result = findNearestChord(noteIndices);
        expect(result.matchScore).toBe(1);
        expect(result.root).toBe(0);
        expect(result.quality).toBe(quality);
      },
    );
  });

  describe("matchScore is always in [0, 1]", () => {
    it("returns matchScore in [0, 1] for a single note", () => {
      const result = findNearestChord([0]);
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(1);
    });

    it("returns matchScore in [0, 1] for all 8 chord types across all 12 roots", () => {
      for (let root = 0; root < 12; root++) {
        for (const quality of ALL_8_CHORD_TYPES) {
          const intervals = Array.from(CHORD_INTERVALS[quality]);
          const noteIndices = intervals.map((i) => (root + i) % 12);
          const result = findNearestChord(noteIndices);
          expect(result.matchScore).toBeGreaterThanOrEqual(0);
          expect(result.matchScore).toBeLessThanOrEqual(1);
        }
      }
    });

    it("returns matchScore < 1 when an extra unrelated note is added", () => {
      // C major [0, 4, 7] plus F# [6] — no standard chord contains all four
      const result = findNearestChord([0, 4, 6, 7]);
      expect(result.matchScore).toBeLessThan(1);
      expect(result.matchScore).toBeGreaterThan(0);
    });
  });

  describe("returned root is always a valid pitch class (0–11)", () => {
    it("root is in range 0–11 for various note inputs", () => {
      const testInputs = [
        [0, 4, 7],
        [7, 11, 2],
        [1, 5, 8],
        [0, 3, 6, 10],
        [5],
      ];
      for (const input of testInputs) {
        const result = findNearestChord(input);
        expect(result.root).toBeGreaterThanOrEqual(0);
        expect(result.root).toBeLessThanOrEqual(11);
      }
    });
  });

  describe("partial matches", () => {
    it("score is lower when only 2 of 3 chord notes are supplied", () => {
      // C major uses [0, 4, 7]; supply [0, 4] only
      const partial = findNearestChord([0, 4]);
      // Full C major
      const full = findNearestChord([0, 4, 7]);
      expect(partial.matchScore).toBeLessThan(full.matchScore);
    });

    it("identifies a plausible chord for a single note", () => {
      // A single note (C=0) should return a chord containing C with positive score
      const result = findNearestChord([0]);
      expect(result.matchScore).toBeGreaterThan(0);
      const intervals = Array.from(CHORD_INTERVALS[result.quality]);
      const chordNotes = intervals.map((i) => (result.root + i) % 12);
      expect(chordNotes).toContain(0);
    });
  });
});
