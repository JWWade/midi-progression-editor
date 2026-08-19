import type { Chord } from "@/features/current-chord/types";
import type { ScaleType } from "@/features/scale/types";
import { buildDiatonicChordOptions } from "@/features/scale/utils";

export interface ProgressionTemplateResult {
  readonly chords: Chord[];
  readonly supported: boolean;
}

function buildTriadProgressionFromDegrees(
  root: number,
  scale: ScaleType,
  degreeIndices: readonly number[],
): ProgressionTemplateResult {
  const options = buildDiatonicChordOptions(root, scale);
  const chords: Chord[] = degreeIndices
    .map((degreeIndex) => options[degreeIndex]?.chord)
    .filter((chord): chord is Chord => chord !== undefined)
    .map((chord) => ({ root: chord.root, quality: chord.quality }));

  return {
    chords,
    supported: chords.length === degreeIndices.length,
  };
}

/**
 * Builds a triad-only ii-V-I progression for the active key context.
 * Degree mapping is interpreted relative to the currently selected mode.
 */
export function buildMajorTwoFiveOne(root: number, scale: ScaleType): ProgressionTemplateResult {
  // Scale degrees: ii, V, I
  return buildTriadProgressionFromDegrees(root, scale, [1, 4, 0]);
}

/**
 * Builds a triad-only I-IV-V progression for the active key context.
 * Degree mapping is interpreted relative to the currently selected mode.
 */
export function buildMajorOneFourFive(root: number, scale: ScaleType): ProgressionTemplateResult {
  // Scale degrees: I, IV, V
  return buildTriadProgressionFromDegrees(root, scale, [0, 3, 4]);
}

/**
 * Builds a triad-only I-V-vi-IV progression for the active key context.
 * Degree mapping is interpreted relative to the currently selected mode.
 */
export function buildMajorOneFiveSixFour(root: number, scale: ScaleType): ProgressionTemplateResult {
  // Scale degrees: I, V, vi, IV
  return buildTriadProgressionFromDegrees(root, scale, [0, 4, 5, 3]);
}
