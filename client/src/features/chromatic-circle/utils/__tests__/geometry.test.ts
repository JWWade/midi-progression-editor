import { describe, it, expect } from "vitest";
import {
  calculatePolygonPoints,
  CHORD_SHAPES,
  orderPolygonNoteIndices,
} from "../geometry";

describe("CHORD_SHAPES", () => {
  it("maps all triads to 'triangle'", () => {
    expect(CHORD_SHAPES.major).toBe("triangle");
    expect(CHORD_SHAPES.minor).toBe("triangle");
    expect(CHORD_SHAPES.dim).toBe("triangle");
    expect(CHORD_SHAPES.aug).toBe("triangle");
    expect(CHORD_SHAPES.quartal).toBe("triangle");
  });

  it("maps all seventh chords to 'quadrilateral'", () => {
    expect(CHORD_SHAPES.dom7).toBe("quadrilateral");
    expect(CHORD_SHAPES.maj7).toBe("quadrilateral");
    expect(CHORD_SHAPES.min7).toBe("quadrilateral");
    expect(CHORD_SHAPES.halfdim7).toBe("quadrilateral");
  });

  it("covers every ChordType with a defined shape", () => {
    const allTypes = [
      "major", "minor", "dim", "aug", "quartal",
      "dom7", "maj7", "min7", "halfdim7",
    ] as const;
    for (const t of allTypes) {
      expect(CHORD_SHAPES[t]).toBeDefined();
    }
  });
});

describe("calculatePolygonPoints", () => {
  const cx = 200;
  const cy = 200;
  const r = 150;

  it("returns an empty array for an empty note index list", () => {
    expect(calculatePolygonPoints(cx, cy, r, [])).toEqual([]);
  });

  it("places note 0 (C) at the 12 o'clock position", () => {
    // index 0 → angle = 0 → x = cx + r*sin(0) = cx, y = cy - r*cos(0) = cy - r
    const [p] = calculatePolygonPoints(cx, cy, r, [0]);
    expect(p.x).toBeCloseTo(cx);
    expect(p.y).toBeCloseTo(cy - r);
  });

  it("places note 3 (D#) at the 3 o'clock position", () => {
    // index 3 → angle = π/2 → x = cx + r*sin(π/2) = cx + r, y = cy - r*cos(π/2) = cy
    const [p] = calculatePolygonPoints(cx, cy, r, [3]);
    expect(p.x).toBeCloseTo(cx + r);
    expect(p.y).toBeCloseTo(cy);
  });

  it("places note 6 (F#) at the 6 o'clock position", () => {
    // index 6 → angle = π → x = cx + r*sin(π) ≈ cx, y = cy - r*cos(π) = cy + r
    const [p] = calculatePolygonPoints(cx, cy, r, [6]);
    expect(p.x).toBeCloseTo(cx, 5);
    expect(p.y).toBeCloseTo(cy + r);
  });

  it("places note 9 (A) at the 9 o'clock position", () => {
    // index 9 → angle = 3π/2 → x = cx + r*sin(3π/2) = cx - r, y = cy - r*cos(3π/2) ≈ cy
    const [p] = calculatePolygonPoints(cx, cy, r, [9]);
    expect(p.x).toBeCloseTo(cx - r);
    expect(p.y).toBeCloseTo(cy, 5);
  });

  it("returns one point per note index", () => {
    const indices = [0, 4, 7]; // C major
    const points = calculatePolygonPoints(cx, cy, r, indices);
    expect(points).toHaveLength(3);
  });

  it("returns four points for a seventh-chord index set", () => {
    const indices = [0, 4, 7, 11]; // CMaj7
    const points = calculatePolygonPoints(cx, cy, r, indices);
    expect(points).toHaveLength(4);
  });

  it("all returned points lie on the circle (distance = r from centre)", () => {
    const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const points = calculatePolygonPoints(cx, cy, r, indices);
    for (const p of points) {
      const dist = Math.hypot(p.x - cx, p.y - cy);
      expect(dist).toBeCloseTo(r, 5);
    }
  });
});

describe("orderPolygonNoteIndices", () => {
  it("deduplicates and sorts note indices in circular order", () => {
    expect(orderPolygonNoteIndices([10, 0, 1, 10, 6])).toEqual([0, 1, 6, 10]);
  });

  it("normalizes out-of-range and negative note indices", () => {
    expect(orderPolygonNoteIndices([-1, 11, 23, 12, 0, -12])).toEqual([0, 11]);
  });

  it("rotates ordered indices so preferred root is first when present", () => {
    expect(orderPolygonNoteIndices([0, 4, 7], 7)).toEqual([7, 0, 4]);
  });

  it("applies root rotation even when preferred root is out-of-range", () => {
    expect(orderPolygonNoteIndices([0, 4, 7], 19)).toEqual([7, 0, 4]);
  });

  it("keeps sorted order when preferred root is absent", () => {
    expect(orderPolygonNoteIndices([1, 5, 10, 0], 7)).toEqual([0, 1, 5, 10]);
  });
});
