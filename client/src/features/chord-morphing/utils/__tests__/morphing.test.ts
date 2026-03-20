import { describe, it, expect } from "vitest";
import { morphPoints, interpolateColor } from "../morphing";
import type { Point } from "@/features/chromatic-circle/utils/geometry";

// ── morphPoints ─────────────────────────────────────────────────────────────

describe("morphPoints", () => {
  const triangle: Point[] = [
    { x: 0, y: -10 },
    { x: 8.66, y: 5 },
    { x: -8.66, y: 5 },
  ];
  const triangle2: Point[] = [
    { x: 0, y: -20 },
    { x: 17.32, y: 10 },
    { x: -17.32, y: 10 },
  ];

  it("returns an empty array when toPoints is empty", () => {
    expect(morphPoints(triangle, [], 0.5)).toEqual([]);
  });

  it("returns toPoints when vertex counts differ (snap instead of morph)", () => {
    const quad: Point[] = [
      { x: 0, y: -10 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
      { x: -10, y: 0 },
    ];
    const result = morphPoints(triangle, quad, 0.5);
    expect(result).toEqual(quad);
  });

  it("returns fromPoints at progress = 0", () => {
    const result = morphPoints(triangle, triangle2, 0);
    expect(result).toEqual(triangle);
  });

  it("returns toPoints at progress = 1", () => {
    const result = morphPoints(triangle, triangle2, 1);
    expect(result).toEqual(triangle2);
  });

  it("returns the midpoint of each vertex at progress = 0.5", () => {
    const result = morphPoints(triangle, triangle2, 0.5);
    expect(result[0]).toEqual({ x: 0, y: -15 });
    expect(result[1].x).toBeCloseTo(12.99, 1);
    expect(result[1].y).toBeCloseTo(7.5, 1);
  });

  it("returns the correct number of points (matching toPoints length)", () => {
    const result = morphPoints(triangle, triangle2, 0.3);
    expect(result).toHaveLength(triangle2.length);
  });

  it("snaps to toPoints at any progress when vertex counts differ", () => {
    const quad: Point[] = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
      { x: 7, y: 8 },
    ];
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      expect(morphPoints(triangle, quad, progress)).toEqual(quad);
    }
  });
});

// ── interpolateColor ─────────────────────────────────────────────────────────

describe("interpolateColor", () => {
  it("returns the from-color as rgb at progress = 0", () => {
    // #ff0000 = rgb(255, 0, 0)
    expect(interpolateColor("#ff0000", "#0000ff", 0)).toBe("rgb(255,0,0)");
  });

  it("returns the to-color as rgb at progress = 1", () => {
    // #0000ff = rgb(0, 0, 255)
    expect(interpolateColor("#ff0000", "#0000ff", 1)).toBe("rgb(0,0,255)");
  });

  it("returns the midpoint color at progress = 0.5", () => {
    // midpoint of red(255,0,0) and blue(0,0,255) = (127,0,127)
    expect(interpolateColor("#ff0000", "#0000ff", 0.5)).toBe("rgb(128,0,128)");
  });

  it("handles white (#ffffff) to black (#000000) at 0.5", () => {
    expect(interpolateColor("#ffffff", "#000000", 0.5)).toBe("rgb(128,128,128)");
  });

  it("handles black (#000000) to black (#000000) — returns black", () => {
    expect(interpolateColor("#000000", "#000000", 0.5)).toBe("rgb(0,0,0)");
  });

  it("returns a valid rgb(...) string format at various progress values", () => {
    const rgbPattern = /^rgb\(\d+,\d+,\d+\)$/;
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const result = interpolateColor("#123456", "#abcdef", progress);
      expect(result).toMatch(rgbPattern);
    }
  });
});
