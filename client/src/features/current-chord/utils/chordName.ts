import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import { getChordName } from "@/features/chord/data/chordNames";
import { findBestQualityForRoot, findChordCandidates } from "@/features/chord/utils/chordIdentity";
import { rerootChord } from "@/features/chord/utils/rerootChord";
import { CHORD_INTERVALS, getChordNoteIndices } from "@/features/chord/utils/transpose";
import { dedupeNormalizedPitchClasses } from "@/features/chord/utils/pitchClass";
import { SEVENTH_CHORD_TYPES, type ChordType, type ChordExtension } from "@/features/chord/types";
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
  sus2:  "sus2",
  dom7: "Dominant 7",
  dom7sus4: "Dom 7 Sus4",
  maj7: "Major 7",
  maj6: "Major 6",
  min6: "Minor 6",
  min7: "Minor 7",
  minmaj7:  "Minor-Major 7",
  halfdim7: "Half-dim 7",
  quartal: "Quartal",
};

export interface ResolvedChordIdentity {
  root: number;
  quality: ChordType;
  /** Extra notes in the custom pitch set that aren't part of the canonical
   *  chord tones, expressed as standard extension labels (b9, 9, #9, etc.). */
  extensions?: ChordExtension[];
}

/**
 * Maps an interval in semitones (1–11) to its extension label.
 * Only intervals that map to a valid {@link ChordExtension} are included;
 * semitones with no standard extension name (e.g. P5 = 7, m6 = 8, M6 = 9)
 * are omitted. b13/13 are excluded here because they more naturally belong to
 * seventh-chord voicings and would produce noisy labels on basic triads.
 */
const SEMITONE_TO_EXTENSION: Readonly<Partial<Record<number, ChordExtension>>> = {
  1:  "b9",
  2:  "9",
  3:  "#9",
  5:  "11",
  6:  "#11",
};

/**
 * Computes extension labels for notes in `customNotes` that lie outside the
 * canonical tones of `root + quality`.  Only intervals with a defined
 * {@link ChordExtension} label are returned; unrecognised intervals are omitted.
 */
function getChordExtensions(
  customNotes: readonly number[],
  root: number,
  quality: ChordType,
): ChordExtension[] {
  const canonicalTones = new Set(getChordNoteIndices(root, quality));
  const normalized = dedupeNormalizedPitchClasses(customNotes);
  return normalized
    .filter((n) => !canonicalTones.has(n))
    .map((n) => ((n - root) + 12) % 12)
    .filter((interval): interval is keyof typeof SEMITONE_TO_EXTENSION => interval in SEMITONE_TO_EXTENSION)
    .sort((a, b) => a - b)
    .map((interval) => SEMITONE_TO_EXTENSION[interval]!);
}

function inferBestQualityForCardinality(
  noteIndices: readonly number[],
  root: number,
  excludeQuartal = false,
): ChordType {
  const normalized = dedupeNormalizedPitchClasses(noteIndices);
  const noteSet = new Set(normalized);
  const noteCount = noteSet.size;

  const allQualities = (Object.keys(CHORD_INTERVALS) as ChordType[]).filter(
    (q) => !excludeQuartal || q !== "quartal",
  );
  const candidates = allQualities.filter(
    (quality) => CHORD_INTERVALS[quality].length === noteCount,
  );
  const pool = candidates.length > 0 ? candidates : allQualities;
  return findBestQualityForRoot([...noteSet], root, pool).quality;
}

function maybePreferOrderedRootInterpretation(
  customNotes: readonly number[],
  inferredRoot: number,
  inferredQuality: ChordType,
): ResolvedChordIdentity | null {
  const orderedRoot = dedupeNormalizedPitchClasses([customNotes[0] ?? inferredRoot])[0] ?? inferredRoot;
  if (orderedRoot === inferredRoot) {
    return null;
  }

  const candidates = findChordCandidates(customNotes, { limit: 24, minScore: 0.2 });
  const inferredCandidate = candidates.find(
    (candidate) => candidate.root === inferredRoot && candidate.quality === inferredQuality,
  );
  const orderedRootCandidate = candidates.find((candidate) => candidate.root === orderedRoot);

  if (!inferredCandidate || !orderedRootCandidate) {
    return null;
  }

  const orderedExtensions = getChordExtensions(customNotes, orderedRootCandidate.root, orderedRootCandidate.quality);
  const isTriadicOrderedQuality = !SEVENTH_CHORD_TYPES.has(orderedRootCandidate.quality);
  const inferredIsWeakSeventh =
    SEVENTH_CHORD_TYPES.has(inferredCandidate.quality) &&
    inferredCandidate.missingRoles.includes("third");
  const orderedIsStableTriadPlusExtension =
    isTriadicOrderedQuality &&
    orderedRootCandidate.missingRoles.length === 1 &&
    orderedRootCandidate.missingRoles[0] === "fifth" &&
    orderedExtensions.length > 0;

  if (inferredIsWeakSeventh && orderedIsStableTriadPlusExtension) {
    return {
      root: orderedRootCandidate.root,
      quality: orderedRootCandidate.quality,
      extensions: orderedExtensions,
    };
  }

  return null;
}

export function resolveChordIdentity(chord: Chord): ResolvedChordIdentity {
  if (Array.isArray(chord.customNotes) && chord.customNotes.length > 0) {
    const { root, quality, matchScore } = rerootChord(chord.customNotes, chord.root);

    const orderedRootInterpretation = maybePreferOrderedRootInterpretation(
      chord.customNotes,
      root,
      quality,
    );
    if (orderedRootInterpretation) {
      return orderedRootInterpretation;
    }

    // Quartal is a very deliberate, open-voiced sonority. Only label as quartal
    // when the pitch set is an exact match (all quartal tones present, no
    // extra notes). Any deviation should fall back to a conventional quality.
    if (quality === "quartal" && matchScore < 1) {
      const fallback = inferBestQualityForCardinality(chord.customNotes, root, true);
      return {
        root,
        quality: fallback,
        extensions: getChordExtensions(chord.customNotes, root, fallback),
      };
    }

    const extensions = getChordExtensions(chord.customNotes, root, quality);
    return { root, quality, extensions: extensions.length > 0 ? extensions : undefined };
  }

  return { root: chord.root, quality: chord.quality };
}

export function formatChordSymbol(
  chord: Chord,
  pitchClasses: readonly string[] = PITCH_CLASSES,
): string {
  const { root, quality, extensions } = resolveChordIdentity(chord);
  const base = getChordName(root, quality, pitchClasses);
  if (extensions && extensions.length > 0) {
    return `${base}(${extensions.join(",")})`;
  }
  return base;
}

export function formatChordName(
  chord: Chord,
  pitchClasses: readonly string[] = PITCH_CLASSES,
): string {
  const { root, quality, extensions } = resolveChordIdentity(chord);
  const rootLabel = pitchClasses[root];
  const qualityLabel = CHORD_QUALITY_LABELS[quality];
  const base = `${rootLabel} ${qualityLabel}`;

  if (!Array.isArray(chord.customNotes) && chord.extensions && chord.extensions.length > 0) {
    return `${base} (${chord.extensions.join(", ")})`;
  }

  if (extensions && extensions.length > 0) {
    return `${base} (add ${extensions.join(", ")})`;
  }

  return base;
}

export function formatPrimitiveChordName(
  chord: Chord,
  pitchClasses: readonly string[] = PITCH_CLASSES,
): string {
  if (!chord.primitiveShape) return formatChordName(chord, pitchClasses);
  return `${pitchClasses[chord.root]} ${PRIMITIVE_SHAPE_LABELS[chord.primitiveShape]}`;
}
