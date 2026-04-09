import type { ChordType } from "@/features/chord/types";
import {
  normalizePitchClass,
  uniqueSortedPitchClasses,
} from "@/features/chord/utils/pitchClass";

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
  sus2:     "triangle",
  quartal:  "triangle",
  maj6:     "quadrilateral",
  min6:     "quadrilateral",
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

/**
 * Returns note indices in a stable circular order suitable for polygon drawing.
 *
 * - Removes duplicates.
 * - Sorts notes in ascending chromatic index (clockwise ring order).
 * - If `preferredRoot` is present in the set, rotates the ordered list so the
 *   root is first while preserving circular order.
 */
export function orderPolygonNoteIndices(
  noteIndices: readonly number[],
  preferredRoot?: number,
): number[] {
  const unique = uniqueSortedPitchClasses(noteIndices);

  if (unique.length <= 1 || preferredRoot === undefined) {
    return unique;
  }

  const normalizedRoot = normalizePitchClass(preferredRoot);
  const rootPos = unique.indexOf(normalizedRoot);
  if (rootPos <= 0) {
    return unique;
  }

  return [...unique.slice(rootPos), ...unique.slice(0, rootPos)];
}
