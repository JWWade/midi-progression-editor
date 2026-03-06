import type { ChordType } from "@/features/chord/types";

export interface Chord {
  root: number;
  quality: ChordType;
  extensions?: string[];
}
