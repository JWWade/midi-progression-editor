export { getDiatonicIndices, DIATONIC_OPACITY, CHROMATIC_OPACITY } from "./scaleUtils";
export { calculatePolygonPoints, CHORD_SHAPES } from "./geometry";
export type { Point, ChordShape } from "./geometry";

export const PITCH_CLASSES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;
