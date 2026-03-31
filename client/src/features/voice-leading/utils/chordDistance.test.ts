import { describe, it, expect } from "vitest";
import {
  pitchClassDistance,
  chordDistance,
  chordMatching,
  chordDistanceFlexible,
  chordMatchingFlexible,
} from "./chordDistance";

describe("pitchClassDistance", () => {
  it("returns 0 for identical pitch classes", () => {
    expect(pitchClassDistance(0, 0)).toBe(0);
    expect(pitchClassDistance(7, 7)).toBe(0);
  });

  it("returns 1 for adjacent semitones", () => {
    expect(pitchClassDistance(0, 1)).toBe(1);
    expect(pitchClassDistance(1, 0)).toBe(1);
  });

  it("wraps around the octave — distance is 1 for B→C (11→0)", () => {
    expect(pitchClassDistance(11, 0)).toBe(1);
    expect(pitchClassDistance(0, 11)).toBe(1);
  });

  it("returns 6 for a tritone (C→F#)", () => {
    expect(pitchClassDistance(0, 6)).toBe(6);
  });

  it("is symmetric", () => {
    for (let a = 0; a < 12; a++) {
      for (let b = 0; b < 12; b++) {
        expect(pitchClassDistance(a, b)).toBe(pitchClassDistance(b, a));
      }
    }
  });

  it("never exceeds 6", () => {
    for (let a = 0; a < 12; a++) {
      for (let b = 0; b < 12; b++) {
        expect(pitchClassDistance(a, b)).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe("chordDistance", () => {
  it("returns 0 for identical chords", () => {
    expect(chordDistance([0, 4, 7], [0, 4, 7])).toBe(0);
  });

  it("C major → C minor = 1 (E→Eb, one semitone)", () => {
    expect(chordDistance([0, 4, 7], [0, 3, 7])).toBe(1);
  });

  it("C major → F# major = 6", () => {
    // F# major = [6, 10, 1]
    expect(chordDistance([0, 4, 7], [6, 10, 1])).toBe(6);
  });

  it("is rotation-invariant (permutation of input)", () => {
    expect(chordDistance([0, 4, 7], [7, 0, 4])).toBe(0);
    expect(chordDistance([0, 4, 7], [4, 7, 0])).toBe(0);
  });

  it("tritone-heavy case: d([0,4,7], [6,10,1]) === 6", () => {
    expect(chordDistance([0, 4, 7], [6, 10, 1])).toBe(6);
  });

  it("returns Infinity when chord sizes differ", () => {
    expect(chordDistance([0, 4, 7], [0, 4, 7, 11])).toBe(Infinity);
    expect(chordDistance([0, 4, 7, 11], [0, 4, 7])).toBe(Infinity);
  });

  it("returns 0 for empty chords", () => {
    expect(chordDistance([], [])).toBe(0);
  });

  it("is symmetric", () => {
    expect(chordDistance([0, 4, 7], [0, 3, 7])).toBe(
      chordDistance([0, 3, 7], [0, 4, 7]),
    );
    expect(chordDistance([0, 4, 7], [6, 10, 1])).toBe(
      chordDistance([6, 10, 1], [0, 4, 7]),
    );
  });

  it("satisfies triangle inequality (empirical)", () => {
    const A = [0, 4, 7]; // C major
    const B = [0, 3, 7]; // C minor
    const C = [5, 9, 0]; // F major
    expect(chordDistance(A, C)).toBeLessThanOrEqual(
      chordDistance(A, B) + chordDistance(B, C),
    );
  });
});

describe("chordMatching", () => {
  it("returns distance 0 and identity mapping for identical chords", () => {
    const result = chordMatching([0, 4, 7], [0, 4, 7]);
    expect(result.distance).toBe(0);
    expect(result.mapping).toHaveLength(3);
    // Every note maps to itself
    result.mapping.forEach(({ fromIdx, toIdx }) => {
      expect(fromIdx).toBe(toIdx);
    });
  });

  it("distance matches chordDistance", () => {
    const a = [0, 4, 7];
    const b = [0, 3, 7];
    expect(chordMatching(a, b).distance).toBe(chordDistance(a, b));
  });

  it("mapping covers all indices exactly once", () => {
    const a = [0, 4, 7];
    const b = [7, 0, 4];
    const { mapping } = chordMatching(a, b);
    const fromIndices = mapping.map((m) => m.fromIdx).sort((x, y) => x - y);
    const toIndices = mapping.map((m) => m.toIdx).sort((x, y) => x - y);
    expect(fromIndices).toEqual([0, 1, 2]);
    expect(toIndices).toEqual([0, 1, 2]);
  });

  it("mapping achieves the stated distance", () => {
    const a = [0, 4, 7];
    const b = [0, 3, 7];
    const { distance, mapping } = chordMatching(a, b);
    let computed = 0;
    for (const { fromIdx, toIdx } of mapping) {
      const diff = Math.abs(a[fromIdx] - b[toIdx]);
      computed += Math.min(diff, 12 - diff);
    }
    expect(computed).toBe(distance);
  });

  it("returns Infinity distance and empty mapping for unequal chord sizes", () => {
    const result = chordMatching([0, 4, 7], [0, 4, 7, 11]);
    expect(result.distance).toBe(Infinity);
    expect(result.mapping).toEqual([]);
  });

  it("returns 0 distance and empty mapping for empty chords", () => {
    const result = chordMatching([], []);
    expect(result.distance).toBe(0);
    expect(result.mapping).toEqual([]);
  });
});

describe("chordDistanceFlexible", () => {
  it("matches chordDistance for same-size inputs", () => {
    const a = [0, 4, 7];
    const b = [0, 3, 7];
    expect(chordDistanceFlexible(a, b)).toBe(chordDistance(a, b));
  });

  it("triad to same-pitch seventh adds only the unmatched penalty", () => {
    expect(chordDistanceFlexible([0, 4, 7], [0, 4, 7, 11], { penalty: 2 })).toBe(2);
  });

  it("triad to seventh with one semitone motion adds motion + penalty", () => {
    expect(chordDistanceFlexible([0, 4, 7], [0, 3, 7, 10], { penalty: 2 })).toBe(3);
  });

  it("is symmetric across different chord sizes", () => {
    const a = [0, 4, 7];
    const b = [0, 3, 7, 10];
    expect(chordDistanceFlexible(a, b, { penalty: 2 })).toBe(
      chordDistanceFlexible(b, a, { penalty: 2 }),
    );
  });

  it("returns penalty * unmatched count when one side is empty", () => {
    expect(chordDistanceFlexible([], [0, 4, 7], { penalty: 3 })).toBe(9);
  });

  it("throws for invalid penalty values", () => {
    expect(() => chordDistanceFlexible([0, 4, 7], [0, 4, 7, 11], { penalty: -1 })).toThrow();
    expect(() => chordDistanceFlexible([0, 4, 7], [0, 4, 7, 11], { penalty: Number.NaN })).toThrow();
  });
});

describe("chordMatchingFlexible", () => {
  it("returns min-size mapping length for cross-size input", () => {
    const result = chordMatchingFlexible([0, 4, 7], [0, 3, 7, 10], { penalty: 2 });
    expect(result.mapping).toHaveLength(3);
  });

  it("mapping indices are unique on both sides", () => {
    const result = chordMatchingFlexible([0, 4, 7], [0, 3, 7, 10], { penalty: 2 });
    const fromUnique = new Set(result.mapping.map((m) => m.fromIdx));
    const toUnique = new Set(result.mapping.map((m) => m.toIdx));
    expect(fromUnique.size).toBe(result.mapping.length);
    expect(toUnique.size).toBe(result.mapping.length);
  });

  it("distance agrees with chordDistanceFlexible", () => {
    const a = [0, 4, 7];
    const b = [0, 3, 7, 10];
    expect(chordMatchingFlexible(a, b, { penalty: 2 }).distance).toBe(
      chordDistanceFlexible(a, b, { penalty: 2 }),
    );
  });
});
