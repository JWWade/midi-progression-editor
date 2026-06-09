import type { ChordType } from "../types";
import { CHORD_INTERVALS } from "./transpose";
import { findBestChordIdentity } from "./chordIdentity";
import {
  dedupeNormalizedPitchClasses,
  normalizePitchClass,
} from "./pitchClass";

const MATCH_SCORE_EPSILON = 1e-9;

function isExactMatchForQuality(
  noteSet: ReadonlySet<number>,
  noteCount: number,
  root: number,
  quality: ChordType,
): boolean {
  const intervals = CHORD_INTERVALS[quality];
  if (intervals.length !== noteCount) {
    return false;
  }

  for (const interval of intervals) {
    const pitchClass = normalizePitchClass(root + interval);
    if (!noteSet.has(pitchClass)) {
      return false;
    }
  }

  return true;
}

function resolveMin7Maj6Ambiguity(
  noteIndices: readonly number[],
  fallback: { root: number; quality: ChordType; matchScore: number },
): { root: number; quality: ChordType; matchScore: number } {
  if (Math.abs(fallback.matchScore - 1) > MATCH_SCORE_EPSILON) {
    return fallback;
  }

  const normalizedNotes = dedupeNormalizedPitchClasses(noteIndices);
  const noteSet = new Set(normalizedNotes);
  const rootOrder = new Map<number, number>();
  for (let i = 0; i < normalizedNotes.length; i++) {
    rootOrder.set(normalizedNotes[i], i);
  }

  let min7Root: number | null = null;
  let maj6Root: number | null = null;

  for (let root = 0; root < 12; root++) {
    if (min7Root === null && isExactMatchForQuality(noteSet, normalizedNotes.length, root, "min7")) {
      min7Root = root;
    }
    if (maj6Root === null && isExactMatchForQuality(noteSet, normalizedNotes.length, root, "maj6")) {
      maj6Root = root;
    }
  }

  if (min7Root === null || maj6Root === null) {
    return fallback;
  }

  const min7Order = rootOrder.get(min7Root);
  const maj6Order = rootOrder.get(maj6Root);

  if (min7Order === undefined || maj6Order === undefined) {
    return fallback;
  }

  if (maj6Order < min7Order) {
    return { root: maj6Root, quality: "maj6", matchScore: 1 };
  }

  return { root: min7Root, quality: "min7", matchScore: 1 };
}

/**
 * Find the named chord (root + quality) whose weighted tone score best
 * matches the given pitch-class set. The fifth is weighted lower than the
 * root, third, and seventh, so incomplete voicings (e.g. C–E–B for Cmaj7)
 * resolve to cleaner labels than flat Jaccard matching.
 *
 * Returns matchScore === 1 only when all canonical tones are present and
 * no extra notes exist, preserving the "perfect match → no customNotes"
 * contract used by useChordState and useCustomChordState.
 */
export function findNearestChord(noteIndices: number[]): {
  root: number;
  quality: ChordType;
  matchScore: number; // 0 = no match, 1 = perfect match
} {
  const bestIdentity = findBestChordIdentity(noteIndices);
  return resolveMin7Maj6Ambiguity(noteIndices, bestIdentity);
}
