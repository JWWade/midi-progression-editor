/**
 * Chord Graph Builder — metric graph over canonical triad representatives.
 *
 * G = (V, E, w) where:
 *   V = set of canonical triads (transposition-invariant representatives)
 *   E = edges between chord pairs whose voice-leading cost ≤ maxWeight
 *   w = chordDistance (minimum total pitch-class displacement)
 *
 * Phase 1 scope: triads only, canonicalization mode "T" (transposition-invariant).
 */

import {
  canonicalizeChord,
  chordDistance,
} from "@/features/voice-leading";
import type { ChordGraph, ChordEdge, ChordNode } from "../types";

/**
 * Generates all 220 three-note subsets of the 12 chromatic pitch classes.
 *
 * Each chord is represented as a sorted triple [a, b, c] with a < b < c,
 * giving C(12, 3) = 220 candidate triads.
 */
function generateTriads(): number[][] {
  const chords: number[][] = [];

  for (let a = 0; a < 12; a++) {
    for (let b = a + 1; b < 12; b++) {
      for (let c = b + 1; c < 12; c++) {
        chords.push([a, b, c]);
      }
    }
  }

  return chords;
}

/**
 * Canonicalises and deduplicates all 220 triads under transposition.
 *
 * Each triad is mapped to its lex-min transposition-invariant representative
 * via `canonicalizeChord(..., "T")`.  Duplicate representatives (triads in
 * the same T-orbit) are collapsed into a single node.
 *
 * @returns Unique canonical {@link ChordNode} objects, one per T-equivalence class.
 */
function buildNodes(): ChordNode[] {
  const seen = new Map<string, ChordNode>();

  for (const triad of generateTriads()) {
    const canonical = canonicalizeChord(triad, "T");
    const id = canonical.pcs.join(",");
    if (!seen.has(id)) {
      seen.set(id, { id, pcs: canonical.pcs });
    }
  }

  return Array.from(seen.values());
}

/**
 * Constructs a weighted, undirected metric graph over canonical triad representatives.
 *
 * **Algorithm (Phase 1 — brute-force)**
 * 1. Generate all 220 triads from the 12 chromatic pitch classes.
 * 2. Canonicalise each via `canonicalizeChord(..., "T")` and deduplicate,
 *    yielding one node per T-equivalence class.
 * 3. For every ordered pair (i < j) of nodes compute `chordDistance` and
 *    emit an edge when the weight satisfies `weight ≤ maxWeight`.
 *
 * @param maxWeight - Maximum voice-leading cost for an edge to be included.
 *   Defaults to `Infinity` (complete graph — all chord pairs connected).
 *   Pass a positive number (e.g. `4`) to retain only "nearby" connections.
 * @returns A {@link ChordGraph} with deduplicated nodes and weighted edges.
 */
export function buildChordGraph(maxWeight: number = Infinity): ChordGraph {
  const nodes = buildNodes();
  const edges: ChordEdge[] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const weight = chordDistance(nodes[i].pcs, nodes[j].pcs);
      if (weight <= maxWeight) {
        edges.push({ from: nodes[i].id, to: nodes[j].id, weight });
      }
    }
  }

  return { nodes, edges };
}
