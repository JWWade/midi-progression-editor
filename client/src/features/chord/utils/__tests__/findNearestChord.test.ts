import { describe, it, expect } from "vitest";
import { findNearestChord } from "../findNearestChord";
import type { ChordType } from "@/features/chord/types";

const ALL_CHORD_TYPES: ChordType[] = [
  "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7",
];

// ── findNearestChord ─────────────────────────────────────────────────────────

describe("findNearestChord", () => {
  it("returns matchScore=1 for an exact C major chord [0, 4, 7]", () => {
    const result = findNearestChord([0, 4, 7]);
    expect(result.matchScore).toBeCloseTo(1, 5);
    expect(result.root).toBe(0);
    expect(result.quality).toBe("major");
  });

  it("returns matchScore=1 for an exact C minor chord [0, 3, 7]", () => {
    const result = findNearestChord([0, 3, 7]);
    expect(result.matchScore).toBeCloseTo(1, 5);
    expect(result.root).toBe(0);
    expect(result.quality).toBe("minor");
  });

  it("returns matchScore=1 for an exact G major chord [7, 11, 2]", () => {
    const result = findNearestChord([7, 11, 2]);
    expect(result.matchScore).toBeCloseTo(1, 5);
    expect(result.root).toBe(7);
    expect(result.quality).toBe("major");
  });

  it("returns matchScore=1 for an exact C dom7 chord [0, 4, 7, 10]", () => {
    const result = findNearestChord([0, 4, 7, 10]);
    expect(result.matchScore).toBeCloseTo(1, 5);
    expect(result.root).toBe(0);
    expect(result.quality).toBe("dom7");
  });

  it("returns matchScore=1 for an exact C maj7 chord [0, 4, 7, 11]", () => {
    const result = findNearestChord([0, 4, 7, 11]);
    expect(result.matchScore).toBeCloseTo(1, 5);
    expect(result.root).toBe(0);
    expect(result.quality).toBe("maj7");
  });

  it("returns matchScore in [0, 1] for all inputs", () => {
    const testCases = [
      [0, 4, 7],
      [0, 3, 7],
      [1, 2, 3],
      [0],
      [0, 6],
    ];
    for (const notes of testCases) {
      const result = findNearestChord(notes);
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(1);
    }
  });

  it("returns a valid ChordType for any input", () => {
    const testCases = [
      [0, 4, 7],
      [0, 3, 6],
      [1, 5, 8],
      [0, 2, 4, 6],
    ];
    for (const notes of testCases) {
      const result = findNearestChord(notes);
      expect(ALL_CHORD_TYPES).toContain(result.quality);
    }
  });

  it("root is always in range 0–11", () => {
    const testCases = [
      [0, 4, 7],
      [11, 3, 6],
      [5, 9, 0],
      [7, 11, 2, 5],
    ];
    for (const notes of testCases) {
      const { root } = findNearestChord(notes);
      expect(root).toBeGreaterThanOrEqual(0);
      expect(root).toBeLessThanOrEqual(11);
    }
  });

  it("exact match always has a higher score than a truly partial match", () => {
    // C major exact [0,4,7] vs [0,4,6] — [0,4,6] doesn't match any standard chord
    const exact = findNearestChord([0, 4, 7]);
    const partial = findNearestChord([0, 4, 6]);
    expect(exact.matchScore).toBeGreaterThan(partial.matchScore);
  });

  it("identifies all 96 standard chords (12 roots × 8 types) with score=1", () => {
    const chordIntervals: Record<ChordType, number[]> = {
      major: [0, 4, 7],
      minor: [0, 3, 7],
      dim: [0, 3, 6],
      aug: [0, 4, 8],
      maj7: [0, 4, 7, 11],
      min7: [0, 3, 7, 10],
      dom7: [0, 4, 7, 10],
      halfdim7: [0, 3, 6, 10],
      quartal: [0, 5, 10],
    };
    // Augmented triads are symmetric: [0,4,8], [4,8,0], [8,0,4] all produce
    // the same pitch-class set, so any of the three roots is valid.
    const symmetricTypes = new Set<ChordType>(["aug"]);

    for (const [quality, intervals] of Object.entries(chordIntervals)) {
      for (let root = 0; root < 12; root++) {
        const notes = intervals.map((i) => (root + i) % 12);
        const result = findNearestChord(notes);
        expect(result.matchScore).toBeCloseTo(1, 5);
        expect(result.quality).toBe(quality as ChordType);
        if (!symmetricTypes.has(quality as ChordType)) {
          expect(result.root).toBe(root);
        }
      }
    }
  });
});
