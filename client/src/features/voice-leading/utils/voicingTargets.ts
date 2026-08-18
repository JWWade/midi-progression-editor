import type { Chord } from "@/features/current-chord/types";
import { CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import { normalizePitchClass } from "@/features/chord/utils/pitchClass";
import type { ChordExtension } from "@/features/chord/types";
import type { ExtensionRegisterPolicy } from "../types";

export interface VoicingTargets {
  rootPitchClass: number;
  pitchClasses: number[];
  /** Minimum interval above root in semitones for each target voice. */
  minSemitonesFromRoot: number[];
}

interface EnforceVoicingTargetsOptions {
  extensionRegisterPolicy?: ExtensionRegisterPolicy;
}

const EXTENSION_TO_SEMITONES: Readonly<Record<ChordExtension, number>> = {
  b9: 13,
  "9": 14,
  "#9": 15,
  "11": 17,
  "#11": 18,
  b13: 20,
  "13": 21,
};

const CUSTOM_EXTENSION_INTERVALS: Readonly<Record<number, number>> = {
  1: 13,
  2: 14,
  3: 15,
  5: 17,
  6: 18,
  8: 20,
  9: 21,
};

function mergePitchClassTargets(
  pitchClasses: number[],
  minSemitonesFromRoot: number[],
  pitchClass: number,
  minSemitones: number,
): void {
  const index = pitchClasses.indexOf(pitchClass);
  if (index === -1) {
    pitchClasses.push(pitchClass);
    minSemitonesFromRoot.push(minSemitones);
    return;
  }
  minSemitonesFromRoot[index] = Math.max(minSemitonesFromRoot[index] ?? 0, minSemitones);
}

function buildNamedChordTargets(chord: Chord): VoicingTargets {
  const intervals = CHORD_INTERVALS[chord.quality];
  const rootPitchClass = normalizePitchClass(chord.root);
  const pitchClasses: number[] = [];
  const minSemitonesFromRoot: number[] = [];

  for (const interval of intervals) {
    mergePitchClassTargets(
      pitchClasses,
      minSemitonesFromRoot,
      normalizePitchClass(rootPitchClass + interval),
      interval,
    );
  }

  for (const extension of chord.extensions ?? []) {
    const minSemitones = EXTENSION_TO_SEMITONES[extension];
    if (minSemitones === undefined) continue;
    mergePitchClassTargets(
      pitchClasses,
      minSemitonesFromRoot,
      normalizePitchClass(rootPitchClass + minSemitones),
      minSemitones,
    );
  }

  return { rootPitchClass, pitchClasses, minSemitonesFromRoot };
}

function buildCustomChordTargets(chord: Chord): VoicingTargets {
  const rootPitchClass = normalizePitchClass(chord.root);
  const customNotes = (chord.customNotes ?? []).map((note) => normalizePitchClass(note));
  const canonicalIntervals = new Set((CHORD_INTERVALS[chord.quality] ?? []).map((n) => normalizePitchClass(n)));
  const pitchClasses: number[] = [];
  const minSemitonesFromRoot: number[] = [];

  for (const note of customNotes) {
    const semitones = normalizePitchClass(note - rootPitchClass);
    const minSemitones = (!canonicalIntervals.has(semitones) && CUSTOM_EXTENSION_INTERVALS[semitones] !== undefined)
      ? CUSTOM_EXTENSION_INTERVALS[semitones]
      : semitones;
    mergePitchClassTargets(
      pitchClasses,
      minSemitonesFromRoot,
      note,
      minSemitones,
    );
  }

  for (const extension of chord.extensions ?? []) {
    const minSemitones = EXTENSION_TO_SEMITONES[extension];
    if (minSemitones === undefined) continue;
    const pitchClass = normalizePitchClass(rootPitchClass + minSemitones);
    const index = pitchClasses.indexOf(pitchClass);
    if (index !== -1) {
      minSemitonesFromRoot[index] = Math.max(minSemitonesFromRoot[index] ?? 0, minSemitones);
    }
  }

  return { rootPitchClass, pitchClasses, minSemitonesFromRoot };
}

function nearestMidiWithPitchClass(referenceMidi: number, pitchClass: number): number {
  const k = Math.round((referenceMidi - pitchClass) / 12);
  const base = 12 * k + pitchClass;
  const candidates = [base - 12, base, base + 12];
  let best = candidates[0];
  for (const candidate of candidates) {
    if (Math.abs(candidate - referenceMidi) < Math.abs(best - referenceMidi)) {
      best = candidate;
    }
  }
  return best;
}

/**
 * Ensures voices that represent upper extensions (9/11/13 and alterations)
 * remain above the octave of the root.
 */
export function enforceVoicingTargets(
  voicing: number[],
  targets: VoicingTargets,
  options: EnforceVoicingTargetsOptions = {},
): number[] {
  if (options.extensionRegisterPolicy === "relaxed") {
    return voicing;
  }

  if (voicing.length === 0 || targets.pitchClasses.length === 0) {
    return voicing;
  }

  const rootReference = nearestMidiWithPitchClass(voicing[0] ?? 60, targets.rootPitchClass);
  return voicing.map((midi, index) => {
    const minSemitones = targets.minSemitonesFromRoot[index] ?? 0;
    if (minSemitones <= 0) {
      return midi;
    }

    const minimumMidi = rootReference + minSemitones;
    let adjusted = midi;
    while (adjusted < minimumMidi) {
      adjusted += 12;
    }
    return adjusted;
  });
}

export function hasExtensionRegisterTargets(targets: VoicingTargets): boolean {
  return targets.minSemitonesFromRoot.some((semitones) => semitones >= 13);
}

export function buildVoicingTargets(chord: Chord): VoicingTargets {
  if (Array.isArray(chord.customNotes) && chord.customNotes.length > 0) {
    return buildCustomChordTargets(chord);
  }
  return buildNamedChordTargets(chord);
}
