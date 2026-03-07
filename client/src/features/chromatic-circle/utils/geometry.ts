import type { ChordType } from "@/features/chord/types";

export interface Point {
  x: number;
  y: number;
}

/**
 * Describes the geometric shape produced by a chord on the chromatic circle.
 *
 * - `"triangle"`      — three vertices; produced by all triads (major, minor, dim, aug)
 * - `"quadrilateral"` — four vertices; produced by all seventh chords (dom7, maj7, min7, halfdim7)
 */
export type ChordShape = "triangle" | "quadrilateral";

/**
 * Maps every {@link ChordType} to the geometric shape it forms on the
 * chromatic circle.  The shape is determined by the number of chord tones:
 * triads have 3 → triangle; seventh chords have 4 → quadrilateral.
 */
export const CHORD_SHAPES: Readonly<Record<ChordType, ChordShape>> = {
  major:    "triangle",
  minor:    "triangle",
  dim:      "triangle",
  aug:      "triangle",
  dom7:     "quadrilateral",
  maj7:     "quadrilateral",
  min7:     "quadrilateral",
  halfdim7: "quadrilateral",
};

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
