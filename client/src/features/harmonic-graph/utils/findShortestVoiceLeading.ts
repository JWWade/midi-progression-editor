/**
 * Shortest-path voice-leading on the harmonic chord graph.
 *
 * Implements Dijkstra's algorithm over the canonical chord graph produced by
 * `buildChordGraph`.  Edge weights are `weightFn` values (defaulting to
 * `chordDistance`), so the shortest path corresponds to the smoothest
 * voice-leading sequence between two chords.
 *
 * Usage:
 *   const result = findShortestVoiceLeading([0, 4, 7], [0, 3, 7]);
 *   // result.nodes  → [{ id: "0,4,7", pcs: [0,4,7] }, { id: "0,3,7", pcs: [0,3,7] }]
 *   // result.totalDistance → 1
 */

import {
  canonicalizeChord,
  chordMatching,
} from "@/features/voice-leading";
import type { CanonicalizationMode } from "@/features/voice-leading";
import type { ChordGraph, ChordNode, PathResult, WeightFn } from "../types";
import type { BuildChordGraphOptions } from "./buildChordGraph";
import { buildChordGraph } from "./buildChordGraph";

// Default graph for the most common runtime path (triads, T mode, full edges).
const DEFAULT_CHORD_GRAPH = buildChordGraph();

/** Returns the shared default graph instance used by shortest-path calls. */
export function getDefaultChordGraph(): ChordGraph {
  return DEFAULT_CHORD_GRAPH;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Options accepted by {@link findShortestVoiceLeading} as its fourth argument.
 */
export interface FindShortestVoiceLeadingOptions {
  /**
   * Symmetry group used to canonicalize `startPCS` and `endPCS` before node
   * lookup.  Must match the mode used to build the graph.
   * @default "T"
   */
  canonicalization?: CanonicalizationMode;
  /**
   * Custom edge-weight function passed to `buildChordGraph` when no pre-built
   * graph is provided.  Ignored when `graph` is supplied.
   * @default chordDistance
   */
  weightFn?: WeightFn;
  /**
   * Optional graph construction settings used only when `graph` is omitted.
   * Allows auto-build of mixed-size or TI graphs without prebuilding them.
   */
  graphOptions?: Pick<
    BuildChordGraphOptions,
    "sizes" | "canonicalization" | "maxWeight"
  >;
}

// ---------------------------------------------------------------------------
// findShortestVoiceLeading
// ---------------------------------------------------------------------------

/**
 * Computes the shortest voice-leading path between two chords on the
 * canonical chord graph using Dijkstra's algorithm.
 *
 * Both input chords are canonicalised before the search, so enharmonically
 * or transpositionally equivalent inputs (e.g. `[0,4,7]` and `[2,6,9]`)
 * resolve to the same node and return a zero-distance single-node result.
 *
 * @param startPCS  - Pitch classes of the starting chord (any integers; normalised internally).
 * @param endPCS    - Pitch classes of the ending chord.
 * @param graph     - Optional pre-built {@link ChordGraph}.  When omitted a
 *                    full (complete) graph is built via `buildChordGraph`.
 * @param maxWeightOrOptions - Either a legacy `maxWeight` number (upper bound
 *                    on edge weight, passed to `buildChordGraph` when `graph`
 *                    is not provided) **or** a {@link FindShortestVoiceLeadingOptions}
 *                    object.  Pruning edges may disconnect the graph and cause
 *                    the function to return `null` even for reachable chord pairs.
 * @returns A {@link PathResult} describing the optimal path, or `null` when:
 *   - either chord is not present in the graph, or
 *   - no path connects the two nodes (disconnected graph due to `maxWeight`).
 * @throws {Error} When `startPCS` or `endPCS` is empty (propagated from
 *   `canonicalizeChord`).
 */
export function findShortestVoiceLeading(
  startPCS: number[],
  endPCS: number[],
  graph?: ChordGraph,
  maxWeightOrOptions?: number | FindShortestVoiceLeadingOptions,
): PathResult | null {
  // Normalise the overloaded fourth argument.
  const opts: FindShortestVoiceLeadingOptions =
    typeof maxWeightOrOptions === "number"
      ? {}
      : (maxWeightOrOptions ?? {});
  const legacyMaxWeight =
    typeof maxWeightOrOptions === "number" ? maxWeightOrOptions : undefined;

  const canonicalization =
    opts.canonicalization ?? opts.graphOptions?.canonicalization ?? "T";
  const { weightFn, graphOptions } = opts;
  const usesDefaultConfig =
    legacyMaxWeight === undefined &&
    weightFn === undefined &&
    graphOptions === undefined;

  // Canonicalise inputs to stable node IDs using the requested mode.
  const startId = canonicalizeChord(startPCS, canonicalization).pcs.join(",");
  const endId = canonicalizeChord(endPCS, canonicalization).pcs.join(",");

  // Use the provided graph or build a fresh one.
  const chordGraph =
    graph ??
    (usesDefaultConfig
      ? DEFAULT_CHORD_GRAPH
      : buildChordGraph({
          ...graphOptions,
          canonicalization: graphOptions?.canonicalization ?? canonicalization,
          maxWeight: legacyMaxWeight ?? graphOptions?.maxWeight,
          weightFn,
        }));

  // Index nodes for O(1) lookup.
  const nodeById = new Map<string, ChordNode>();
  for (const node of chordGraph.nodes) {
    nodeById.set(node.id, node);
  }

  // Both chords must be present in the graph.
  if (!nodeById.has(startId) || !nodeById.has(endId)) {
    return null;
  }

  // Trivial case: same canonical node.
  if (startId === endId) {
    return { nodes: [nodeById.get(startId)!], totalDistance: 0 };
  }

  // Build a bidirectional adjacency list from the (undirected) edge set.
  const adj = new Map<string, { to: string; weight: number }[]>();
  for (const node of chordGraph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of chordGraph.edges) {
    adj.get(edge.from)!.push({ to: edge.to, weight: edge.weight });
    adj.get(edge.to)!.push({ to: edge.from, weight: edge.weight });
  }

  // ---------------------------------------------------------------------------
  // Dijkstra's algorithm (O(n²) — adequate for small chord graphs).
  // ---------------------------------------------------------------------------
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();

  for (const node of chordGraph.nodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }
  dist.set(startId, 0);

  const unvisited = new Set<string>(chordGraph.nodes.map((n) => n.id));

  while (unvisited.size > 0) {
    // Extract the unvisited node with the smallest tentative distance.
    let u: string | null = null;
    let uDist = Infinity;
    for (const id of unvisited) {
      const d = dist.get(id)!;
      if (d < uDist) {
        uDist = d;
        u = id;
      }
    }

    // All remaining nodes are unreachable.
    if (u === null || uDist === Infinity) break;

    // Early exit once we've settled the destination.
    if (u === endId) break;

    unvisited.delete(u);

    for (const { to, weight } of adj.get(u)!) {
      if (!unvisited.has(to)) continue;
      const alt = uDist + weight;
      if (alt < dist.get(to)!) {
        dist.set(to, alt);
        prev.set(to, u);
      }
    }
  }

  // No path was found (disconnected graph).
  const totalDistance = dist.get(endId)!;
  if (totalDistance === Infinity) {
    return null;
  }

  // Reconstruct the ordered node sequence by back-tracking through `prev`.
  const path: ChordNode[] = [];
  let current: string | null = endId;
  while (current !== null) {
    path.unshift(nodeById.get(current)!);
    current = prev.get(current) ?? null;
  }

  // Compute per-step voice-leading assignments.
  const mappings: { fromIdx: number; toIdx: number }[][] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const { mapping } = chordMatching(path[i].pcs, path[i + 1].pcs);
    mappings.push(mapping);
  }

  return { nodes: path, totalDistance, mappings };
}
