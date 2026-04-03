import type { ChordType } from "../types";
import { findBestChordIdentity } from "./chordIdentity";

/**
 * Find the named chord (root + quality) that requires the fewest note changes
 * to match the given custom note set.
 * 
 * Uses Jaccard similarity (intersection over union) to find the best-fit chord.
 * Returns a "best-fit" chord for display purposes when the note set doesn't
 * match any of the 96 predefined chords.
 */
export function findNearestChord(noteIndices: number[]): {
  root: number;
  quality: ChordType;
  matchScore: number; // 0 = no match, 1 = perfect match
} {
  return findBestChordIdentity(noteIndices);
}
