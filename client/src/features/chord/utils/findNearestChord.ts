import { CHORD_INTERVALS } from "./transpose";
import type { ChordType } from "../types";

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
  const noteSet = new Set(noteIndices);
  let bestRoot = 0;
  let bestQuality: ChordType = "major";
  let bestScore = 0;
  
  for (let root = 0; root < 12; root++) {
    for (const [quality, intervals] of Object.entries(CHORD_INTERVALS)) {
      const chordNotes = intervals.map((interval) => (root + interval) % 12);
      
      // Calculate Jaccard similarity: |intersection| / |union|
      const intersection = chordNotes.filter(n => noteSet.has(n)).length;
      const union = new Set([...noteIndices, ...chordNotes]).size;
      const score = intersection / union;
      
      if (score > bestScore) {
        bestScore = score;
        bestRoot = root;
        bestQuality = quality as ChordType;
      }
    }
  }
  
  return { root: bestRoot, quality: bestQuality, matchScore: bestScore };
}
