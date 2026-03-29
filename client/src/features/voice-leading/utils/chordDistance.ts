/**
 * Metric distance functions between chords on the chromatic circle.
 *
 * Chords are represented as arrays of pitch classes (integers 0–11).
 * The distance between two chords is the minimum total pitch-class
 * displacement over all voice assignments (permutations).
 *
 * Mathematical foundation:
 *   d_pc(x, y) = min(|x − y|, 12 − |x − y|)   (circular semitone distance)
 *   d(A, B)    = min_{σ ∈ S_n} Σ_i d_pc(a_i, b_{σ(i)})
 */

/**
 * Circular semitone distance between two pitch classes.
 *
 * @param a - Pitch class in 0–11.
 * @param b - Pitch class in 0–11.
 * @returns Integer in [0, 6]: shortest path around the chromatic circle.
 */
export function pitchClassDistance(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 12 - diff);
}

/** Generates all permutations of an array of indices. */
function permutations(indices: number[]): number[][] {
  if (indices.length <= 1) return [indices.slice()];
  const result: number[][] = [];
  for (let i = 0; i < indices.length; i++) {
    const rest = [...indices.slice(0, i), ...indices.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([indices[i], ...perm]);
    }
  }
  return result;
}

/**
 * Minimum total pitch-class displacement between two chords over all voice assignments.
 *
 * @param a - Pitch classes of the first chord.
 * @param b - Pitch classes of the second chord.
 * @returns Minimum sum of `pitchClassDistance` values across the optimal voice assignment,
 *          or `Infinity` when the chords have different numbers of voices.
 */
export function chordDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  if (a.length === 0) return 0;

  const bIndices = b.map((_, i) => i);
  let minDist = Infinity;
  for (const perm of permutations(bIndices)) {
    let dist = 0;
    for (let i = 0; i < a.length; i++) {
      dist += pitchClassDistance(a[i], b[perm[i]]);
    }
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

/**
 * Finds the optimal voice assignment between two chords and returns both the
 * minimal distance and the index mapping that achieves it.
 *
 * @param a - Pitch classes of the first chord.
 * @param b - Pitch classes of the second chord.
 * @returns An object with:
 *   - `distance`: minimum total pitch-class displacement (same as `chordDistance`),
 *     or `Infinity` for unequal-length inputs.
 *   - `mapping`: array of `{ fromIdx, toIdx }` pairs describing the optimal
 *     voice assignment from `a` to `b` (empty when `distance` is `Infinity`).
 */
export function chordMatching(
  a: number[],
  b: number[],
): {
  distance: number;
  mapping: { fromIdx: number; toIdx: number }[];
} {
  if (a.length !== b.length) return { distance: Infinity, mapping: [] };
  if (a.length === 0) return { distance: 0, mapping: [] };

  const bIndices = b.map((_, i) => i);
  let minDist = Infinity;
  let bestPerm: number[] = [];

  for (const perm of permutations(bIndices)) {
    let dist = 0;
    for (let i = 0; i < a.length; i++) {
      dist += pitchClassDistance(a[i], b[perm[i]]);
    }
    if (dist < minDist) {
      minDist = dist;
      bestPerm = perm;
    }
  }

  const mapping = a.map((_, i) => ({ fromIdx: i, toIdx: bestPerm[i] }));
  return { distance: minDist, mapping };
}
