import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ChordType } from "@/features/chord/types";
import type { Chord } from "../types";
import type { PrimitiveShape } from "../types";

export const PRIMITIVE_SHAPE_LABELS: Record<PrimitiveShape, string> = {
  "equilateral-triangle": "Equilateral Triangle",
  "suspended-triangle": "sus4",
  square: "Square",
  rectangle: "Rectangle",
};

export const CHORD_QUALITY_LABELS: Record<ChordType, string> = {
  major: "Major",
  minor: "Minor",
  dim:   "Diminished",
  aug:   "Augmented",
  dom7: "Dominant 7",
  maj7: "Major 7",
  min7: "Minor 7",
  halfdim7: "Half-dim 7",
};

export function formatChordName(chord: Chord): string {
  const root = PITCH_CLASSES[chord.root];
  const quality = CHORD_QUALITY_LABELS[chord.quality];
  if (chord.extensions && chord.extensions.length > 0) {
    return `${root} ${quality} (${chord.extensions.join(", ")})`;
  }
  return `${root} ${quality}`;
}

export function formatPrimitiveChordName(chord: Chord): string {
  if (!chord.primitiveShape) return formatChordName(chord);
  return `${PITCH_CLASSES[chord.root]} ${PRIMITIVE_SHAPE_LABELS[chord.primitiveShape]}`;
}
