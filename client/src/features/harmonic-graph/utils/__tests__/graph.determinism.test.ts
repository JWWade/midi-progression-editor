/**
 * Determinism and stability tests for the harmonic chord graph.
 *
 * Verifies:
 *   1. Rebuild consistency: multiple calls to buildChordGraph() yield identical
 *      nodes, edges, and weights.
 *   2. Canonical ID stability: canonicalizeChord(x).pcs.join(",") is consistent
 *      across runs.
 */

import { describe, it, expect } from "vitest";
import { buildChordGraph } from "../buildChordGraph";
import { canonicalizeChord } from "@/features/voice-leading";

// ---------------------------------------------------------------------------
// 1. Rebuild consistency
// ---------------------------------------------------------------------------

describe("buildChordGraph — rebuild consistency", () => {
  it("produces identical node lists on repeated calls", () => {
    const first = buildChordGraph();
    const second = buildChordGraph();
    expect(second.nodes).toEqual(first.nodes);
  });

  it("produces identical edge lists on repeated calls", () => {
    const first = buildChordGraph();
    const second = buildChordGraph();
    expect(second.edges).toEqual(first.edges);
  });

  it("produces identical edge weights on repeated calls", () => {
    const first = buildChordGraph();
    const second = buildChordGraph();
    for (let i = 0; i < first.edges.length; i++) {
      expect(second.edges[i].weight).toBe(first.edges[i].weight);
    }
  });

  it("node order is stable across repeated calls", () => {
    const first = buildChordGraph();
    const second = buildChordGraph();
    const firstIds = first.nodes.map((n) => n.id);
    const secondIds = second.nodes.map((n) => n.id);
    expect(secondIds).toEqual(firstIds);
  });

  it("edge order is stable across repeated calls", () => {
    const first = buildChordGraph();
    const second = buildChordGraph();
    const firstKeys = first.edges.map((e) => `${e.from}||${e.to}`);
    const secondKeys = second.edges.map((e) => `${e.from}||${e.to}`);
    expect(secondKeys).toEqual(firstKeys);
  });

  it("custom options produce identical results on repeated calls", () => {
    const first = buildChordGraph({ sizes: [3], canonicalization: "TI" });
    const second = buildChordGraph({ sizes: [3], canonicalization: "TI" });
    expect(second.nodes).toEqual(first.nodes);
    expect(second.edges).toEqual(first.edges);
  });
});

// ---------------------------------------------------------------------------
// 2. Canonical ID stability
// ---------------------------------------------------------------------------

describe("canonicalizeChord — ID stability across calls", () => {
  const testCases: number[][] = [
    [0, 4, 7],   // C major
    [0, 3, 7],   // C minor
    [0, 3, 6],   // C diminished
    [0, 4, 8],   // C augmented
    [2, 6, 9],   // D major
    [5, 9, 0],   // F major
    [7, 11, 2],  // G major
  ];

  it("canonicalizeChord(x).pcs.join(',') is identical across multiple calls (T mode)", () => {
    for (const pcs of testCases) {
      const first = canonicalizeChord(pcs, "T").pcs.join(",");
      for (let i = 0; i < 5; i++) {
        expect(canonicalizeChord(pcs, "T").pcs.join(",")).toBe(first);
      }
    }
  });

  it("canonicalizeChord(x).pcs.join(',') is identical across multiple calls (TI mode)", () => {
    for (const pcs of testCases) {
      const first = canonicalizeChord(pcs, "TI").pcs.join(",");
      for (let i = 0; i < 5; i++) {
        expect(canonicalizeChord(pcs, "TI").pcs.join(",")).toBe(first);
      }
    }
  });

  it("node IDs in the graph are stable across rebuilds", () => {
    const first = buildChordGraph();
    const second = buildChordGraph();
    const firstIdSet = new Set(first.nodes.map((n) => n.id));
    const secondIdSet = new Set(second.nodes.map((n) => n.id));
    expect(firstIdSet.size).toBe(secondIdSet.size);
    for (const id of firstIdSet) {
      expect(secondIdSet.has(id)).toBe(true);
    }
  });
});
