import type { ChordNoteInfo, ChordType } from "../types";

const C_MAJOR_CHORD: ChordNoteInfo[] = [
  { index: 0, name: "C", role: "root" },
  { index: 4, name: "E", role: "third" },
  { index: 7, name: "G", role: "fifth" },
];

export function getChordNotes(chordType: ChordType): ChordNoteInfo[] {
  if (chordType === "major") {
    return C_MAJOR_CHORD;
  }
  return [];
}
