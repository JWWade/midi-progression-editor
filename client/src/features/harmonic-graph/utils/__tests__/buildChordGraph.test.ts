import { describe, it, expect } from "vitest";
import { buildChordGraph, containsTritoneMotion } from "../buildChordGraph";
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

// ---------------------------------------------------------------------------
// buildChordGraph — Phase 3: multi-size chord nodes
// ---------------------------------------------------------------------------

describe("buildChordGraph — multi-size (sizes: [3, 4])", () => {
  it("builds without errors for sizes [3, 4]", () => {
    expect(() => buildChordGraph({ sizes: [3, 4] })).not.toThrow();
  });

  it("returns exactly 19 triad nodes under T-equivalence (sizes: [3])", () => {
    const graph = buildChordGraph({ sizes: [3] });
    expect(graph.nodes).toHaveLength(19);
  });

  it("returns exactly 43 seventh-chord nodes under T-equivalence (sizes: [4])", () => {
    const graph = buildChordGraph({ sizes: [4] });
    expect(graph.nodes).toHaveLength(43);
  });

  it("returns 62 nodes (19 triads + 43 sevenths) for sizes [3, 4]", () => {
    const graph = buildChordGraph({ sizes: [3, 4] });
    expect(graph.nodes).toHaveLength(62);
  });

  it("all triad nodes have pcs of length 3 and all seventh nodes have pcs of length 4", () => {
    const graph = buildChordGraph({ sizes: [3, 4] });
    const triads = graph.nodes.filter((n) => n.pcs.length === 3);
    const sevenths = graph.nodes.filter((n) => n.pcs.length === 4);
    expect(triads).toHaveLength(19);
    expect(sevenths).toHaveLength(43);
  });

  it("cross-size edges are absent (chordDistance returns Infinity for different sizes)", () => {
    const graph = buildChordGraph({ sizes: [3, 4] });
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
    for (const edge of graph.edges) {
      const fromLen = nodeById.get(edge.from)!.pcs.length;
      const toLen = nodeById.get(edge.to)!.pcs.length;
      expect(fromLen).toBe(toLen);
    }
  });
});

// ---------------------------------------------------------------------------
// buildChordGraph — Phase 3: TI canonicalization
// ---------------------------------------------------------------------------

describe("buildChordGraph — TI canonicalization", () => {
  it("TI mode produces fewer or equal nodes than T mode for triads", () => {
    const tGraph = buildChordGraph({ sizes: [3], canonicalization: "T" });
    const tiGraph = buildChordGraph({ sizes: [3], canonicalization: "TI" });
    expect(tiGraph.nodes.length).toBeLessThan(tGraph.nodes.length);
  });

  it("returns exactly 12 nodes for triads under TI-equivalence", () => {
    const graph = buildChordGraph({ sizes: [3], canonicalization: "TI" });
    expect(graph.nodes).toHaveLength(12);
  });

  it("returns exactly 29 nodes for seventh chords under TI-equivalence", () => {
    const graph = buildChordGraph({ sizes: [4], canonicalization: "TI" });
    expect(graph.nodes).toHaveLength(29);
  });

  it("inversion pairs collapse under TI: [0,4,7] and [0,5,8] map to the same node", () => {
    // [0,4,7] is a major triad; [0,5,8] is its inversion (minor triad = I([0,4,7]))
    const tiId1 = canonicalizeChord([0, 4, 7], "TI").pcs.join(",");
    const tiId2 = canonicalizeChord([0, 5, 8], "TI").pcs.join(",");
    expect(tiId1).toBe(tiId2);

    const graph = buildChordGraph({ sizes: [3], canonicalization: "TI" });
    const nodeIds = graph.nodes.map((n) => n.id);
    // Both IDs resolve to the same canonical ID, so it appears only once
    const matches = nodeIds.filter((id) => id === tiId1);
    expect(matches).toHaveLength(1);
  });

  it("every node is idempotent under re-canonicalization with TI", () => {
    const graph = buildChordGraph({ sizes: [3], canonicalization: "TI" });
    for (const node of graph.nodes) {
      const recanon = canonicalizeChord(node.pcs, "TI");
      expect(recanon.pcs).toEqual(node.pcs);
    }
  });
});

// ---------------------------------------------------------------------------
// buildChordGraph — Phase 3: pluggable weight function
// ---------------------------------------------------------------------------

describe("buildChordGraph — custom weightFn", () => {
  it("custom weightFn changes edge weights compared to default chordDistance", () => {
    const defaultGraph = buildChordGraph({ sizes: [3] });
    // weightFn that doubles every cost
    const doubledGraph = buildChordGraph({
      sizes: [3],
      weightFn: (a, b) => chordDistance(a, b) * 2,
    });
    // Same number of edges (no maxWeight filter)
    expect(doubledGraph.edges).toHaveLength(defaultGraph.edges.length);
    // All doubled weights should be exactly 2× the default weights
    const defaultById = new Map(
      defaultGraph.edges.map((e) => [`${e.from}|${e.to}`, e.weight]),
    );
    for (const edge of doubledGraph.edges) {
      const key = `${edge.from}|${edge.to}`;
      const defaultWeight = defaultById.get(key)!;
      expect(edge.weight).toBeCloseTo(defaultWeight * 2);
    }
  });

  it("tritonePenalty weightFn increases weights for tritone-containing chord pairs", () => {
    const tritonePenalty = (a: number[], b: number[]) => {
      const base = chordDistance(a, b);
      return base === Infinity ? Infinity : base + (containsTritoneMotion(a, b) ? 2 : 0);
    };
    const defaultGraph = buildChordGraph({ sizes: [3] });
    const penaltyGraph = buildChordGraph({ sizes: [3], weightFn: tritonePenalty });
    // Same structure (no filtering)
    expect(penaltyGraph.nodes).toHaveLength(defaultGraph.nodes.length);
    expect(penaltyGraph.edges).toHaveLength(defaultGraph.edges.length);
    // At least one edge should have a higher weight in the penalty graph
    const penaltyById = new Map(
      penaltyGraph.edges.map((e) => [`${e.from}|${e.to}`, e.weight]),
    );
    const defaultById = new Map(
      defaultGraph.edges.map((e) => [`${e.from}|${e.to}`, e.weight]),
    );
    let atLeastOnePenalized = false;
    for (const [key, penaltyWeight] of penaltyById) {
      const defaultWeight = defaultById.get(key)!;
      if (penaltyWeight > defaultWeight) {
        atLeastOnePenalized = true;
        break;
      }
    }
    expect(atLeastOnePenalized).toBe(true);
  });

  it("custom weightFn with maxWeight can further restrict edges", () => {
    const uniformGraph = buildChordGraph({ sizes: [3], weightFn: () => 1 });
    // All edges have weight 1 so maxWeight=1 retains all, maxWeight=0 removes all
    const allEdges = buildChordGraph({
      sizes: [3],
      weightFn: () => 1,
      maxWeight: 1,
    });
    const noEdges = buildChordGraph({
      sizes: [3],
      weightFn: () => 1,
      maxWeight: 0,
    });
    expect(allEdges.edges).toHaveLength(uniformGraph.edges.length);
    expect(noEdges.edges).toHaveLength(0);
  });
});
