import type { ChordNoteInfo, ChordType } from "../types";
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

export interface ChordCandidate {
  root: number;
  quality: ChordType;
  score: number;
  missingRoles: ChordNoteInfo["role"][];
  extraNotes: number[];
}

const ALL_QUALITIES = Object.keys(CHORD_INTERVALS) as ChordType[];

// Role assignment per chord type — mirrors the ROLES_OVERRIDE logic in transpose.ts
const DEFAULT_CHORD_ROLES: ChordNoteInfo["role"][] = ["root", "third", "fifth", "seventh"];
const CHORD_ROLES_OVERRIDE: Partial<Record<ChordType, ChordNoteInfo["role"][]>> = {
  sus2:     ["root", "second", "fifth"],
  maj6:     ["root", "third", "fifth", "sixth"],
  min6:     ["root", "third", "fifth", "sixth"],
  dom7sus4: ["root", "fourth", "fifth", "seventh"],
};
// All current chord types have at most 4 tones; "seventh" is the correct default
// for any additional tones that exceed DEFAULT_CHORD_ROLES length.
const DEFAULT_CHORD_ROLE: ChordNoteInfo["role"] = "seventh";

const TONE_WEIGHTS: Record<ChordNoteInfo["role"], number> = {
  root:    1.0,
  third:   1.0,
  seventh: 0.9,
  sixth:   0.9,
  fifth:   0.4,
  second:  0.85,
  fourth:  0.85,
};

const EXTRA_NOTE_PENALTY = 0.5;

function getRoles(quality: ChordType): ChordNoteInfo["role"][] {
  const override = CHORD_ROLES_OVERRIDE[quality];
  const baseRoles = override ?? DEFAULT_CHORD_ROLES;
  const intervalCount = CHORD_INTERVALS[quality].length;
  const roles: ChordNoteInfo["role"][] = [];
  for (let i = 0; i < intervalCount; i++) {
    roles.push(baseRoles[i] ?? DEFAULT_CHORD_ROLE);
  }
  return roles;
}

function scoreQualityWeighted(
  normalizedNotes: readonly number[],
  noteSet: ReadonlySet<number>,
  root: number,
  quality: ChordType,
): { score: number; missingRoles: ChordNoteInfo["role"][]; extraNotes: number[] } {
  const intervals = CHORD_INTERVALS[quality];
  const roles = getRoles(quality);

  const chordNotes = intervals.map((interval, i) => ({
    pitchClass: normalizePitchClass(root + interval),
    role: roles[i] ?? DEFAULT_CHORD_ROLE,
  }));

  const chordNoteSet = new Set(chordNotes.map((n) => n.pitchClass));

  let matchedWeight = 0;
  let totalWeight = 0;
  const missingRoles: ChordNoteInfo["role"][] = [];

  for (const { pitchClass, role } of chordNotes) {
    const w = TONE_WEIGHTS[role];
    totalWeight += w;
    if (noteSet.has(pitchClass)) {
      matchedWeight += w;
    } else {
      missingRoles.push(role);
    }
  }

  const extraNotes = normalizedNotes.filter((n) => !chordNoteSet.has(n));
  const extraPenalty = EXTRA_NOTE_PENALTY * extraNotes.length;

  const rawScore = totalWeight === 0 ? 0 : (matchedWeight - extraPenalty) / totalWeight;
  const score = Math.max(0, Math.min(1, rawScore));

  return { score, missingRoles, extraNotes };
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
    const { score } = scoreQualityWeighted(normalizedNotes, noteSet, root, quality);
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

export function findChordCandidates(
  noteIndices: readonly number[],
  options?: {
    qualityPool?: readonly ChordType[];
    limit?: number;
    minScore?: number;
  },
): ChordCandidate[] {
  const normalizedNotes = dedupeNormalizedPitchClasses(noteIndices);
  const noteSet = new Set(normalizedNotes);

  const qualityPool = options?.qualityPool ?? ALL_QUALITIES;
  const limit = options?.limit ?? 5;
  const minScore = options?.minScore ?? 0.3;

  const candidates: ChordCandidate[] = [];

  for (let root = 0; root < 12; root++) {
    for (const quality of qualityPool) {
      const { score, missingRoles, extraNotes } = scoreQualityWeighted(
        normalizedNotes,
        noteSet,
        root,
        quality,
      );
      if (score >= minScore) {
        candidates.push({ root, quality, score, missingRoles, extraNotes });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit);
}
