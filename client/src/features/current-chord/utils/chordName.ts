import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import { getChordName } from "@/features/chord/data/chordNames";
import { findBestQualityForRoot } from "@/features/chord/utils/chordIdentity";
import { rerootChord } from "@/features/chord/utils/rerootChord";
import { CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import {
  dedupeNormalizedPitchClasses,
} from "@/features/chord/utils/pitchClass";
import type { ChordType } from "@/features/chord/types";
import type { Chord } from "../types";
import type { PrimitiveShape } from "../types";

export const PRIMITIVE_SHAPE_LABELS: Record<PrimitiveShape, string> = {
  "equilateral-triangle": "Equilateral Triangle",
  "suspended-triangle": "sus4",
  square: "Diminished",
  rectangle: "Dominant 7",
  "symmetrical-trapezoid": "Major 7",
};

export const CHORD_QUALITY_LABELS: Record<ChordType, string> = {
  major: "Major",
  minor: "Minor",
  dim:   "Diminished",
  aug:   "Augmented",
  sus2:  "Suspended 2",
  dom7: "Dominant 7",
  maj7: "Major 7",
  maj6: "Major 6",
  min7: "Minor 7",
  halfdim7: "Half-dim 7",
  quartal: "Quartal",
};

export interface ResolvedChordIdentity {
  root: number;
  quality: ChordType;
}

function inferBestQualityForCardinality(
  noteIndices: readonly number[],
  root: number,
): ChordType {
  const normalized = dedupeNormalizedPitchClasses(noteIndices);
  const noteSet = new Set(normalized);
  const noteCount = noteSet.size;

  const allQualities = Object.keys(CHORD_INTERVALS) as ChordType[];
  const candidates = allQualities.filter(
    (quality) => CHORD_INTERVALS[quality].length === noteCount,
  );
  const pool = candidates.length > 0 ? candidates : allQualities;
  return findBestQualityForRoot([...noteSet], root, pool).quality;
}

export function resolveChordIdentity(chord: Chord): ResolvedChordIdentity {
  if (Array.isArray(chord.customNotes) && chord.customNotes.length > 0) {
    const { root, quality, matchScore } = rerootChord(chord.customNotes, chord.root);

    // Only accept reroot quality as authoritative when the note set is an
    // exact structural match. Otherwise, choose the best quality within the
    // same chord cardinality to avoid misleading labels (e.g. 4-note -> quartal).
    if (matchScore === 1) {
      return { root, quality };
    }

    return {
      root,
      quality: inferBestQualityForCardinality(chord.customNotes, root),
    };
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
