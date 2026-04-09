import type { ChordType } from "../types";
import { findBestChordIdentity } from "./chordIdentity";

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
  return findBestChordIdentity(noteIndices);
}
