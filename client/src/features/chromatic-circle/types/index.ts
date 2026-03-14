import type { ChordType } from "@/features/chord/types";
import type { PrimitiveShape } from "@/features/current-chord";

export interface NoteInfo {
  midi: number;
  name: string;
}

export interface CustomChordState {
  root: number;
  quality: ChordType;
  customNotes: number[];
  primitiveShape?: PrimitiveShape;
}
