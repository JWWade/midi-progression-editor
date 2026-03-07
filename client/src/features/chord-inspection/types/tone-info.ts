import type { ChordNoteInfo } from "@/features/chord/types";

export interface ToneInfo {
  note: ChordNoteInfo;
  role: string;
  interval: number; // semitones from root
  frequency: number;
  chordLabel: string; // e.g. "From Chord" or "To Chord"
}
