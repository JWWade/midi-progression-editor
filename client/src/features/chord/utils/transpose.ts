import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ChordNoteInfo } from "../types";

export const MAJOR_INTERVALS = [0, 4, 7] as const;
export const MINOR_INTERVALS = [0, 3, 7] as const;
export const MAJ7_INTERVALS = [0, 4, 7, 11] as const;
export const MIN7_INTERVALS = [0, 3, 7, 10] as const;
export const DOM7_INTERVALS = [0, 4, 7, 10] as const;
export const HALFDIM7_INTERVALS = [0, 3, 6, 10] as const;

const ROLES: ChordNoteInfo["role"][] = ["root", "third", "fifth", "seventh"];

const DEFAULT_ROLE: ChordNoteInfo["role"] = "seventh";

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
