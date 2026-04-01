import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import { getChordName } from "@/features/chord/data/chordNames";
import { rerootChord } from "@/features/chord/utils/rerootChord";
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
  quartal: "Quartal",
};

export interface ResolvedChordIdentity {
  root: number;
  quality: ChordType;
}

export function resolveChordIdentity(chord: Chord): ResolvedChordIdentity {
  if (Array.isArray(chord.customNotes) && chord.customNotes.length > 0) {
    const { root, quality } = rerootChord(chord.customNotes, chord.root);
    return { root, quality };
  }

  return { root: chord.root, quality: chord.quality };
}

export function formatChordSymbol(
  chord: Chord,
  pitchClasses: readonly string[] = PITCH_CLASSES,
): string {
  const { root, quality } = resolveChordIdentity(chord);
  return getChordName(root, quality, pitchClasses);
}

export function formatChordName(
  chord: Chord,
  pitchClasses: readonly string[] = PITCH_CLASSES,
): string {
  const { root, quality } = resolveChordIdentity(chord);
  const rootLabel = pitchClasses[root];
  const qualityLabel = CHORD_QUALITY_LABELS[quality];

  if (!Array.isArray(chord.customNotes) && chord.extensions && chord.extensions.length > 0) {
    return `${rootLabel} ${qualityLabel} (${chord.extensions.join(", ")})`;
  }

  return `${rootLabel} ${qualityLabel}`;
}

export function formatPrimitiveChordName(
  chord: Chord,
  pitchClasses: readonly string[] = PITCH_CLASSES,
): string {
  if (!chord.primitiveShape) return formatChordName(chord, pitchClasses);
  return `${pitchClasses[chord.root]} ${PRIMITIVE_SHAPE_LABELS[chord.primitiveShape]}`;
}
