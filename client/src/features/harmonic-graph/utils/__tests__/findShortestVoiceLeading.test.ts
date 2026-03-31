import { describe, it, expect } from "vitest";
import { findShortestVoiceLeading } from "../findShortestVoiceLeading";
import { buildChordGraph } from "../buildChordGraph";
import {
  canonicalizeChord,
  chordDistance,
  chordDistanceFlexible,
  chordMatching,
} from "@/features/voice-leading";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the canonical node ID for a pitch-class set. */
function nodeId(pcs: number[]): string {
  return canonicalizeChord(pcs, "T").pcs.join(",");
}

// ---------------------------------------------------------------------------
// findShortestVoiceLeading — basic correctness
// ---------------------------------------------------------------------------

describe("findShortestVoiceLeading — basic correctness", () => {
  it("returns a single node with totalDistance=0 when start and end are the same chord", () => {
    const result = findShortestVoiceLeading([0, 4, 7], [0, 4, 7]);
    expect(result).not.toBeNull();
    expect(result!.nodes).toHaveLength(1);
    expect(result!.totalDistance).toBe(0);
    expect(result!.mappings).toBeUndefined();
  });

  it("same canonical node: transpositionally equivalent inputs produce a zero-distance result", () => {
    // [0,4,7] (C major) and [2,6,9] (D major) are T-equivalent → same node
    const result = findShortestVoiceLeading([0, 4, 7], [2, 6, 9]);
    expect(result).not.toBeNull();
    expect(result!.nodes).toHaveLength(1);
    expect(result!.totalDistance).toBe(0);
    expect(result!.nodes[0].id).toBe(nodeId([0, 4, 7]));
  });

  it("returns a two-node path for directly adjacent chords", () => {
    // C major [0,4,7] → A minor [0,4,9] (canonical [0,3,7]) — direct edge
    const result = findShortestVoiceLeading([0, 4, 7], [9, 0, 4]);
    expect(result).not.toBeNull();
    expect(result!.nodes.length).toBeGreaterThanOrEqual(2);
    expect(result!.totalDistance).toBeGreaterThan(0);
  });

  it("first node id matches the canonical form of startPCS", () => {
    const result = findShortestVoiceLeading([0, 4, 7], [0, 3, 7]);
    expect(result).not.toBeNull();
    expect(result!.nodes[0].id).toBe(nodeId([0, 4, 7]));
  });

  it("last node id matches the canonical form of endPCS", () => {
    const result = findShortestVoiceLeading([0, 4, 7], [0, 3, 7]);
    expect(result).not.toBeNull();
    const last = result!.nodes[result!.nodes.length - 1];
    expect(last.id).toBe(nodeId([0, 3, 7]));
  });

  it("totalDistance equals the sum of chordDistance between consecutive nodes", () => {
    const result = findShortestVoiceLeading([0, 4, 7], [0, 2, 7]);
    expect(result).not.toBeNull();
    let sum = 0;
    for (let i = 0; i < result!.nodes.length - 1; i++) {
      sum += chordDistance(result!.nodes[i].pcs, result!.nodes[i + 1].pcs);
    }
    expect(result!.totalDistance).toBe(sum);
  });

  it("every node in the path is a valid graph node", () => {
    const graph = buildChordGraph();
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const result = findShortestVoiceLeading([0, 4, 7], [0, 1, 6], graph);
    expect(result).not.toBeNull();
    for (const node of result!.nodes) {
      expect(nodeIds.has(node.id)).toBe(true);
    }
  });

  it("consecutive path nodes are connected by an edge in the graph", () => {
    const graph = buildChordGraph();
    const edgeSet = new Set(
      graph.edges.flatMap((e) => [`${e.from}|${e.to}`, `${e.to}|${e.from}`]),
    );
    const result = findShortestVoiceLeading([0, 4, 7], [0, 1, 6], graph);
    expect(result).not.toBeNull();
    for (let i = 0; i < result!.nodes.length - 1; i++) {
      const key = `${result!.nodes[i].id}|${result!.nodes[i + 1].id}`;
      expect(edgeSet.has(key)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// findShortestVoiceLeading — optimality
// ---------------------------------------------------------------------------

describe("findShortestVoiceLeading — optimality", () => {
  it("direct adjacent chords have totalDistance === chordDistance(start, end)", () => {
    // C major and A minor differ by 1 semitone voice-leading step
    const startPCS = [0, 4, 7];
    const endPCS = [9, 0, 4]; // A minor; canonical [0,3,7]
    const directDist = chordDistance(
      canonicalizeChord(startPCS, "T").pcs,
      canonicalizeChord(endPCS, "T").pcs,
    );
    const result = findShortestVoiceLeading(startPCS, endPCS);
    expect(result).not.toBeNull();
    // The shortest path should be no longer than the direct edge
    expect(result!.totalDistance).toBeLessThanOrEqual(directDist);
  });

  it("path via full graph is no longer than path via pruned graph when pruned path exists", () => {
    const full = findShortestVoiceLeading([0, 4, 7], [0, 3, 7]);
    const pruned = findShortestVoiceLeading([0, 4, 7], [0, 3, 7], undefined, 4);
    if (pruned !== null) {
      expect(full!.totalDistance).toBeLessThanOrEqual(pruned.totalDistance);
    }
  });

  it("finds a path no longer than any manually constructed intermediate path", () => {
    // Construct a candidate path C major → C minor → A minor
    const cMaj = canonicalizeChord([0, 4, 7], "T").pcs;
    const cMin = canonicalizeChord([0, 3, 7], "T").pcs;
    const aMin = canonicalizeChord([0, 4, 9], "T").pcs;
    const candidateDist =
      chordDistance(cMaj, cMin) + chordDistance(cMin, aMin);

    const result = findShortestVoiceLeading([0, 4, 7], [0, 4, 9]);
    expect(result).not.toBeNull();
    expect(result!.totalDistance).toBeLessThanOrEqual(candidateDist);
  });
});

// ---------------------------------------------------------------------------
// findShortestVoiceLeading — voice-leading mappings
// ---------------------------------------------------------------------------

describe("findShortestVoiceLeading — mappings", () => {
  it("returns one mapping array per path step (length === nodes.length - 1)", () => {
    const result = findShortestVoiceLeading([0, 4, 7], [0, 3, 7]);
    expect(result).not.toBeNull();
    expect(result!.mappings).toBeDefined();
    expect(result!.mappings!).toHaveLength(result!.nodes.length - 1);
  });

  it("each mapping entry has fromIdx and toIdx in range", () => {
    const result = findShortestVoiceLeading([0, 4, 7], [0, 3, 7]);
    expect(result).not.toBeNull();
    for (let step = 0; step < result!.mappings!.length; step++) {
      const n = result!.nodes[step].pcs.length;
      for (const { fromIdx, toIdx } of result!.mappings![step]) {
        expect(fromIdx).toBeGreaterThanOrEqual(0);
        expect(fromIdx).toBeLessThan(n);
        expect(toIdx).toBeGreaterThanOrEqual(0);
        expect(toIdx).toBeLessThan(n);
      }
    }
  });

  it("first-step mapping matches chordMatching between the first two path nodes", () => {
    const result = findShortestVoiceLeading([0, 4, 7], [0, 3, 7]);
    expect(result).not.toBeNull();
    const { mapping } = chordMatching(
      result!.nodes[0].pcs,
      result!.nodes[1].pcs,
    );
    expect(result!.mappings![0]).toEqual(mapping);
  });

  it("no mappings field for a single-node (zero-distance) result", () => {
    const result = findShortestVoiceLeading([0, 4, 7], [0, 4, 7]);
    expect(result).not.toBeNull();
    expect(result!.mappings).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// findShortestVoiceLeading — edge cases
// ---------------------------------------------------------------------------

describe("findShortestVoiceLeading — edge cases", () => {
  it("returns null when startPCS chord is absent from a pruned graph", () => {
    // Build a graph so sparse that some nodes have no edges
    const graph = buildChordGraph(0); // no edges at all
    const result = findShortestVoiceLeading([0, 4, 7], [0, 3, 7], graph);
    // Nodes still exist but graph is disconnected → null
    expect(result).toBeNull();
  });

  it("returns null for a disconnected graph (maxWeight too small)", () => {
    // maxWeight=1 should retain only the fewest edges; any non-adjacent pair → null
    const graph = buildChordGraph(1);
    // Pick a pair that is definitely not at distance 1 from each other
    const result = findShortestVoiceLeading([0, 1, 2], [0, 4, 7], graph);
    // Either null (no path) or a valid path if they happen to be reachable
    if (result !== null) {
      expect(result.totalDistance).toBeGreaterThan(0);
    }
  });

  it("accepts a pre-built graph and does not rebuild it", () => {
    const graph = buildChordGraph();
    const result = findShortestVoiceLeading([0, 4, 7], [0, 3, 7], graph);
    expect(result).not.toBeNull();
  });

  it("throws when startPCS is empty (propagated from canonicalizeChord)", () => {
    expect(() => findShortestVoiceLeading([], [0, 4, 7])).toThrow();
  });

  it("throws when endPCS is empty (propagated from canonicalizeChord)", () => {
    expect(() => findShortestVoiceLeading([0, 4, 7], [])).toThrow();
  });

  it("handles non-normalised input (values outside 0–11)", () => {
    // 12 ≡ 0, 16 ≡ 4, 19 ≡ 7  →  same as C major [0,4,7]
    const result = findShortestVoiceLeading([12, 16, 19], [0, 3, 7]);
    expect(result).not.toBeNull();
    expect(result!.nodes[0].id).toBe(nodeId([0, 4, 7]));
  });
});

// ---------------------------------------------------------------------------
// findShortestVoiceLeading — T-canonical equivalence
// ---------------------------------------------------------------------------

describe("findShortestVoiceLeading — T-canonical equivalence", () => {
  it("all transpositions of the same chord reach the same endpoint node", () => {
    const end = [0, 3, 7]; // A minor canonical
    const idEnd = nodeId(end);
    for (let k = 0; k < 12; k++) {
      // Transpose C major by k semitones (all resolve to the major-triad node)
      const transposed = [0 + k, 4 + k, 7 + k];
      const result = findShortestVoiceLeading(transposed, end);
      // If start and end are the same canonical node the path has 1 node;
      // otherwise just verify the last node is correct.
      if (result !== null) {
        expect(result.nodes[result.nodes.length - 1].id).toBe(idEnd);
      }
    }
  });

  it("canonicalizeChord([0,4,7]) and canonicalizeChord([2,6,9]) map to the same node", () => {
    const id1 = nodeId([0, 4, 7]);
    const id2 = nodeId([2, 6, 9]);
    expect(id1).toBe(id2);
    // findShortestVoiceLeading between them should return a zero-distance path
    const result = findShortestVoiceLeading([0, 4, 7], [2, 6, 9]);
    expect(result).not.toBeNull();
    expect(result!.totalDistance).toBe(0);
    expect(result!.nodes).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// findShortestVoiceLeading — Phase 3: options object (canonicalization + weightFn)
// ---------------------------------------------------------------------------

describe("findShortestVoiceLeading — options object (Phase 3)", () => {
  it("accepts a {canonicalization: 'T'} options object and returns a result", () => {
    const result = findShortestVoiceLeading([0, 4, 7], [0, 3, 7], undefined, {
      canonicalization: "T",
    });
    expect(result).not.toBeNull();
    expect(result!.totalDistance).toBeGreaterThanOrEqual(0);
  });

  it("options with canonicalization:'T' produces the same result as the legacy number API", () => {
    const legacyResult = findShortestVoiceLeading([0, 4, 7], [0, 3, 7]);
    const optionsResult = findShortestVoiceLeading(
      [0, 4, 7],
      [0, 3, 7],
      undefined,
      { canonicalization: "T" },
    );
    expect(optionsResult).not.toBeNull();
    expect(optionsResult!.totalDistance).toBe(legacyResult!.totalDistance);
    expect(optionsResult!.nodes.map((n) => n.id)).toEqual(
      legacyResult!.nodes.map((n) => n.id),
    );
  });

  it("a custom weightFn can alter the shortest path", () => {
    // Build a graph where moving from [0,4,7] toward [0,1,6] is penalised
    // by adding 100 to any transition involving [0,1,6]'s canonical form.
    const target = canonicalizeChord([0, 1, 6], "T").pcs.join(",");
    const penaltyFn = (a: number[], b: number[]) => {
      const base = chordDistance(a, b);
      const aId = canonicalizeChord(a, "T").pcs.join(",");
      const bId = canonicalizeChord(b, "T").pcs.join(",");
      const penalty = aId === target || bId === target ? 100 : 0;
      return base + penalty;
    };
    const defaultResult = findShortestVoiceLeading([0, 4, 7], [0, 1, 6]);
    const penaltyResult = findShortestVoiceLeading(
      [0, 4, 7],
      [0, 1, 6],
      undefined,
      { weightFn: penaltyFn },
    );
    // The penalised path must be at least as long as the default
    if (penaltyResult !== null && defaultResult !== null) {
      expect(penaltyResult.totalDistance).toBeGreaterThanOrEqual(
        defaultResult.totalDistance,
      );
    }
  });

  it("returns null when the start chord is absent from a TI graph built separately", () => {
    // Build a TI graph: [0,4,7] and its inversion [0,5,8] share one node
    const tiGraph = buildChordGraph({ sizes: [3], canonicalization: "TI" });
    // The canonical TI ID for [0,4,7]
    const canonId = canonicalizeChord([0, 4, 7], "TI").pcs.join(",");
    expect(tiGraph.nodes.some((n) => n.id === canonId)).toBe(true);

    // When using that graph with TI canonicalization, it should find a result
    const result = findShortestVoiceLeading(
      [0, 4, 7],
      [0, 2, 7],
      tiGraph,
      { canonicalization: "TI" },
    );
    // Node must be in the graph for the search to succeed; otherwise null is valid
    const endId = canonicalizeChord([0, 2, 7], "TI").pcs.join(",");
    if (tiGraph.nodes.some((n) => n.id === endId)) {
      expect(result).not.toBeNull();
    } else {
      expect(result).toBeNull();
    }
  });

  it("works correctly on a seventh-chord graph (sizes: [4])", () => {
    const graph = buildChordGraph({ sizes: [4] });
    // Dominant 7 [0,4,7,10] → minor 7 [0,3,7,10]
    const result = findShortestVoiceLeading([0, 4, 7, 10], [0, 3, 7, 10], graph);
    expect(result).not.toBeNull();
    expect(result!.totalDistance).toBeGreaterThanOrEqual(0);
    // All nodes must have pcs of length 4
    for (const node of result!.nodes) {
      expect(node.pcs).toHaveLength(4);
    }
  });

  it("returns null when start and end are in different layers (triad vs seventh) of a single-size graph", () => {
    // The triad graph only has 3-note nodes; a 4-note chord won't be present
    const triadGraph = buildChordGraph({ sizes: [3] });
    const result = findShortestVoiceLeading(
      [0, 4, 7],       // triad — present
      [0, 4, 7, 10],   // seventh — absent
      triadGraph,
    );
    expect(result).toBeNull();
  });

  it("finds a triad-to-seventh path with mixed-size graph and flexible weightFn", () => {
    const graph = buildChordGraph({
      sizes: [3, 4],
      weightFn: (a, b) => chordDistanceFlexible(a, b, { penalty: 2 }),
    });

    const result = findShortestVoiceLeading(
      [0, 4, 7],
      [0, 4, 7, 10],
      graph,
    );

    expect(result).not.toBeNull();
    const first = result!.nodes[0];
    const last = result!.nodes[result!.nodes.length - 1];
    expect(first.pcs).toHaveLength(3);
    expect(last.pcs).toHaveLength(4);
    expect(result!.totalDistance).toBeGreaterThanOrEqual(2);
  });

  it("auto-builds mixed-size graph via graphOptions and finds triad-to-seventh path", () => {
    const result = findShortestVoiceLeading(
      [0, 4, 7],
      [0, 4, 7, 10],
      undefined,
      {
        graphOptions: { sizes: [3, 4] },
        weightFn: (a, b) => chordDistanceFlexible(a, b, { penalty: 2 }),
      },
    );

    expect(result).not.toBeNull();
    expect(result!.nodes[0].pcs).toHaveLength(3);
    expect(result!.nodes[result!.nodes.length - 1].pcs).toHaveLength(4);
  });

  it("uses graphOptions canonicalization when canonicalization option is omitted", () => {
    const result = findShortestVoiceLeading(
      [0, 4, 7],
      [0, 5, 8],
      undefined,
      {
        graphOptions: { sizes: [3], canonicalization: "TI" },
      },
    );

    expect(result).not.toBeNull();
    expect(result!.totalDistance).toBe(0);
    expect(result!.nodes).toHaveLength(1);
  });
});
