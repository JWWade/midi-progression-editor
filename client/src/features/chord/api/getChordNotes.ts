import type { ChordNoteInfo, ChordType } from "../types";
import { CHORD_INTERVALS, transposeChord } from "../utils/transpose";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";

/**
 * Returns the chord notes for a C-root chord of the given type.
 *
 * @deprecated This function always returns C-root notes and does not accept a
 *   root parameter. Prefer {@link transposeChord} with {@link CHORD_INTERVALS}
 *   for full root-transposition support. Kept for backward compatibility.
 */
export function getChordNotes(chordType: ChordType): ChordNoteInfo[] {
  return transposeChord(CHORD_INTERVALS[chordType], 0).map((note) => ({
    ...note,
    name: PITCH_CLASSES[note.index],
  }));
}
