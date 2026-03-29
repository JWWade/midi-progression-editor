/**
 * Shortest-path voice-leading on the harmonic chord graph.
 *
 * Implements Dijkstra's algorithm over the T-canonical chord graph produced by
 * `buildChordGraph`.  Edge weights are `chordDistance` values, so the shortest
 * path corresponds to the smoothest voice-leading sequence between two chords.
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
import type { ChordGraph, ChordNode, PathResult } from "../types";
import { buildChordGraph } from "./buildChordGraph";

/**
 * Computes the shortest voice-leading path between two chords on the
 * T-canonical chord graph using Dijkstra's algorithm.
 *
 * Both input chords are canonicalised before the search, so enharmonically
 * or transpositionally equivalent inputs (e.g. `[0,4,7]` and `[2,6,9]`)
 * resolve to the same node and return a zero-distance single-node result.
 *
 * @param startPCS  - Pitch classes of the starting chord (any integers; normalised internally).
 * @param endPCS    - Pitch classes of the ending chord.
 * @param graph     - Optional pre-built {@link ChordGraph}.  When omitted a
 *                    full (complete) graph is built via `buildChordGraph`.
 * @param maxWeight - Upper bound on edge weight used **only** when `graph` is
 *                    not provided (passed to `buildChordGraph`).  Pruning edges
 *                    may disconnect the graph and cause the function to return
 *                    `null` even for reachable chord pairs.
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
  maxWeight?: number,
): PathResult | null {
  // Canonicalise inputs to stable node IDs.
  const startId = canonicalizeChord(startPCS, "T").pcs.join(",");
  const endId = canonicalizeChord(endPCS, "T").pcs.join(",");

  // Use the provided graph or build a fresh one.
  const chordGraph = graph ?? buildChordGraph(maxWeight);

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
  // Dijkstra's algorithm (O(n²) — adequate for the ~19-node triad graph).
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
