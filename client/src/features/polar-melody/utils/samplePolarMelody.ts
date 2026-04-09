import { getScaleNotes } from "@/features/scale/utils";
import type { ScaleType } from "@/features/scale/types";

export interface PolarMelodyParams {
  /** Constant offset (default 1.0) */
  A: number;
  /** Amplitude (default 1.0) */
  B: number;
  /** Angular frequency — integer ≥ 1 (default 4) */
  k: number;
  /** Number of steps: 4 | 8 | 16 | 32 (default 16) */
  N: number;
  /** Key root pitch class 0–11 */
  keyRoot: number;
  /** Scale/mode type */
  keyScale: ScaleType;
}

export const POLAR_MELODY_PRESETS = {
  rose:      { label: "Rose",      A: 1, B: 1, k: 4  },
  limacon:   { label: "Limaçon",   A: 2, B: 1, k: 1  },
  butterfly: { label: "Butterfly", A: 1, B: 1, k: 6  },
  complex:   { label: "Complex",   A: 1, B: 1, k: 10 },
} as const;

export type PolarMelodyPresetKey = keyof typeof POLAR_MELODY_PRESETS;

/**
 * Samples a polar equation r = A + B·sin(k·θ) at N evenly spaced angles,
 * normalises the r values to [0, 1], and maps them to scale degree indices.
 *
 * Returns an array of N pitch classes (0–11), all diatonic to keyRoot/keyScale.
 */
export function samplePolarMelody(params: PolarMelodyParams): number[] {
  const { A, B, k, N, keyRoot, keyScale } = params;
  const scaleNotes = getScaleNotes(keyRoot, keyScale);
  const lastIndex = scaleNotes.length - 1;

  // Step 1: Sample r_i = A + B·sin(k·θ_i), θ_i = 2π·i/N
  const rValues: number[] = [];
  for (let i = 0; i < N; i++) {
    const theta = (2 * Math.PI * i) / N;
    rValues.push(A + B * Math.sin(k * theta));
  }

  // Step 2: Normalise to [0, 1]
  const rMin = Math.min(...rValues);
  const rMax = Math.max(...rValues);
  const range = rMax - rMin;

  const rNorm = rValues.map((r) => (range === 0 ? 0 : (r - rMin) / range));

  // Step 3: Quantise to scale degree indices
  return rNorm.map((rn) => {
    const degreeIndex = Math.round(rn * lastIndex);
    return scaleNotes[degreeIndex]!;
  });
}
