export type ChordRole = "root" | "third" | "fifth" | "seventh";

export interface ChordNoteInfo {
  index: number;
  name: string;
  role: ChordRole;
}

export type ChordType = "major" | "minor" | "dim" | "aug" | "maj7" | "min7" | "dom7" | "halfdim7";

export const SEVENTH_CHORD_TYPES: ReadonlySet<ChordType> = new Set([
  "maj7",
  "min7",
  "dom7",
  "halfdim7",
]);
