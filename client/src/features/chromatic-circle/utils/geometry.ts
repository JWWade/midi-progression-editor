export interface Point {
  x: number;
  y: number;
}

/**
 * Maps note indices (0–11) to SVG polygon coordinates on the chromatic circle.
 * Note index 0 = C at the top (12 o'clock position).
 */
export function calculatePolygonPoints(
  cx: number,
  cy: number,
  circleRadius: number,
  noteIndices: number[],
): Point[] {
  return noteIndices.map((i) => {
    const angle = (i / 12) * 2 * Math.PI;
    return {
      x: cx + circleRadius * Math.sin(angle),
      y: cy - circleRadius * Math.cos(angle),
    };
  });
}
