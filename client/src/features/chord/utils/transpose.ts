import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ChordNoteInfo, ChordType } from "../types";

export const MAJOR_INTERVALS = [0, 4, 7] as const;
export const MINOR_INTERVALS = [0, 3, 7] as const;
export const MAJ7_INTERVALS = [0, 4, 7, 11] as const;
export const MIN7_INTERVALS = [0, 3, 7, 10] as const;
export const DOM7_INTERVALS = [0, 4, 7, 10] as const;
export const HALFDIM7_INTERVALS = [0, 3, 6, 10] as const;

const ROLES: ChordNoteInfo["role"][] = ["root", "third", "fifth", "seventh"];

const DEFAULT_ROLE: ChordNoteInfo["role"] = "seventh";

/**
 * Triad intervals for each seventh chord type.
 * Returns the 3-note base triad embedded within the seventh chord.
 */
const SEVENTH_CHORD_TRIADS: Partial<Record<ChordType, readonly number[]>> = {
  maj7: [0, 4, 7],
  min7: [0, 3, 7],
  dom7: [0, 4, 7],
  halfdim7: [0, 3, 6],
};

/**
 * Returns the base triad intervals for a seventh chord type,
 * or `undefined` for chord types that are already triads (major, minor).
 */
export function getChordTriad(chordType: ChordType): readonly number[] | undefined {
  return SEVENTH_CHORD_TRIADS[chordType];
}

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
