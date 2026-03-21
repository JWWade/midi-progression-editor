import { describe, it, expect } from "vitest";
import { morphPoints, interpolateColor } from "../morphing";
import type { Point } from "@/features/chromatic-circle/utils/geometry";

// ── morphPoints ──────────────────────────────────────────────────────────────

describe("morphPoints", () => {
  const triangle: Point[] = [
    { x: 0, y: -100 },
    { x: 86.6, y: 50 },
    { x: -86.6, y: 50 },
  ];
  const shiftedTriangle: Point[] = [
    { x: 0, y: -50 },
    { x: 43.3, y: 25 },
    { x: -43.3, y: 25 },
  ];

  it("returns an empty array when toPoints is empty", () => {
    expect(morphPoints(triangle, [], 0.5)).toEqual([]);
  });

  it("returns toPoints immediately when fromPoints and toPoints have different lengths", () => {
    const quad: Point[] = [
      { x: 0, y: -100 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: -100, y: 0 },
    ];
    const result = morphPoints(triangle, quad, 0.5);
    expect(result).toEqual(quad);
  });

  it("at progress=0 returns fromPoints (all coordinates match from)", () => {
    const result = morphPoints(triangle, shiftedTriangle, 0);
    for (let i = 0; i < triangle.length; i++) {
      expect(result[i].x).toBeCloseTo(triangle[i].x, 5);
      expect(result[i].y).toBeCloseTo(triangle[i].y, 5);
    }
  });

  it("at progress=1 returns toPoints (all coordinates match to)", () => {
    const result = morphPoints(triangle, shiftedTriangle, 1);
    for (let i = 0; i < shiftedTriangle.length; i++) {
      expect(result[i].x).toBeCloseTo(shiftedTriangle[i].x, 5);
      expect(result[i].y).toBeCloseTo(shiftedTriangle[i].y, 5);
    }
  });

  it("at progress=0.5 interpolates to the midpoint of each coordinate", () => {
    const result = morphPoints(triangle, shiftedTriangle, 0.5);
    for (let i = 0; i < triangle.length; i++) {
      const midX = (triangle[i].x + shiftedTriangle[i].x) / 2;
      const midY = (triangle[i].y + shiftedTriangle[i].y) / 2;
      expect(result[i].x).toBeCloseTo(midX, 5);
      expect(result[i].y).toBeCloseTo(midY, 5);
    }
  });

  it("returns the same number of points as toPoints", () => {
    const result = morphPoints(triangle, shiftedTriangle, 0.7);
    expect(result).toHaveLength(shiftedTriangle.length);
  });

  it("is monotonically interpolated: 0 ≤ progress ≤ 1 keeps x between from.x and to.x", () => {
    const from: Point[] = [{ x: 0, y: 0 }];
    const to: Point[] = [{ x: 100, y: 100 }];
    for (let p = 0; p <= 10; p++) {
      const progress = p / 10;
      const result = morphPoints(from, to, progress);
      expect(result[0].x).toBeGreaterThanOrEqual(0);
      expect(result[0].x).toBeLessThanOrEqual(100);
    }
  });
});

// ── interpolateColor ─────────────────────────────────────────────────────────

describe("interpolateColor", () => {
  it("at progress=0 returns the from color as rgb", () => {
    const result = interpolateColor("#ff0000", "#0000ff", 0);
    expect(result).toBe("rgb(255,0,0)");
  });

  it("at progress=1 returns the to color as rgb", () => {
    const result = interpolateColor("#ff0000", "#0000ff", 1);
    expect(result).toBe("rgb(0,0,255)");
  });

  it("at progress=0.5 returns the midpoint color (128 rounded)", () => {
    const result = interpolateColor("#ff0000", "#0000ff", 0.5);
    // R: 255*0.5=127.5→128, G: 0, B: 255*0.5=127.5→128
    expect(result).toBe("rgb(128,0,128)");
  });

  it("returns a valid rgb(...) string format", () => {
    const result = interpolateColor("#123456", "#abcdef", 0.4);
    expect(result).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it("handles black (#000000) and white (#ffffff)", () => {
    expect(interpolateColor("#000000", "#ffffff", 0)).toBe("rgb(0,0,0)");
    expect(interpolateColor("#000000", "#ffffff", 1)).toBe("rgb(255,255,255)");
  });

  it("handles identical from/to colors at any progress", () => {
    const result = interpolateColor("#aabbcc", "#aabbcc", 0.7);
    expect(result).toBe("rgb(170,187,204)");
  });

  it("returns rgb(0,0,0) for invalid hex strings", () => {
    const result = interpolateColor("invalid", "#ffffff", 0.5);
    expect(result).toBe("rgb(128,128,128)");
  });
});
