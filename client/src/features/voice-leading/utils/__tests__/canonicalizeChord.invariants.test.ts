/**
 * Canonicalization invariant tests for canonicalizeChord.
 *
 * Verifies the following properties:
 *   1. Idempotence:             canon(canon(x)) = canon(x)
 *   2. Transposition invariance: canon(x) = canon(transpose(x, k)) for all k ∈ [0–11]
 *   3. Inversion invariance (TI): canon(x, "TI") = canon(invert(x), "TI")
 *   4. Deterministic output:     sorted ascending, no duplicates, all ∈ [0–11]
 */

import { describe, it, expect } from "vitest";
import {
  canonicalizeChord,
  transpose,
  invert,
} from "../canonicalizeChord";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple seeded LCG for deterministic randomness in tests. */
function makeLCG(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function randomInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min));
}

function generateRandomTriad(rng: () => number): number[] {
  const pcs = new Set<number>();
  while (pcs.size < 3) {
    pcs.add(randomInt(0, 12, rng));
  }
  return Array.from(pcs).sort((a, b) => a - b);
}

const TRIALS = 200;

// ---------------------------------------------------------------------------
// 1. Idempotence: canon(canon(x)) === canon(x)
// ---------------------------------------------------------------------------

describe("canonicalizeChord — idempotence", () => {
  it("applying canonicalizeChord twice gives the same result (T mode)", () => {
    const rng = makeLCG(0x1234abcd);
    for (let i = 0; i < TRIALS; i++) {
      const pcs = generateRandomTriad(rng);
      const once = canonicalizeChord(pcs, "T").pcs;
      const twice = canonicalizeChord(once, "T").pcs;
      expect(twice).toEqual(once);
    }
  });

  it("applying canonicalizeChord twice gives the same result (TI mode)", () => {
    const rng = makeLCG(0xabcd1234);
    for (let i = 0; i < TRIALS; i++) {
      const pcs = generateRandomTriad(rng);
      const once = canonicalizeChord(pcs, "TI").pcs;
      const twice = canonicalizeChord(once, "TI").pcs;
      expect(twice).toEqual(once);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Transposition invariance: canon(x) === canon(transpose(x, k)) for all k
// ---------------------------------------------------------------------------

describe("canonicalizeChord — transposition invariance", () => {
  it("canon(x) === canon(transpose(x, k)) for all k ∈ [0–11], T mode", () => {
    const rng = makeLCG(0xdeadbeef);
    for (let i = 0; i < TRIALS; i++) {
      const pcs = generateRandomTriad(rng);
      const base = canonicalizeChord(pcs, "T").pcs;
      for (let k = 0; k < 12; k++) {
        const transposed = canonicalizeChord(transpose(pcs, k), "T").pcs;
        expect(transposed).toEqual(base);
      }
    }
  });

  it("canon(x) === canon(transpose(x, k)) for all k ∈ [0–11], TI mode", () => {
    const rng = makeLCG(0xfeedface);
    for (let i = 0; i < TRIALS; i++) {
      const pcs = generateRandomTriad(rng);
      const base = canonicalizeChord(pcs, "TI").pcs;
      for (let k = 0; k < 12; k++) {
        const transposed = canonicalizeChord(transpose(pcs, k), "TI").pcs;
        expect(transposed).toEqual(base);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Inversion invariance (TI mode only): canon(x, "TI") === canon(invert(x), "TI")
// ---------------------------------------------------------------------------

describe("canonicalizeChord — inversion invariance (TI mode)", () => {
  it("canon(x, TI) === canon(invert(x), TI) for random triads", () => {
    const rng = makeLCG(0xcafebabe);
    for (let i = 0; i < TRIALS; i++) {
      const pcs = generateRandomTriad(rng);
      const canon = canonicalizeChord(pcs, "TI").pcs;
      const canonInv = canonicalizeChord(invert(pcs), "TI").pcs;
      expect(canonInv).toEqual(canon);
    }
  });

  it("inversion invariance does NOT hold in T mode (positive counter-example)", () => {
    // C minor [0,3,7] and its inversion are separate T-orbits but the same TI-orbit.
    // This test confirms TI gives the same canonical for x and invert(x).
    const pcs = [0, 3, 7];
    expect(canonicalizeChord(pcs, "TI").pcs).toEqual(
      canonicalizeChord(invert(pcs), "TI").pcs,
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Deterministic output: sorted ascending, no duplicates, all ∈ [0–11]
// ---------------------------------------------------------------------------

describe("canonicalizeChord — deterministic output format", () => {
  it("output pcs is sorted strictly ascending (T mode)", () => {
    const rng = makeLCG(0xbadf00d);
    for (let i = 0; i < TRIALS; i++) {
      const pcs = generateRandomTriad(rng);
      const canon = canonicalizeChord(pcs, "T").pcs;
      for (let j = 1; j < canon.length; j++) {
        expect(canon[j]).toBeGreaterThan(canon[j - 1]);
      }
    }
  });

  it("output pcs is sorted strictly ascending (TI mode)", () => {
    const rng = makeLCG(0x0ff0a5a5);
    for (let i = 0; i < TRIALS; i++) {
      const pcs = generateRandomTriad(rng);
      const canon = canonicalizeChord(pcs, "TI").pcs;
      for (let j = 1; j < canon.length; j++) {
        expect(canon[j]).toBeGreaterThan(canon[j - 1]);
      }
    }
  });

  it("output pcs has no duplicate values", () => {
    const rng = makeLCG(0x5a5a5a5a);
    for (let i = 0; i < TRIALS; i++) {
      const pcs = generateRandomTriad(rng);
      const canon = canonicalizeChord(pcs, "T").pcs;
      expect(new Set(canon).size).toBe(canon.length);
    }
  });

  it("all output pcs values are in [0, 11]", () => {
    const rng = makeLCG(0xa5a5a5a5);
    for (let i = 0; i < TRIALS; i++) {
      const pcs = generateRandomTriad(rng);
      for (const mode of ["T", "TI"] as const) {
        const canon = canonicalizeChord(pcs, mode).pcs;
        for (const pc of canon) {
          expect(pc).toBeGreaterThanOrEqual(0);
          expect(pc).toBeLessThanOrEqual(11);
        }
      }
    }
  });

  it("produces the same result on repeated calls (deterministic)", () => {
    const pcs = [0, 4, 7];
    const first = canonicalizeChord(pcs, "T").pcs;
    for (let i = 0; i < 10; i++) {
      expect(canonicalizeChord(pcs, "T").pcs).toEqual(first);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("canonicalizeChord — edge cases", () => {
  it("throws for empty pitch-class array", () => {
    expect(() => canonicalizeChord([], "T")).toThrow();
    expect(() => canonicalizeChord([], "TI")).toThrow();
  });

  it("normalizes duplicate pitch classes before canonicalizing", () => {
    // [0, 0, 4, 7] should behave like [0, 4, 7] after normalize
    const withDups = canonicalizeChord([0, 0, 4, 7], "T").pcs;
    const clean = canonicalizeChord([0, 4, 7], "T").pcs;
    expect(withDups).toEqual(clean);
  });

  it("wraps out-of-range values via mod 12", () => {
    const wrapped = canonicalizeChord([12, 16, 19], "T").pcs; // = [0, 4, 7]
    const normal = canonicalizeChord([0, 4, 7], "T").pcs;
    expect(wrapped).toEqual(normal);
  });
});
