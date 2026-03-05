import type { Point } from "@/features/chromatic-circle/utils/geometry";

/**
 * Linearly interpolates between two arrays of SVG points.
 * When point counts differ, only the overlapping points are morphed.
 */
export function morphPoints(
  fromPoints: Point[],
  toPoints: Point[],
  progress: number,
): Point[] {
  const len = Math.min(fromPoints.length, toPoints.length);
  return Array.from({ length: len }, (_, i) => ({
    x: fromPoints[i].x + (toPoints[i].x - fromPoints[i].x) * progress,
    y: fromPoints[i].y + (toPoints[i].y - fromPoints[i].y) * progress,
  }));
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
