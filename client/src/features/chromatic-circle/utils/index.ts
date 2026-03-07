export { getDiatonicIndices, DIATONIC_OPACITY, CHROMATIC_OPACITY } from "./scaleUtils";
export { calculatePolygonPoints } from "./geometry";
export type { Point } from "./geometry";

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
