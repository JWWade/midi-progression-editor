/**
 * Utilities for computing shared pitch classes between adjacent chord pairs in a progression.
 */

import type { Chord } from "@/features/current-chord/types";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";
import { isCustomChord } from "@/features/current-chord/utils/chordTypeGuards";

/**
 * Metrics for a pair of adjacent chords in a progression.
 */
export interface PairMetric {
  /** Index of the first chord in the pair (the left/from chord) */
  index: number;

  /** Number of pitch classes shared between the two chords */
  sharedCount: number;

  /** Total number of unique pitch classes in the first (left) chord */
  sizeA: number;

  /** Total number of unique pitch classes in the second (right) chord */
  sizeB: number;

  /** Proportion of shared notes relative to the smaller chord: sharedCount / min(sizeA, sizeB) */
  proportion: number;

  /** If true, do not render the metric (i.e., both chords have identical pitch class sets) */
  hide: boolean;
}

/**
 * Extract the pitch class set from a chord.
 * @param chord The chord to extract pitch classes from
 * @returns A Set of pitch classes (0-11) in the chord
 */
export function getChordPitchClasses(chord: Chord): Set<number> {
  let pitchClasses: number[];

  if (isCustomChord(chord)) {
    // Custom chord: use customNotes directly
    pitchClasses = chord.customNotes;
  } else {
    // Named chord: derive from root and quality
    pitchClasses = getChordNoteIndices(chord.root, chord.quality);
  }

  // Return as a Set to allow set operations; deduplicate in case of enharmonic duplicates
  return new Set(pitchClasses);
}

/**
 * Compute shared notes metrics between two adjacent chords.
 * @param chordA The first (left/from) chord
 * @param chordB The second (right/to) chord
 * @returns PairMetric with computed shared count, sizes, proportion, and hide flag
 */
export function computeSharedNotes(chordA: Chord, chordB: Chord): PairMetric {
  const setA = getChordPitchClasses(chordA);
  const setB = getChordPitchClasses(chordB);

  const sizeA = setA.size;
  const sizeB = setB.size;

  // Compute intersection: shared pitch classes
  const shared = new Set([...setA].filter((note) => setB.has(note)));
  const sharedCount = shared.size;

  // Proportion: relative to the smaller chord (conservative interpretation)
  const minSize = Math.min(sizeA, sizeB);
  const proportion = minSize > 0 ? sharedCount / minSize : 0;

  // Hide if both chords have identical pitch class sets
  const hide = sharedCount === Math.max(sizeA, sizeB) && sizeA === sizeB;

  return {
    index: 0, // Will be set by the caller
    sharedCount,
    sizeA,
    sizeB,
    proportion,
    hide,
  };
}

/**
 * Compute pair metrics for all adjacent chord pairs in a progression.
 * @param chords Array of chords in the progression
 * @returns Array of PairMetric, one per adjacent pair (length = chords.length - 1)
 */
export function computeProgressionPairMetrics(chords: Chord[]): PairMetric[] {
  const metrics: PairMetric[] = [];

  for (let i = 0; i < chords.length - 1; i++) {
    const metric = computeSharedNotes(chords[i], chords[i + 1]);
    metric.index = i;
    metrics.push(metric);
  }

  return metrics;
}
