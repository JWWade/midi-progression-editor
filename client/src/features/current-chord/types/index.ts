import type { ChordType } from "@/features/chord/types";

export interface Chord {
  root: number;
  quality: ChordType;
  extensions?: string[];
  
  /** Optional array of note indices [0-11] when chord is custom (not a named chord).
   *  When present, root/quality represent the *derived best-fit* chord for display purposes only.
   */
  customNotes?: number[];
}
