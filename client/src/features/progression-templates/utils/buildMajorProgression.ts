import type { Chord } from "@/features/current-chord/types";
import type { ScaleType } from "@/features/scale/types";
import { buildDiatonicChordOptions } from "@/features/scale/utils";

export interface ProgressionTemplateResult {
  readonly chords: Chord[];
  readonly supported: boolean;
}

function buildMajorTriadProgressionFromDegrees(
  root: number,
  scale: ScaleType,
  degreeIndices: readonly number[],
): ProgressionTemplateResult {
  if (scale !== "major") {
    return { chords: [], supported: false };
  }

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
 * v1 intentionally supports only major mode.
 */
export function buildMajorTwoFiveOne(root: number, scale: ScaleType): ProgressionTemplateResult {
  // Scale degrees: ii, V, I
  return buildMajorTriadProgressionFromDegrees(root, scale, [1, 4, 0]);
}

/**
 * Builds a triad-only I-IV-V progression for the active key context.
 * v1 intentionally supports only major mode.
 */
export function buildMajorOneFourFive(root: number, scale: ScaleType): ProgressionTemplateResult {
  // Scale degrees: I, IV, V
  return buildMajorTriadProgressionFromDegrees(root, scale, [0, 3, 4]);
}
