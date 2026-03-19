import type { ChordNoteInfo } from "@/features/chord/types";

export interface ToneInfo {
  note: ChordNoteInfo;
  frequency: number;
  /** Enharmonic spelling of this note, if one exists (e.g. "Db" for C#). */
  enharmonicEquivalent?: string;
  /** The note's role in the active chord (e.g. "Root", "Major Third"). Only present when chord context is available. */
  scaleDegree?: string;
  /** True when this tone was selected by clicking a chord polygon vertex (not a ring node). */
  isChordVertex?: boolean;
}
