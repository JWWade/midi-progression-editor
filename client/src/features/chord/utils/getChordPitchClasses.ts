import type { Chord } from "@/features/current-chord/types";
import { getChordNoteIndices } from "./transpose";

/**
 * Returns the pitch classes (note indices 0–11) for a chord.
 *
 * For custom chords, returns `chord.customNotes` directly.
 * For named chords, derives the notes from `chord.root` and `chord.quality`.
 *
 * @param chord The chord to get pitch classes for.
 * @returns Array of pitch-class indices (0–11).
 */
export function getChordPitchClasses(chord: Chord): number[] {
  if (Array.isArray(chord.customNotes)) {
    return chord.customNotes;
  }
  return getChordNoteIndices(chord.root, chord.quality);
}
