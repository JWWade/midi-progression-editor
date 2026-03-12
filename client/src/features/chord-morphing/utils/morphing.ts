import type { Point } from "@/features/chromatic-circle/utils/geometry";

/**
 * Linearly interpolates between two arrays of SVG points.
 * When point counts differ, the shorter set is padded by repeating its last
 * point so vertex-count transitions remain visually continuous.
 */
export function morphPoints(
  fromPoints: Point[],
  toPoints: Point[],
  progress: number,
): Point[] {
  const len = Math.max(fromPoints.length, toPoints.length);
  if (len === 0) return [];

  const fallbackFrom = fromPoints[fromPoints.length - 1] ?? { x: 0, y: 0 };
  const fallbackTo = toPoints[toPoints.length - 1] ?? { x: 0, y: 0 };

  return Array.from({ length: len }, (_, i) => ({
    x:
      (fromPoints[i] ?? fallbackFrom).x +
      ((toPoints[i] ?? fallbackTo).x - (fromPoints[i] ?? fallbackFrom).x) * progress,
    y:
      (fromPoints[i] ?? fallbackFrom).y +
      ((toPoints[i] ?? fallbackTo).y - (fromPoints[i] ?? fallbackFrom).y) * progress,
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
