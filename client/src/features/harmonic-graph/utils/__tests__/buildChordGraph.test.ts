import { describe, it, expect } from "vitest";
import { buildChordGraph } from "../buildChordGraph";
import { canonicalizeChord, chordDistance } from "@/features/voice-leading";

// ---------------------------------------------------------------------------
// buildChordGraph — structural properties
// ---------------------------------------------------------------------------

describe("buildChordGraph — structural properties", () => {
  it("returns a non-empty nodes array", () => {
    const graph = buildChordGraph();
    expect(graph.nodes.length).toBeGreaterThan(0);
  });

  it("returns exactly 19 canonical triad classes under transposition", () => {
    // Burnside's lemma: (220 + 4 + 4) / 12 = 19 T-orbit classes for 3-note
    // subsets of Z_12 (only T_4 and T_8 fix non-trivial sets — the 4 augmented triads).
    const graph = buildChordGraph();
    expect(graph.nodes).toHaveLength(19);
  });

  it("every node id matches its pcs joined by commas", () => {
    const graph = buildChordGraph();
    for (const node of graph.nodes) {
      expect(node.id).toBe(node.pcs.join(","));
    }
  });

  it("all node ids are unique", () => {
    const graph = buildChordGraph();
    const ids = graph.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every node pcs is sorted ascending", () => {
    const graph = buildChordGraph();
    for (const node of graph.nodes) {
      for (let i = 1; i < node.pcs.length; i++) {
        expect(node.pcs[i]).toBeGreaterThan(node.pcs[i - 1]);
      }
    }
  });

  it("every node pcs has exactly 3 elements (triads only)", () => {
    const graph = buildChordGraph();
    for (const node of graph.nodes) {
      expect(node.pcs).toHaveLength(3);
    }
  });

  it("all pcs values are in [0, 11]", () => {
    const graph = buildChordGraph();
    for (const node of graph.nodes) {
      for (const pc of node.pcs) {
        expect(pc).toBeGreaterThanOrEqual(0);
        expect(pc).toBeLessThanOrEqual(11);
      }
    }
  });

  it("returns a non-empty edges array in the default (complete) graph", () => {
    const graph = buildChordGraph();
    expect(graph.edges.length).toBeGreaterThan(0);
  });

  it("edge count equals n*(n-1)/2 for the complete graph (all pairs)", () => {
    const graph = buildChordGraph();
    const n = graph.nodes.length;
    expect(graph.edges).toHaveLength((n * (n - 1)) / 2);
  });
});

// ---------------------------------------------------------------------------
// buildChordGraph — edge properties
// ---------------------------------------------------------------------------

describe("buildChordGraph — edge properties", () => {
  it("every edge references valid node ids", () => {
    const graph = buildChordGraph();
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    for (const edge of graph.edges) {
      expect(nodeIds.has(edge.from)).toBe(true);
      expect(nodeIds.has(edge.to)).toBe(true);
    }
  });

  it("no self-loops (from !== to)", () => {
    const graph = buildChordGraph();
    for (const edge of graph.edges) {
      expect(edge.from).not.toBe(edge.to);
    }
  });

  it("all edge weights are positive integers", () => {
    const graph = buildChordGraph();
    for (const edge of graph.edges) {
      expect(edge.weight).toBeGreaterThan(0);
      expect(Number.isInteger(edge.weight)).toBe(true);
    }
  });

  it("edge weights match chordDistance between the referenced nodes", () => {
    const graph = buildChordGraph();
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
    for (const edge of graph.edges) {
      const a = nodeById.get(edge.from)!;
      const b = nodeById.get(edge.to)!;
      expect(edge.weight).toBe(chordDistance(a.pcs, b.pcs));
    }
  });

  it("no duplicate edges (each unordered pair appears at most once)", () => {
    const graph = buildChordGraph();
    const seen = new Set<string>();
    for (const edge of graph.edges) {
      // Normalise direction so {from,to} and {to,from} share the same key
      const key = [edge.from, edge.to].sort().join("|");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

// ---------------------------------------------------------------------------
// buildChordGraph — maxWeight filtering
// ---------------------------------------------------------------------------

describe("buildChordGraph — maxWeight filtering", () => {
  it("passing maxWeight=0 yields no edges", () => {
    // Distinct canonical chords always have distance > 0
    const graph = buildChordGraph(0);
    expect(graph.edges).toHaveLength(0);
  });

  it("a tighter maxWeight produces fewer or equal edges than a looser one", () => {
    const loose = buildChordGraph(4);
    const tight = buildChordGraph(2);
    expect(tight.edges.length).toBeLessThanOrEqual(loose.edges.length);
  });

  it("all retained edges satisfy weight ≤ maxWeight", () => {
    const maxWeight = 3;
    const graph = buildChordGraph(maxWeight);
    for (const edge of graph.edges) {
      expect(edge.weight).toBeLessThanOrEqual(maxWeight);
    }
  });

  it("nodes are unaffected by maxWeight (always 19 canonical triads)", () => {
    expect(buildChordGraph(0).nodes).toHaveLength(19);
    expect(buildChordGraph(1).nodes).toHaveLength(19);
    expect(buildChordGraph(4).nodes).toHaveLength(19);
  });
});

// ---------------------------------------------------------------------------
// buildChordGraph — canonicalization
// ---------------------------------------------------------------------------

describe("buildChordGraph — canonicalization", () => {
  it("each node is already in canonical form (idempotent)", () => {
    const graph = buildChordGraph();
    for (const node of graph.nodes) {
      const recanon = canonicalizeChord(node.pcs, "T");
      expect(recanon.pcs).toEqual(node.pcs);
    }
  });

  it("transpositions of the same triad map to the same node", () => {
    // C major [0,4,7], D major [2,6,9], E major [4,8,11] all share one node
    const graph = buildChordGraph();
    const canonCMaj = canonicalizeChord([0, 4, 7], "T").pcs.join(",");
    const canonDMaj = canonicalizeChord([2, 6, 9], "T").pcs.join(",");
    const canonEMaj = canonicalizeChord([4, 8, 11], "T").pcs.join(",");
    expect(canonCMaj).toBe(canonDMaj);
    expect(canonDMaj).toBe(canonEMaj);
    // That single canonical key appears exactly once in the graph
    const matching = graph.nodes.filter((n) => n.id === canonCMaj);
    expect(matching).toHaveLength(1);
  });
});
