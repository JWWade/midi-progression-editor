import { describe, it, expect } from "vitest";
import { calculateCentroid } from "../centroid";
import type { Point } from "@/features/chromatic-circle/utils/geometry";

describe("calculateCentroid", () => {
  it("returns { x: 0, y: 0 } for an empty points array", () => {
    expect(calculateCentroid([])).toEqual({ x: 0, y: 0 });
  });

  it("returns the point itself for a single-point array", () => {
    const p: Point = { x: 3, y: 7 };
    expect(calculateCentroid([p])).toEqual({ x: 3, y: 7 });
  });

  it("returns the midpoint for two points", () => {
    const a: Point = { x: 0, y: 0 };
    const b: Point = { x: 10, y: 10 };
    expect(calculateCentroid([a, b])).toEqual({ x: 5, y: 5 });
  });

  it("returns the centroid of an equilateral triangle centred at origin", () => {
    // Equilateral triangle at radius r=100, vertices at 90°, 210°, 330°
    const r = 100;
    const triangle: Point[] = [
      { x: r * Math.cos(Math.PI / 2), y: r * Math.sin(Math.PI / 2) },
      { x: r * Math.cos((7 * Math.PI) / 6), y: r * Math.sin((7 * Math.PI) / 6) },
      { x: r * Math.cos((11 * Math.PI) / 6), y: r * Math.sin((11 * Math.PI) / 6) },
    ];
    const centroid = calculateCentroid(triangle);
    expect(centroid.x).toBeCloseTo(0, 5);
    expect(centroid.y).toBeCloseTo(0, 5);
  });

  it("returns the centroid of a square", () => {
    const square: Point[] = [
      { x: -10, y: -10 },
      { x: 10, y: -10 },
      { x: 10, y: 10 },
      { x: -10, y: 10 },
    ];
    expect(calculateCentroid(square)).toEqual({ x: 0, y: 0 });
  });

  it("returns the correct centroid of an asymmetric polygon", () => {
    // Points: (0,0), (6,0), (6,4) — right triangle
    const triangle: Point[] = [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 4 },
    ];
    // Vertex centroid (not area centroid): mean of vertices
    const centroid = calculateCentroid(triangle);
    expect(centroid.x).toBeCloseTo(4, 5);
    expect(centroid.y).toBeCloseTo(4 / 3, 5);
  });

  it("is commutative: order of points does not affect the result", () => {
    const a: Point = { x: 1, y: 2 };
    const b: Point = { x: 3, y: 4 };
    const c: Point = { x: 5, y: 6 };
    const c1 = calculateCentroid([a, b, c]);
    const c2 = calculateCentroid([c, a, b]);
    const c3 = calculateCentroid([b, c, a]);
    expect(c1.x).toBeCloseTo(c2.x, 10);
    expect(c1.y).toBeCloseTo(c2.y, 10);
    expect(c1.x).toBeCloseTo(c3.x, 10);
    expect(c1.y).toBeCloseTo(c3.y, 10);
  });

  it("centroid lies within the bounding box of the points", () => {
    const points: Point[] = [
      { x: 10, y: 20 },
      { x: 50, y: 80 },
      { x: 90, y: 30 },
    ];
    const centroid = calculateCentroid(points);
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    expect(centroid.x).toBeGreaterThanOrEqual(minX);
    expect(centroid.x).toBeLessThanOrEqual(maxX);
    expect(centroid.y).toBeGreaterThanOrEqual(minY);
    expect(centroid.y).toBeLessThanOrEqual(maxY);
  });
});
