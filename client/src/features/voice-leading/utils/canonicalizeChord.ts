/**
 * Canonical chord representations under transposition (and optional inversion).
 *
 * A chord (pitch-class set) belongs to an equivalence class under the
 * transposition group T (all 12 semitone shifts) or the dihedral group T/I
 * (transpositions + inversion).  Canonicalization picks the lexicographically
 * smallest representative, which gives a stable key suitable for caching,
 * graph nodes, and symmetry-aware comparisons.
 *
 * Mathematical foundation:
 *   T_k(A) = { (a + k) mod 12 }          transposition by k semitones
 *   I(A)   = { (-a)     mod 12 }          inversion (reflection through 0)
 *   canonical = lex-min over all candidates
 */

export type CanonicalizationMode = "T" | "TI";

export interface CanonicalChord {
  /** Sorted canonical pitch classes (the lex-min representative). */
  pcs: number[];
  /** First element of `pcs` — the representative root (0–11). */
  root: number;
  /** Transposition applied to reach this representative (0–11). */
  rotation: number;
  /** Whether inversion was applied before the winning transposition. */
  inverted: boolean;
}

/**
 * Normalises a pitch-class array: applies mod 12, removes duplicates, sorts
 * ascending.
 *
 * @param pcs - Raw pitch-class values (may be outside 0–11 or contain duplicates).
 * @returns Deduplicated, sorted array of integers in 0–11.
 */
export function normalize(pcs: number[]): number[] {
  const seen = new Set<number>();
  for (const p of pcs) {
    seen.add(((p % 12) + 12) % 12);
  }
  return Array.from(seen).sort((a, b) => a - b);
}

/**
 * Transposes every pitch class in `pcs` by `k` semitones (mod 12).
 *
 * @param pcs - Pitch classes in 0–11.
 * @param k   - Semitones to shift (0–11).
 * @returns New sorted array of transposed pitch classes.
 */
export function transpose(pcs: number[], k: number): number[] {
  return normalize(pcs.map((p) => p + k));
}

/**
 * Inverts a pitch-class set: maps each element x → (−x) mod 12.
 *
 * @param pcs - Pitch classes (any integers; normalised internally).
 * @returns New sorted array of inverted pitch classes.
 */
export function invert(pcs: number[]): number[] {
  return normalize(pcs.map((p) => -p));
}

/**
 * Returns the canonical (lex-min) representative of a pitch-class set under
 * the chosen symmetry group.
 *
 * Mode "T"  — equivalence under transposition only (cyclic group of order 12).
 * Mode "TI" — equivalence under transposition + inversion (dihedral group of
 *             order 24).
 *
 * @param pcs  - Input pitch classes (any integers; normalised internally).
 * @param mode - Symmetry group to use (default: "T").
 * @returns A {@link CanonicalChord} describing the lex-min representative and
 *          the transform that produces it.
 * @throws {Error} When `pcs` is empty after normalisation.
 */
export function canonicalizeChord(
  pcs: number[],
  mode: CanonicalizationMode = "T",
): CanonicalChord {
  const normalised = normalize(pcs);
  if (normalised.length === 0) {
    throw new Error("canonicalizeChord: pitch-class set must not be empty");
  }

  /** Candidates: [pitchClasses, transpositionK, wasInverted] */
  type Candidate = [number[], number, boolean];
  const candidates: Candidate[] = [];

  for (let k = 0; k < 12; k++) {
    candidates.push([transpose(normalised, k), k, false]);
  }

  if (mode === "TI") {
    const inv = invert(normalised);
    for (let k = 0; k < 12; k++) {
      candidates.push([transpose(inv, k), k, true]);
    }
  }

  // Lexicographic comparison: compare element by element
  const lexLess = (a: number[], b: number[]): boolean => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] < b[i]) return true;
      if (a[i] > b[i]) return false;
    }
    return a.length < b.length;
  };

  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    if (lexLess(candidates[i][0], best[0])) {
      best = candidates[i];
    }
  }

  return {
    pcs: best[0],
    root: best[0][0],
    rotation: best[1],
    inverted: best[2],
  };
}
