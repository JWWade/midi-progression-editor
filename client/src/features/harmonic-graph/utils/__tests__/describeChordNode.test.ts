import { describe, it, expect } from "vitest";
import { describeChordNode, describeChordNodes } from "../describeChordNode";
import type { ChordNode } from "../../types";

describe("describeChordNode", () => {
  it("preserves id/pcs and adds a named interpretation", () => {
    const node: ChordNode = { id: "0,3,8", pcs: [0, 3, 8] };
    const described = describeChordNode(node);

    expect(described.id).toBe(node.id);
    expect(described.pcs).toEqual(node.pcs);
    expect(described.root).toBeGreaterThanOrEqual(0);
    expect(described.root).toBeLessThanOrEqual(11);
    expect(typeof described.quality).toBe("string");
    expect(described.symbol.length).toBeGreaterThan(0);
    expect(described.matchScore).toBeGreaterThanOrEqual(0);
    expect(described.matchScore).toBeLessThanOrEqual(1);
  });

  it("is deterministic for the same input node", () => {
    const node: ChordNode = { id: "0,3,8", pcs: [0, 3, 8] };
    const a = describeChordNode(node);
    const b = describeChordNode(node);

    expect(a).toEqual(b);
  });
});

describe("describeChordNodes", () => {
  it("maps all nodes and preserves order", () => {
    const nodes: ChordNode[] = [
      { id: "0,3,8", pcs: [0, 3, 8] },
      { id: "0,2,7", pcs: [0, 2, 7] },
    ];
    const described = describeChordNodes(nodes);

    expect(described).toHaveLength(2);
    expect(described[0].id).toBe("0,3,8");
    expect(described[1].id).toBe("0,2,7");
  });
});
