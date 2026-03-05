import type { Point } from "@/features/chromatic-circle/utils/geometry";

/**
 * Calculates the vertex centroid (arithmetic mean of vertex coordinates) of a
 * polygon defined by an array of points.
 *
 * For a regular polygon (e.g. equilateral triangle), the vertex centroid
 * coincides with the geometric center.
 *
 * Returns the origin `{ x: 0, y: 0 }` for an empty points array.
 */
export function calculateCentroid(points: Point[]): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}
