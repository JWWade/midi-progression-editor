/**
 * Graph invariant tests for buildChordGraph.
 *
 * Verifies:
 *   - Node count: |V| = 19 (T-canonical triad classes)
 *   - Edge count: |E| = 171 (19 × 18 / 2, complete graph)
 *   - Weight correctness: edge.weight === chordDistance(u.pcs, v.pcs)
 *   - Node uniqueness: IDs are unique and match pcs.join(",")
 */

import { describe, it, expect } from "vitest";
import { buildChordGraph } from "../buildChordGraph";
import { chordDistance } from "@/features/voice-leading";

// ---------------------------------------------------------------------------
// Node invariants
// ---------------------------------------------------------------------------

describe("buildChordGraph — node invariants", () => {
  it("produces exactly 19 canonical triad nodes under T-equivalence", () => {
    const graph = buildChordGraph();
    expect(graph.nodes).toHaveLength(19);
  });

  it("all node IDs are unique", () => {
    const graph = buildChordGraph();
    const ids = graph.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each node ID matches pcs.join(',')", () => {
    const graph = buildChordGraph();
    for (const node of graph.nodes) {
      expect(node.id).toBe(node.pcs.join(","));
    }
  });

  it("all node pcs values are in [0, 11]", () => {
    const graph = buildChordGraph();
    for (const node of graph.nodes) {
      for (const pc of node.pcs) {
        expect(pc).toBeGreaterThanOrEqual(0);
        expect(pc).toBeLessThanOrEqual(11);
      }
    }
  });

  it("all node pcs are sorted strictly ascending (no duplicates)", () => {
    const graph = buildChordGraph();
    for (const node of graph.nodes) {
      for (let i = 1; i < node.pcs.length; i++) {
        expect(node.pcs[i]).toBeGreaterThan(node.pcs[i - 1]);
      }
    }
  });

  it("every node has exactly 3 pitch classes (triads)", () => {
    const graph = buildChordGraph();
    for (const node of graph.nodes) {
      expect(node.pcs).toHaveLength(3);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge invariants
// ---------------------------------------------------------------------------

describe("buildChordGraph — edge invariants", () => {
  it("produces exactly 171 edges for the complete graph (19×18/2)", () => {
    const graph = buildChordGraph();
    expect(graph.edges).toHaveLength(171);
  });

  it("every edge weight equals chordDistance(u.pcs, v.pcs)", () => {
    const graph = buildChordGraph();
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
    for (const edge of graph.edges) {
      const u = nodeById.get(edge.from)!;
      const v = nodeById.get(edge.to)!;
      expect(u).toBeDefined();
      expect(v).toBeDefined();
      const expected = chordDistance(u.pcs, v.pcs);
      expect(edge.weight).toBe(expected);
    }
  });

  it("no self-loops exist (from !== to)", () => {
    const graph = buildChordGraph();
    for (const edge of graph.edges) {
      expect(edge.from).not.toBe(edge.to);
    }
  });

  it("every edge endpoint refers to a valid node ID", () => {
    const graph = buildChordGraph();
    const ids = new Set(graph.nodes.map((n) => n.id));
    for (const edge of graph.edges) {
      expect(ids.has(edge.from)).toBe(true);
      expect(ids.has(edge.to)).toBe(true);
    }
  });

  it("no duplicate edges (each unordered pair appears at most once)", () => {
    const graph = buildChordGraph();
    const seen = new Set<string>();
    for (const edge of graph.edges) {
      const key = [edge.from, edge.to].sort().join("||");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("all edge weights are finite and non-negative", () => {
    const graph = buildChordGraph();
    for (const edge of graph.edges) {
      expect(isFinite(edge.weight)).toBe(true);
      expect(edge.weight).toBeGreaterThanOrEqual(0);
    }
  });
});
