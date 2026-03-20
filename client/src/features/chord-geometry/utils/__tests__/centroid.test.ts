import { describe, it, expect } from "vitest";
import { calculateCentroid } from "../centroid";
import type { Point } from "@/features/chromatic-circle/utils/geometry";

describe("calculateCentroid", () => {
  it("returns {x: 0, y: 0} for an empty array", () => {
    expect(calculateCentroid([])).toEqual({ x: 0, y: 0 });
  });

  it("returns the single point itself for a one-element array", () => {
    const point: Point = { x: 3, y: 5 };
    expect(calculateCentroid([point])).toEqual({ x: 3, y: 5 });
  });

  it("returns the midpoint of two points", () => {
    const points: Point[] = [{ x: 0, y: 0 }, { x: 4, y: 4 }];
    expect(calculateCentroid(points)).toEqual({ x: 2, y: 2 });
  });

  it("returns the centroid of an equilateral triangle centred at origin", () => {
    // Equilateral triangle symmetric about origin: centroid = origin
    const r = 10;
    const angles = [90, 210, 330]; // degrees
    const points: Point[] = angles.map((deg) => ({
      x: r * Math.cos((deg * Math.PI) / 180),
      y: r * Math.sin((deg * Math.PI) / 180),
    }));
    const centroid = calculateCentroid(points);
    expect(centroid.x).toBeCloseTo(0, 10);
    expect(centroid.y).toBeCloseTo(0, 10);
  });

  it("returns the average x and y for four points", () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];
    // Centroid of a square centred at (2, 2)
    expect(calculateCentroid(points)).toEqual({ x: 2, y: 2 });
  });

  it("handles points with negative coordinates", () => {
    const points: Point[] = [
      { x: -3, y: -3 },
      { x: 3, y: -3 },
      { x: 0, y: 3 },
    ];
    const centroid = calculateCentroid(points);
    expect(centroid.x).toBeCloseTo(0, 10);
    expect(centroid.y).toBeCloseTo(-1, 10);
  });

  it("centroid of a single axis-aligned point is that point", () => {
    const p: Point = { x: 100, y: -42 };
    expect(calculateCentroid([p])).toEqual(p);
  });
});
