import { CHORD_INTERVALS } from "./transpose";
import type { ChordType } from "../types";

/**
 * Reinterprets an existing pitch set with `newRoot` as the tonal centre.
 *
 * Unlike {@link findNearestChord}, which searches all 12 possible roots, this
 * function only evaluates chord qualities anchored to `newRoot`.  The returned
 * `root` is therefore always equal to the supplied `newRoot`.
 *
 * @param noteIndices - Pitch classes of the current chord (0–11).
 * @param newRoot     - The pitch class to treat as the new root (0–11).
 * @returns Best-matching quality for `newRoot` and a Jaccard match score
 *          (1.0 = perfect match, 0 = no shared notes).
 */
export function rerootChord(
  noteIndices: number[],
  newRoot: number,
): { root: number; quality: ChordType; matchScore: number } {
  const noteSet = new Set(noteIndices);
  let bestQuality: ChordType = "major";
  let bestScore = 0;

  for (const [quality, intervals] of Object.entries(CHORD_INTERVALS)) {
    const chordNotes = intervals.map((interval) => (newRoot + interval) % 12);
    const intersection = chordNotes.filter((n) => noteSet.has(n)).length;
    const union = new Set([...noteIndices, ...chordNotes]).size;
    const score = union === 0 ? 0 : intersection / union;

    if (score > bestScore) {
      bestScore = score;
      bestQuality = quality as ChordType;
    }
  }

  return { root: newRoot, quality: bestQuality, matchScore: bestScore };
}
