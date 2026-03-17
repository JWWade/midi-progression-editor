import type { Point } from "@/features/chromatic-circle/utils/geometry";

/**
 * Linearly interpolates between two arrays of SVG points.
 * When point counts differ (e.g., triangle ↔ quadrilateral), snaps directly
 * to the destination to avoid creating intermediate invalid shapes (trapezoids).
 */
export function morphPoints(
  fromPoints: Point[],
  toPoints: Point[],
  progress: number,
): Point[] {
  const len = toPoints.length;
  if (len === 0) return [];

  // If vertex counts differ, snap to toPoints to avoid morphing between
  // geometrically incompatible shapes (e.g., triangle → quadrilateral).
  if (fromPoints.length !== toPoints.length) {
    return toPoints;
  }

  return Array.from({ length: len }, (_, i) => {
    const from = fromPoints[i];
    const to = toPoints[i];
    return {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
    };
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * Interpolates between two hex color strings, returning an `rgb(…)` string.
 */
export function interpolateColor(
  fromHex: string,
  toHex: string,
  progress: number,
): string {
  const [r1, g1, b1] = hexToRgb(fromHex);
  const [r2, g2, b2] = hexToRgb(toHex);
  const r = Math.round(r1 + (r2 - r1) * progress);
  const g = Math.round(g1 + (g2 - g1) * progress);
  const b = Math.round(b1 + (b2 - b1) * progress);
  return `rgb(${r},${g},${b})`;
}
