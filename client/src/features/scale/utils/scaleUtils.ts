import { SCALE_INTERVALS } from "../types/scales";
import type { ScaleType } from "../types/scales";

export function getScaleNotes(rootIndex: number, scaleType: ScaleType): number[] {
  return SCALE_INTERVALS[scaleType].map((interval) => (interval + rootIndex) % 12);
}

/**
 * Returns the set of chromatic note indices (0–11) that belong to the given
 * key's scale (i.e. the diatonic notes).
 *
 * @param root Root note index (0 = C, 1 = C#, …, 11 = B)
 * @param mode Scale/mode type
 * @returns    Set of diatonic note indices for the key
 */
export function getDiatonicIndices(root: number, mode: ScaleType): Set<number> {
  if (import.meta.env.DEV && (root < 0 || root > 11 || !Number.isInteger(root))) {
    console.warn(`getDiatonicIndices: root ${root} is out of valid range (0–11)`);
  }
  return new Set(getScaleNotes(root, mode));
}
