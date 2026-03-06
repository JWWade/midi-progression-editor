import { SCALE_INTERVALS } from "@/features/scale/types";
import type { ScaleType } from "@/features/scale/types";

export const DIATONIC_OPACITY = 1;
export const CHROMATIC_OPACITY = 0.3;

/**
 * Returns the set of chromatic note indices (0–11) that belong to the given
 * root + scale combination.
 */
export function getDiatonicIndices(rootIndex: number, scaleType: ScaleType): Set<number> {
  const indices = SCALE_INTERVALS[scaleType].map((interval) => (interval + rootIndex) % 12);
  return new Set(indices);
}
