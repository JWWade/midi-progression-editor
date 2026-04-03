import { describe, it, expect } from "vitest";
import { rerootChord } from "../rerootChord";
import type { ChordType } from "@/features/chord/types";
import { CHORD_INTERVALS } from "../transpose";

describe("rerootChord", () => {
  it("returns the supplied newRoot unchanged", () => {
    const result = rerootChord([0, 4, 7], 4);
    expect(result.root).toBe(4);
  });

  it("returns matchScore=1 when newRoot is already the chord root (C major, root=0)", () => {
    const result = rerootChord([0, 4, 7], 0);
    expect(result.matchScore).toBeCloseTo(1, 5);
    expect(result.quality).toBe("major");
  });

  it("returns a partial match when re-rooting C major [0,4,7] on E (intervals from E are [0,3,8], not standard)", () => {
    // C-E-G viewed from E: E(0), G(3), C(8) — intervals [0,3,8] do not exactly match
    // any standard chord type, so matchScore < 1.
    const result = rerootChord([0, 4, 7], 4);
    expect(result.matchScore).toBeGreaterThan(0);
    expect(result.matchScore).toBeLessThan(1);
  });

  it("returns matchScore=1 when G major [7,11,2] is correctly identified with root at G (7)", () => {
    const result = rerootChord([7, 11, 2], 7);
    expect(result.matchScore).toBeCloseTo(1, 5);
    expect(result.quality).toBe("major");
  });

  it("returns matchScore in [0, 1] for arbitrary inputs", () => {
    const cases: [number[], number][] = [
      [[0, 4, 7], 0],
      [[0, 4, 7], 4],
      [[0, 4, 7], 7],
      [[1, 2, 3], 1],
      [[0, 3, 6, 10], 3],
    ];
    for (const [notes, root] of cases) {
      const { matchScore } = rerootChord(notes, root);
      expect(matchScore).toBeGreaterThanOrEqual(0);
      expect(matchScore).toBeLessThanOrEqual(1);
    }
  });

  it("returns a valid ChordType for any input", () => {
    const allTypes: ChordType[] = [
      "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7", "quartal",
    ];
    const cases: [number[], number][] = [
      [[0, 4, 7], 4],
      [[0, 3, 6], 3],
      [[1, 5, 8], 5],
    ];
    for (const [notes, root] of cases) {
      const { quality } = rerootChord(notes, root);
      expect(allTypes).toContain(quality);
    }
  });

  it("identifies a perfect match for each standard chord type re-rooted at its own root", () => {
    const symmetricTypes = new Set<ChordType>(["aug"]);
    for (const [quality, intervals] of Object.entries(CHORD_INTERVALS)) {
      for (let root = 0; root < 12; root++) {
        const notes = intervals.map((i) => (root + i) % 12);
        const result = rerootChord(notes, root);
        expect(result.matchScore).toBeCloseTo(1, 5);
        expect(result.quality).toBe(quality as ChordType);
        if (!symmetricTypes.has(quality as ChordType)) {
          expect(result.root).toBe(root);
        }
      }
    }
  });

  it("handles an empty noteIndices array without throwing", () => {
    expect(() => rerootChord([], 0)).not.toThrow();
    const { matchScore } = rerootChord([], 0);
    expect(matchScore).toBe(0);
  });
});
