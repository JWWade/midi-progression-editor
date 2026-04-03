import type { ChordType } from "../types";
import { CHORD_INTERVALS } from "./transpose";
import {
  dedupeNormalizedPitchClasses,
  normalizePitchClass,
} from "./pitchClass";

export interface ChordIdentityMatch {
  root: number;
  quality: ChordType;
  matchScore: number;
}

const ALL_QUALITIES = Object.keys(CHORD_INTERVALS) as ChordType[];

function scoreQualityAgainstNotes(
  normalizedNotes: readonly number[],
  noteSet: ReadonlySet<number>,
  root: number,
  quality: ChordType,
): number {
  const chordNotes = CHORD_INTERVALS[quality].map((interval) =>
    normalizePitchClass(root + interval),
  );
  const intersection = chordNotes.filter((n) => noteSet.has(n)).length;
  const union = new Set([...normalizedNotes, ...chordNotes]).size;
  return union === 0 ? 0 : intersection / union;
}

export function findBestQualityForRoot(
  noteIndices: readonly number[],
  root: number,
  qualityPool: readonly ChordType[] = ALL_QUALITIES,
): { quality: ChordType; matchScore: number } {
  const normalizedNotes = dedupeNormalizedPitchClasses(noteIndices);
  const noteSet = new Set(normalizedNotes);

  const pool = qualityPool.length > 0 ? qualityPool : ALL_QUALITIES;
  let bestQuality: ChordType = pool[0] ?? "major";
  let bestScore = 0;

  for (const quality of pool) {
    const score = scoreQualityAgainstNotes(normalizedNotes, noteSet, root, quality);
    if (score > bestScore) {
      bestScore = score;
      bestQuality = quality;
    }
  }

  return { quality: bestQuality, matchScore: bestScore };
}

export function findBestChordIdentity(
  noteIndices: readonly number[],
  qualityPool: readonly ChordType[] = ALL_QUALITIES,
): ChordIdentityMatch {
  let bestRoot = 0;
  let bestQuality: ChordType = (qualityPool[0] ?? "major") as ChordType;
  let bestScore = 0;

  for (let root = 0; root < 12; root++) {
    const { quality, matchScore } = findBestQualityForRoot(noteIndices, root, qualityPool);
    if (matchScore > bestScore) {
      bestScore = matchScore;
      bestRoot = root;
      bestQuality = quality;
    }
  }

  return { root: bestRoot, quality: bestQuality, matchScore: bestScore };
}
