import { SCALE_INTERVALS } from "@/features/scale/types";
import type { ScaleType } from "@/features/scale/types";

export const DIATONIC_OPACITY = 1;
export const CHROMATIC_OPACITY = 0.3;

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
  return new Set(SCALE_INTERVALS[mode].map((interval) => (interval + root) % 12));
}
