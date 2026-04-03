import { findNearestChord } from "@/features/chord/utils/findNearestChord";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";
import type { Chord } from "@/features/current-chord/types";
import type { Axis, NegativeHarmonyResult } from "../types";

/**
 * Resolves an {@link Axis} to its numeric centre in pitch-class space.
 *
 * For the canonical tonic–dominant axis the centre sits exactly halfway
 * between the tonic and its perfect fifth:
 *
 * ```
 * centre = tonicRoot + 3.5
 * ```
 *
 * A custom axis returns its explicit `centre` value unchanged.
 *
 * @param axis - The axis descriptor.
 * @returns Axis centre as a (possibly fractional) pitch-class value.
 */
export function resolveAxisCentre(axis: Axis): number {
  if (axis.type === "tonic-dominant") {
    // Midpoint between tonic (root) and dominant (root + 7):
    //   centre = root + 7/2 = root + 3.5
    return axis.tonicRoot + 3.5;
  }
  return axis.centre;
}

/**
 * Reflects a single pitch class across the given axis centre.
 *
 * The reflection of pitch class `p` across axis centre `a` is:
 *
 * ```
 * p' = (2a − p) mod 12
 * ```
 *
 * @param pitchClass - Input pitch class (0–11).
 * @param axisCentre - Axis centre in pitch-class space (may be fractional).
 * @returns Reflected pitch class (integer in 0–11).
 */
export function reflectPitchClass(pitchClass: number, axisCentre: number): number {
  return ((2 * axisCentre - pitchClass) % 12 + 12) % 12;
}

/**
 * Reflects an array of pitch classes across the given axis.
 *
 * Each pitch class is independently mapped via {@link reflectPitchClass}.
 * The result is deduplicated and sorted in ascending order.
 *
 * @param pitchClasses - Input pitch classes (0–11 each).
 * @param axis         - The reflection axis descriptor.
 * @returns Sorted, deduplicated array of reflected pitch classes.
 *
 * @example
 * // C major [0, 4, 7] in C major (axis centre = 3.5) → C minor [0, 3, 7]
 * reflectPitchClasses([0, 4, 7], { type: "tonic-dominant", tonicRoot: 0 });
 * // → [0, 3, 7]
 */
export function reflectPitchClasses(pitchClasses: number[], axis: Axis): number[] {
  const centre = resolveAxisCentre(axis);
  const reflected = pitchClasses.map((p) => reflectPitchClass(p, centre));
  const deduped = [...new Set(reflected)];
  return deduped.sort((a, b) => a - b);
}

/**
 * Applies a negative harmony transform to a single chord and reidentifies
 * the result as the nearest named chord.
 *
 * The transform:
 * 1. Derives pitch classes from the chord's `root` + `quality` (or
 *    `customNotes` when present).
 * 2. Reflects every pitch class across the axis.
 * 3. Runs {@link findNearestChord} to label the result.
 *
 * @param chord - The source chord to transform.
 * @param axis  - The reflection axis descriptor.
 * @returns A {@link NegativeHarmonyResult} containing the reflected chord,
 *          raw pitch classes, and a match-quality score.
 */
export function applyNegativeHarmonyToChord(
  chord: Chord,
  axis: Axis,
): NegativeHarmonyResult {
  // Resolve source pitch classes
  let sourcePcs: number[];
  if (chord.customNotes && chord.customNotes.length > 0) {
    sourcePcs = chord.customNotes;
  } else {
    sourcePcs = getChordNoteIndices(chord.root, chord.quality);
  }

  const reflected = reflectPitchClasses(sourcePcs, axis);
  const nearest = findNearestChord(reflected);

  return {
    chord: { root: nearest.root, quality: nearest.quality },
    reflectedPitchClasses: reflected,
    matchScore: nearest.matchScore,
  };
}

/**
 * Applies a negative harmony transform to every chord in an ordered
 * progression and returns the reflected progression.
 *
 * @param chords - Ordered array of chords (the progression).
 * @param axis   - The reflection axis descriptor.
 * @returns Array of {@link NegativeHarmonyResult} — one entry per input chord,
 *          in the same order.
 *
 * @example
 * // ii–V–I in C major → reflected progression
 * const axis: Axis = { type: "tonic-dominant", tonicRoot: 0 };
 * const chords: Chord[] = [
 *   { root: 2, quality: "min7"  },  // Dm7
 *   { root: 7, quality: "dom7"  },  // G7
 *   { root: 0, quality: "major" },  // Cmaj
 * ];
 * applyNegativeHarmony(chords, axis);
 */
export function applyNegativeHarmony(
  chords: Chord[],
  axis: Axis,
): NegativeHarmonyResult[] {
  return chords.map((chord) => applyNegativeHarmonyToChord(chord, axis));
}
