import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ChordNoteInfo, ChordType } from "../types";

export const MAJOR_INTERVALS = [0, 4, 7] as const;
export const MINOR_INTERVALS = [0, 3, 7] as const;
export const DIM_INTERVALS   = [0, 3, 6] as const;
export const AUG_INTERVALS   = [0, 4, 8] as const;
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

/** Maps each chord quality to its chromatic intervals. */
export const CHORD_INTERVALS: Readonly<Record<ChordType, readonly number[]>> = {
  major:    MAJOR_INTERVALS,
  minor:    MINOR_INTERVALS,
  dim:      DIM_INTERVALS,
  aug:      AUG_INTERVALS,
  maj7:     MAJ7_INTERVALS,
  min7:     MIN7_INTERVALS,
  dom7:     DOM7_INTERVALS,
  halfdim7: HALFDIM7_INTERVALS,
};

/**
 * Returns the chromatic note indices for a chord given its root and quality.
 *
 * @param root    Root note index (0 = C … 11 = B)
 * @param quality Chord quality / type
 * @returns       Array of chromatic note indices (0–11)
 */
export function getChordNoteIndices(root: number, quality: ChordType): number[] {
  return transposeChord(CHORD_INTERVALS[quality], root).map((n) => n.index);
}
