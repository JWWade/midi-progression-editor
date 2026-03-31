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
 *
 * **Backend counterpart:** `ProgressionAnalyzer.ComputeMotion()` in
 * `server/ParametricMusic.Api/Services/ProgressionAnalyzer.cs` implements the
 * same cyclic pitch-class distance metric but searches only cyclic rotations
 * (O(n²)) rather than all n! permutations. For chords with ≤4 voices the
 * cyclic-rotation and full permutation approaches produce identical results when
 * the pitch-class arrays are sorted ascending before comparison.  If the metric
 * is ever enhanced (e.g. octave weighting, voice crossing penalty) both files
 * must be updated in sync.
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

/** Generates all k-combinations of an array of indices. */
function combinations(indices: number[], k: number): number[][] {
  if (k < 0 || k > indices.length) return [];
  if (k === 0) return [[]];
  if (k === indices.length) return [indices.slice()];

  const result: number[][] = [];
  const build = (start: number, combo: number[]) => {
    if (combo.length === k) {
      result.push(combo.slice());
      return;
    }
    for (let i = start; i <= indices.length - (k - combo.length); i++) {
      combo.push(indices[i]);
      build(i + 1, combo);
      combo.pop();
    }
  };

  build(0, []);
  return result;
}

/** Options for flexible cross-size chord distance. */
export interface FlexibleOptions {
  /** Per-unmatched-voice complexity penalty. Must be finite and >= 0. */
  penalty?: number;
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

/**
 * Flexible voice assignment for chords of equal or unequal sizes.
 *
 * When chord sizes differ, the algorithm matches `min(|a|, |b|)` voices via
 * subset + permutation search and adds `penalty * | |a| - |b| |`.
 */
export function chordMatchingFlexible(
  a: number[],
  b: number[],
  options?: FlexibleOptions,
): {
  distance: number;
  mapping: { fromIdx: number; toIdx: number }[];
} {
  const penalty = options?.penalty ?? 2;
  if (!Number.isFinite(penalty) || penalty < 0) {
    throw new Error("penalty must be a finite number >= 0");
  }

  if (a.length === 0 && b.length === 0) {
    return { distance: 0, mapping: [] };
  }

  if (a.length === b.length) {
    return chordMatching(a, b);
  }

  const unmatched = Math.abs(a.length - b.length);

  if (a.length === 0 || b.length === 0) {
    return { distance: penalty * unmatched, mapping: [] };
  }

  let bestBaseDistance = Infinity;
  let bestMapping: { fromIdx: number; toIdx: number }[] = [];

  if (a.length < b.length) {
    const bIndices = b.map((_, i) => i);
    for (const subset of combinations(bIndices, a.length)) {
      for (const perm of permutations(subset)) {
        let dist = 0;
        for (let i = 0; i < a.length; i++) {
          dist += pitchClassDistance(a[i], b[perm[i]]);
        }
        if (dist < bestBaseDistance) {
          bestBaseDistance = dist;
          bestMapping = a.map((_, i) => ({ fromIdx: i, toIdx: perm[i] }));
        }
      }
    }
  } else {
    const aIndices = a.map((_, i) => i);
    for (const subset of combinations(aIndices, b.length)) {
      for (const perm of permutations(subset)) {
        let dist = 0;
        for (let i = 0; i < b.length; i++) {
          dist += pitchClassDistance(a[perm[i]], b[i]);
        }
        if (dist < bestBaseDistance) {
          bestBaseDistance = dist;
          bestMapping = b.map((_, i) => ({ fromIdx: perm[i], toIdx: i }));
        }
      }
    }
  }

  return {
    distance: bestBaseDistance + penalty * unmatched,
    mapping: bestMapping,
  };
}

/**
 * Flexible distance wrapper over {@link chordMatchingFlexible}.
 */
export function chordDistanceFlexible(
  a: number[],
  b: number[],
  options?: FlexibleOptions,
): number {
  return chordMatchingFlexible(a, b, options).distance;
}
