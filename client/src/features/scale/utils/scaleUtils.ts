import { SCALE_INTERVALS } from "../types/scales";
import type { ScaleType } from "../types/scales";

export function getScaleNotes(rootIndex: number, scaleType: ScaleType): number[] {
  return SCALE_INTERVALS[scaleType].map((interval) => (interval + rootIndex) % 12);
}
