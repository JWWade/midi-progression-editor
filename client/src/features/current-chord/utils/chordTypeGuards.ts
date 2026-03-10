import type { Chord } from "../types";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";

type CustomChord = Chord & { customNotes: number[] };

/**
 * Type guard to check if a chord is a custom chord (has customNotes defined)
 */
export function isCustomChord(chord: Chord): chord is CustomChord {
  return Array.isArray(chord.customNotes);
}

/**
 * Get the note indices for a chord, whether it's a named chord or a custom chord.
 * For custom chords, returns the customNotes array.
 * For named chords, calculates notes from root + quality.
 */
export function getChordNotes(chord: Chord): number[] {
  if (chord.customNotes) {
    return chord.customNotes;
  }
  return getChordNoteIndices(chord.root, chord.quality);
}
