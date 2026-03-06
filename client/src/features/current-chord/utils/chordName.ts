import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ChordType } from "@/features/chord/types";
import type { Chord } from "../types";

export const CHORD_QUALITY_LABELS: Record<ChordType, string> = {
  major: "Major",
  minor: "Minor",
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
