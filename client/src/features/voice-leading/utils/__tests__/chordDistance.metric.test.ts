/**
 * Metric property tests for chordDistance.
 *
 * Verifies that chordDistance satisfies the four axioms of a metric space:
 *   1. Non-negativity:      d(a, b) ≥ 0
 *   2. Identity:            d(a, a) = 0
 *   3. Symmetry:            d(a, b) = d(b, a)
 *   4. Triangle inequality: d(a, c) ≤ d(a, b) + d(b, c)
 */

import { describe, it, expect } from "vitest";
import { chordDistance } from "../chordDistance";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Returns a random integer in [min, max) using the given seed-like counter. */
function randomInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min));
}

/**
 * Generates a random triad — 3 distinct pitch classes in [0, 11].
 * Uses the provided pseudo-random number generator for reproducibility.
 */
function generateRandomTriad(rng: () => number): number[] {
  const pcs = new Set<number>();
  while (pcs.size < 3) {
    pcs.add(randomInt(0, 12, rng));
  }
  return Array.from(pcs).sort((a, b) => a - b);
}

/** Simple seeded LCG for deterministic randomness in tests. */
function makeLCG(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const TRIALS = 200;

// ---------------------------------------------------------------------------
// 1. Non-negativity: d(a, b) >= 0
// ---------------------------------------------------------------------------

describe("chordDistance — non-negativity", () => {
  it("d(a, b) is never negative for random triads", () => {
    const rng = makeLCG(0xdeadbeef);
    for (let i = 0; i < TRIALS; i++) {
      const a = generateRandomTriad(rng);
      const b = generateRandomTriad(rng);
      expect(chordDistance(a, b)).toBeGreaterThanOrEqual(0);
    }
  });

  it("d(a, a) is exactly 0 for random triads (self-distance)", () => {
    const rng = makeLCG(0xfeedface);
    for (let i = 0; i < TRIALS; i++) {
      const a = generateRandomTriad(rng);
      expect(chordDistance(a, a)).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Identity: d(a, a) = 0
// ---------------------------------------------------------------------------

describe("chordDistance — identity of indiscernibles", () => {
  it("d(a, a) = 0 for all 12 chromatic triads starting on C", () => {
    // Spot-check every root with a major triad
    for (let root = 0; root < 12; root++) {
      const triad = [root % 12, (root + 4) % 12, (root + 7) % 12].sort(
        (a, b) => a - b,
      );
      expect(chordDistance(triad, triad)).toBe(0);
    }
  });

  it("d(a, b) = 0 only when a and b represent the same pitch-class set", () => {
    // Two distinct chords must have positive distance
    expect(chordDistance([0, 4, 7], [0, 3, 7])).toBeGreaterThan(0);
    expect(chordDistance([0, 4, 7], [2, 6, 9])).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Symmetry: d(a, b) = d(b, a)
// ---------------------------------------------------------------------------

describe("chordDistance — symmetry", () => {
  it("d(a, b) === d(b, a) for random triads", () => {
    const rng = makeLCG(0xcafebabe);
    for (let i = 0; i < TRIALS; i++) {
      const a = generateRandomTriad(rng);
      const b = generateRandomTriad(rng);
      expect(chordDistance(a, b)).toBe(chordDistance(b, a));
    }
  });

  it("symmetry holds for known chord pairs", () => {
    const pairs: [number[], number[]][] = [
      [[0, 4, 7], [0, 3, 7]],
      [[0, 4, 7], [5, 9, 0]],
      [[0, 3, 6], [0, 4, 8]],
      [[1, 5, 8], [2, 6, 11]],
    ];
    for (const [a, b] of pairs) {
      expect(chordDistance(a, b)).toBe(chordDistance(b, a));
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Triangle inequality: d(a, c) <= d(a, b) + d(b, c)
// ---------------------------------------------------------------------------

describe("chordDistance — triangle inequality", () => {
  it("d(a, c) <= d(a, b) + d(b, c) for random triads", () => {
    const rng = makeLCG(0xbadf00d);
    for (let i = 0; i < TRIALS; i++) {
      const a = generateRandomTriad(rng);
      const b = generateRandomTriad(rng);
      const c = generateRandomTriad(rng);
      const dab = chordDistance(a, b);
      const dbc = chordDistance(b, c);
      const dac = chordDistance(a, c);
      expect(dac).toBeLessThanOrEqual(dab + dbc);
    }
  });

  it("triangle inequality holds for known triples", () => {
    const triples: [number[], number[], number[]][] = [
      [[0, 4, 7], [0, 3, 7], [5, 9, 0]],
      [[0, 4, 7], [2, 6, 9], [4, 8, 11]],
      [[0, 3, 6], [0, 4, 7], [0, 4, 8]],
    ];
    for (const [a, b, c] of triples) {
      const dab = chordDistance(a, b);
      const dbc = chordDistance(b, c);
      const dac = chordDistance(a, c);
      expect(dac).toBeLessThanOrEqual(dab + dbc);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("chordDistance — edge cases", () => {
  it("returns Infinity for chords of different sizes", () => {
    expect(chordDistance([0, 4, 7], [0, 4, 7, 11])).toBe(Infinity);
    expect(chordDistance([0, 4, 7, 11], [0, 4, 7])).toBe(Infinity);
  });

  it("returns 0 for empty chords", () => {
    expect(chordDistance([], [])).toBe(0);
  });
});
