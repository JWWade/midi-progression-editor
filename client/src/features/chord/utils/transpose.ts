import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ChordNoteInfo, ChordType } from "../types";
import type { PrimitiveShape } from "@/features/current-chord/types";
import {
  dedupeNormalizedPitchClasses,
  normalizePitchClass,
} from "./pitchClass";

export const MAJOR_INTERVALS = [0, 4, 7] as const;
export const MINOR_INTERVALS = [0, 3, 7] as const;
export const DIM_INTERVALS   = [0, 3, 6] as const;
export const AUG_INTERVALS   = [0, 4, 8] as const;
export const MAJ7_INTERVALS = [0, 4, 7, 11] as const;
export const MIN7_INTERVALS = [0, 3, 7, 10] as const;
export const DOM7_INTERVALS = [0, 4, 7, 10] as const;
export const HALFDIM7_INTERVALS = [0, 3, 6, 10] as const;
export const QUARTAL_INTERVALS = [0, 5, 10] as const;
export const EQUILATERAL_TRIANGLE_INTERVALS = [0, 4, 8] as const;
export const SUSPENDED_TRIANGLE_INTERVALS = [0, 5, 7] as const;
export const SQUARE_INTERVALS = [0, 3, 6, 9] as const;
export const RECTANGLE_INTERVALS = [0, 4, 6, 10] as const;
export const SYMMETRICAL_TRAPEZOID_INTERVALS = [0, 4, 7, 11] as const;

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
  rootIndex: number,
  pitchClasses: readonly string[] = PITCH_CLASSES,
): ChordNoteInfo[] {
  return baseIntervals.map((interval, i) => {
    const index = normalizePitchClass(interval + rootIndex);
    return {
      index,
      name: pitchClasses[index],
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
  quartal:  QUARTAL_INTERVALS,
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

/**
 * Rotates a set of pitch classes by the given number of semitones.
 * Positive values move clockwise on the chromatic circle.
 */
export function rotateChordNotes(noteIndices: number[], semitones: number): number[] {
  return noteIndices.map((index) => normalizePitchClass(index + semitones));
}

/**
 * Returns a wrapped root index after semitone rotation.
 */
export function rotateNamedChordRoot(root: number, semitones: number): number {
  return normalizePitchClass(root + semitones);
}

/**
 * Removes duplicate pitch classes while preserving first-seen order.
 */
export function dedupePitchClasses(noteIndices: number[]): number[] {
  return dedupeNormalizedPitchClasses(noteIndices);
}

/**
 * Reflects each note's interval around the root note on the chromatic circle.
 * A note at `root + i` semitones becomes `root - i` (mod 12).
 * The root itself is always preserved.
 *
 * @example
 * // C major [0, 4, 7] mirrored about C(0) → [0, 8, 5]  (C, Ab, F — an Fm chord)
 * mirrorChordAboutRoot([0, 4, 7], 0) // → [0, 8, 5]
 */
export function mirrorChordAboutRoot(noteIndices: number[], root: number): number[] {
  return noteIndices.map((note) => normalizePitchClass(2 * root - note));
}

/**
 * Returns chromatic note indices for a primitive geometric shape anchored to a root.
 */
export function getPrimitiveNoteIndices(root: number, shape: PrimitiveShape): number[] {
  const intervals =
    shape === "equilateral-triangle"
      ? EQUILATERAL_TRIANGLE_INTERVALS
      : shape === "suspended-triangle"
        ? SUSPENDED_TRIANGLE_INTERVALS
        : shape === "rectangle"
          ? RECTANGLE_INTERVALS
          : shape === "symmetrical-trapezoid"
            ? SYMMETRICAL_TRAPEZOID_INTERVALS
            : SQUARE_INTERVALS;
  return intervals.map((interval) => normalizePitchClass(root + interval));
}
