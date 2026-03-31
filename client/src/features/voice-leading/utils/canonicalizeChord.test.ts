import { describe, it, expect } from "vitest";
import {
  normalize,
  transpose,
  invert,
  canonicalizeChord,
} from "./canonicalizeChord";
import { chordDistance } from "./chordDistance";

// ---------------------------------------------------------------------------
// normalize
// ---------------------------------------------------------------------------
describe("normalize", () => {
  it("sorts ascending", () => {
    expect(normalize([7, 4, 0])).toEqual([0, 4, 7]);
  });

  it("applies mod 12", () => {
    expect(normalize([12, 13, 14])).toEqual([0, 1, 2]);
    expect(normalize([-1, -2])).toEqual([10, 11]);
  });

  it("removes duplicates", () => {
    expect(normalize([0, 12, 0, 7, 7])).toEqual([0, 7]);
  });

  it("returns empty array for empty input", () => {
    expect(normalize([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// transpose
// ---------------------------------------------------------------------------
describe("transpose", () => {
  it("shifts all pitch classes by k (mod 12)", () => {
    expect(transpose([0, 4, 7], 2)).toEqual([2, 6, 9]);
  });

  it("wraps around 12", () => {
    expect(transpose([10, 11], 3)).toEqual([1, 2]);
  });

  it("transpose by 0 is identity", () => {
    expect(transpose([0, 4, 7], 0)).toEqual([0, 4, 7]);
  });

  it("transpose by 12 is identity", () => {
    expect(transpose([0, 4, 7], 12)).toEqual([0, 4, 7]);
  });
});

// ---------------------------------------------------------------------------
// invert
// ---------------------------------------------------------------------------
describe("invert", () => {
  it("maps x → (−x) mod 12", () => {
    expect(invert([0, 4, 7])).toEqual([0, 5, 8]);
  });

  it("invert(0) === 0", () => {
    expect(invert([0])).toEqual([0]);
  });

  it("double inversion is identity", () => {
    const pcs = [2, 5, 9];
    expect(invert(invert(pcs))).toEqual(normalize(pcs));
  });
});

// ---------------------------------------------------------------------------
// canonicalizeChord — mode "T" (transposition invariance)
// ---------------------------------------------------------------------------
describe('canonicalizeChord — mode "T"', () => {
  // The lex-min of the major-triad orbit is [0,3,8] (obtained by transposing
  // [0,4,7] by 8: (0+8)%12=8,(4+8)%12=0,(7+8)%12=3 → sorted [0,3,8]).
  it("major triad [0,4,7] canonicalises to the lex-min [0,3,8]", () => {
    const result = canonicalizeChord([0, 4, 7]);
    expect(result.pcs).toEqual([0, 3, 8]);
    expect(result.root).toBe(0);
    expect(result.inverted).toBe(false);
  });

  // D major = T_2(C major) → same T-class → same canonical [0,3,8], rotation=6
  // (2+6)%12=8, (6+6)%12=0, (9+6)%12=3 → sorted [0,3,8]
  it("D major [2,6,9] and C major [0,4,7] share the same canonical form", () => {
    const cMajor = canonicalizeChord([0, 4, 7]);
    const dMajor = canonicalizeChord([2, 6, 9]);
    expect(dMajor.pcs).toEqual(cMajor.pcs);
    expect(dMajor.inverted).toBe(false);
  });

  it("C minor [0,3,7] is already canonical (lex-min of its orbit)", () => {
    const result = canonicalizeChord([0, 3, 7]);
    expect(result.pcs).toEqual([0, 3, 7]);
  });

  // Transposition invariance: canonicalize(A) === canonicalize(T_k(A))
  it("transposition invariance", () => {
    const A = [0, 4, 7];
    const canon = canonicalizeChord(A).pcs;
    for (let k = 0; k < 12; k++) {
      expect(canonicalizeChord(transpose(A, k)).pcs).toEqual(canon);
    }
  });

  // Idempotence: canonicalize(canonicalize(A).pcs) === canonicalize(A)
  it("idempotence", () => {
    const A = [0, 4, 7];
    const first = canonicalizeChord(A);
    const second = canonicalizeChord(first.pcs);
    expect(second.pcs).toEqual(first.pcs);
    expect(second.root).toBe(first.root);
  });

  it("accepts unsorted input", () => {
    // [7,0,4] is a rotation of C major → same canonical as [0,4,7]
    expect(canonicalizeChord([7, 0, 4]).pcs).toEqual(
      canonicalizeChord([0, 4, 7]).pcs,
    );
  });

  it("accepts out-of-range input", () => {
    // 14=2, 18=6, 21=9 → D major → same canonical as C major
    expect(canonicalizeChord([14, 18, 21]).pcs).toEqual(
      canonicalizeChord([0, 4, 7]).pcs,
    );
  });

  it("throws for empty input", () => {
    expect(() => canonicalizeChord([])).toThrow();
  });

  it("single note canonicalises to 0", () => {
    const result = canonicalizeChord([5]);
    expect(result.pcs).toEqual([0]);
    expect(result.root).toBe(0);
  });

  it("seventh chord [0,4,7,11] is stable under any transposition", () => {
    const canon = canonicalizeChord([0, 4, 7, 11]).pcs;
    for (let k = 0; k < 12; k++) {
      expect(canonicalizeChord(transpose([0, 4, 7, 11], k)).pcs).toEqual(canon);
    }
  });
});

// ---------------------------------------------------------------------------
// canonicalizeChord — mode "TI" (transposition + inversion)
// ---------------------------------------------------------------------------
describe('canonicalizeChord — mode "TI"', () => {
  it("inversion of major [0,5,8] shares TI canonical with C minor [0,3,7]", () => {
    // invert([0,4,7]) = [0,5,8].  In T mode [0,5,8] → [0,3,7] (lex-min).
    // In TI mode the inversion branch of [0,5,8] is [0,4,7] → canonical [0,3,8].
    // Lex-min overall: [0,3,7] (from direct transpositions), inverted=false.
    const result = canonicalizeChord([0, 5, 8], "TI");
    expect(result.pcs).toEqual([0, 3, 7]);
  });

  it("inversion invariance: canonicalize(A,'TI') === canonicalize(invert(A),'TI')", () => {
    const A = [0, 4, 7];
    expect(canonicalizeChord(A, "TI").pcs).toEqual(
      canonicalizeChord(invert(A), "TI").pcs,
    );
  });

  it("transposition invariance in TI mode", () => {
    const A = [0, 4, 7];
    const canon = canonicalizeChord(A, "TI").pcs;
    for (let k = 0; k < 12; k++) {
      expect(canonicalizeChord(transpose(A, k), "TI").pcs).toEqual(canon);
    }
  });

  it("idempotence in TI mode", () => {
    const A = [0, 4, 7];
    const first = canonicalizeChord(A, "TI");
    const second = canonicalizeChord(first.pcs, "TI");
    expect(second.pcs).toEqual(first.pcs);
  });

  it("distinct TI classes are not collapsed", () => {
    // C major and C minor belong to different TI classes — wait, actually they
    // are TI-equivalent (minor is inversion of major).  Use a set that is NOT
    // TI-equivalent to major, e.g. augmented triad (self-inverse) vs. major.
    const augCanon = canonicalizeChord([0, 4, 8], "TI").pcs;
    const majCanon = canonicalizeChord([0, 4, 7], "TI").pcs;
    expect(augCanon).not.toEqual(majCanon);
  });

  it("throws for empty input in TI mode", () => {
    expect(() => canonicalizeChord([], "TI")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Metric compatibility: d(A,B) === d(T_k(A), T_k(B))
// ---------------------------------------------------------------------------
describe("metric compatibility", () => {
  it("chordDistance is transposition-invariant", () => {
    const A = [0, 4, 7];
    const B = [0, 3, 7];
    const d = chordDistance(A, B);
    for (let k = 0; k < 12; k++) {
      expect(chordDistance(transpose(A, k), transpose(B, k))).toBe(d);
    }
  });
});
