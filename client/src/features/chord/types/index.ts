export type ChordRole = "root" | "third" | "fifth";

export interface ChordNoteInfo {
  index: number;
  name: string;
  role: ChordRole;
}

export type ChordType = "major";
