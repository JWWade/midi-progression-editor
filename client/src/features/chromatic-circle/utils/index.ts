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

export const FLAT_PITCH_CLASSES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;
