import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ChordNoteInfo } from "../types";

export const MAJOR_INTERVALS = [0, 4, 7] as const;
export const MINOR_INTERVALS = [0, 3, 7] as const;

const ROLES: ChordNoteInfo["role"][] = ["root", "third", "fifth"];

const DEFAULT_ROLE: ChordNoteInfo["role"] = "fifth";

export function transposeChord(
  baseIntervals: readonly number[],
  rootIndex: number
): ChordNoteInfo[] {
  return baseIntervals.map((interval, i) => {
    const index = (interval + rootIndex) % 12;
    return {
      index,
      name: PITCH_CLASSES[index],
      role: ROLES[i] ?? DEFAULT_ROLE,
    };
  });
}
