/**
 * Chord Graph Builder — metric graph over canonical chord representatives.
 *
 * G = (V, E, w) where:
 *   V = set of canonical chord nodes (transposition-invariant representatives,
 *       optionally also inversion-invariant under "TI" mode)
 *   E = edges between chord pairs whose voice-leading cost ≤ maxWeight
 *   w = weightFn (defaults to chordDistance)
 *
 * Phase 3 scope: configurable chord sizes (triads and/or seventh chords),
 * configurable canonicalization ("T" or "TI"), and pluggable edge weight function.
 */

import {
  canonicalizeChord,
  chordDistance,
  pitchClassDistance,
} from "@/features/voice-leading";
import type { CanonicalizationMode } from "@/features/voice-leading";
import type { ChordGraph, ChordEdge, ChordNode, WeightFn } from "../types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Options for {@link buildChordGraph}.
 */
export interface BuildChordGraphOptions {
  /**
   * Chord sizes (number of notes) to include as graph nodes.
   * Each size `k` generates C(12, k) candidate pitch-class sets.
   * @default [3]
   */
  sizes?: number[];
  /**
   * Symmetry group used for canonicalization.
   * - `"T"`  — transposition equivalence only (cyclic group, order 12).
   * - `"TI"` — transposition + inversion (dihedral group, order 24).
   * @default "T"
   */
  canonicalization?: CanonicalizationMode;
  /**
   * Maximum voice-leading cost for an edge to be included.
   * Pass a positive number (e.g. `4`) to retain only "nearby" connections.
   * @default Infinity
   */
  maxWeight?: number;
  /**
   * Custom edge-weight function.  Receives two canonical pitch-class arrays and
   * returns their voice-leading cost.  Must return `Infinity` for incompatible
   * inputs (e.g. different sizes).
   * @default chordDistance
   */
  weightFn?: WeightFn;
}

// ---------------------------------------------------------------------------
// generateChords
// ---------------------------------------------------------------------------

/**
 * Generates all pitch-class sets (sorted ascending) of the requested sizes
 * from the 12 chromatic pitch classes.
 *
 * For size `k` the function produces C(12, k) combinations.
 * Examples:
 *   - k=3 → 220 triads
 *   - k=4 → 495 seventh-chord candidates
 *
 * @param options.sizes - Array of chord sizes to generate.
 * @returns Sorted pitch-class arrays, one per combination.
 */
export function generateChords(options: { sizes: number[] }): number[][] {
  const result: number[][] = [];

  for (const size of options.sizes) {
    const generate = (start: number, combo: number[]) => {
      if (combo.length === size) {
        result.push(combo.slice());
        return;
      }
      for (let i = start; i < 12; i++) {
        combo.push(i);
        generate(i + 1, combo);
        combo.pop();
      }
    };
    generate(0, []);
  }

  return result;
}

// ---------------------------------------------------------------------------
// containsTritoneMotion
// ---------------------------------------------------------------------------

/**
 * Returns `true` when any note in `a` lies a tritone (6 semitones) away from
 * any note in `b`.
 *
 * Used as a building block for custom {@link WeightFn} implementations that
 * apply a penalty for tritone motion, e.g.:
 *
 * ```ts
 * const tritonePenalty: WeightFn = (a, b) => {
 *   const base = chordDistance(a, b);
 *   const penalty = containsTritoneMotion(a, b) ? 2 : 0;
 *   return base + penalty;
 * };
 * ```
 *
 * @param a - Pitch classes of the first chord (0–11).
 * @param b - Pitch classes of the second chord (0–11).
 */
export function containsTritoneMotion(a: number[], b: number[]): boolean {
  for (const pa of a) {
    for (const pb of b) {
      if (pitchClassDistance(pa, pb) === 6) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// buildChordGraph
// ---------------------------------------------------------------------------

/**
 * Constructs a weighted, undirected metric graph over canonical chord representatives.
 *
 * **Algorithm (brute-force)**
 * 1. Generate all C(12, k) pitch-class sets for each requested size `k`.
 * 2. Canonicalise each set under the chosen symmetry group and deduplicate,
 *    yielding one node per equivalence class.
 * 3. For every ordered pair (i < j) of nodes compute `weightFn` and emit an
 *    edge when the weight satisfies `weight ≤ maxWeight`.
 *
 * **Backward compatibility**
 * The function also accepts a plain `number` as its first argument, which is
 * treated as `maxWeight` with all other options left at their defaults.  This
 * preserves the existing `buildChordGraph(maxWeight?)` call signature.
 *
 * @param maxWeightOrOptions - Either a `maxWeight` number (legacy) or a
 *   {@link BuildChordGraphOptions} object.
 * @returns A {@link ChordGraph} with deduplicated nodes and weighted edges.
 */
export function buildChordGraph(
  maxWeightOrOptions?: number | BuildChordGraphOptions,
): ChordGraph {
  // Normalise the overloaded first argument.
  const opts: BuildChordGraphOptions =
    typeof maxWeightOrOptions === "number"
      ? { maxWeight: maxWeightOrOptions }
      : (maxWeightOrOptions ?? {});

  const {
    sizes = [3],
    canonicalization = "T",
    maxWeight = Infinity,
    weightFn = chordDistance,
  } = opts;

  // -------------------------------------------------------------------------
  // Step 1 — Generate candidate chords and deduplicate under the chosen group.
  // -------------------------------------------------------------------------
  const allChords = generateChords({ sizes });

  const seen = new Map<string, ChordNode>();
  for (const chord of allChords) {
    const canonical = canonicalizeChord(chord, canonicalization);
    const id = canonical.pcs.join(",");
    if (!seen.has(id)) {
      seen.set(id, { id, pcs: canonical.pcs });
    }
  }
  const nodes = Array.from(seen.values());

  // -------------------------------------------------------------------------
  // Step 2 — Build edges.
  // -------------------------------------------------------------------------
  const edges: ChordEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const weight = weightFn(nodes[i].pcs, nodes[j].pcs);
      if (isFinite(weight) && weight <= maxWeight) {
        edges.push({ from: nodes[i].id, to: nodes[j].id, weight });
      }
    }
  }

  return { nodes, edges };
}
