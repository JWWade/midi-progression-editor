import type { Chord } from "@/features/current-chord/types";

/**
 * Defines the reflection axis for a negative harmony transform.
 *
 * The tonic–dominant axis is the musically canonical default: it places the
 * axis centre at `tonicRoot + 3.5` semitones, exactly halfway between the
 * tonic (pitch class `tonicRoot`) and its perfect fifth (`tonicRoot + 7`).
 *
 * A user-defined axis overrides the computed centre with an explicit
 * (possibly fractional) pitch-class value, enabling modal or non-functional
 * contexts.
 *
 * @example
 * // C major default axis (centre = 3.5, halfway between C=0 and G=7)
 * const axis: Axis = { type: "tonic-dominant", tonicRoot: 0 };
 *
 * @example
 * // Custom axis centred on D (pitch-class 2)
 * const axis: Axis = { type: "custom", centre: 2 };
 */
export type Axis =
  | {
      type: "tonic-dominant";
      /** Tonic pitch-class (0 = C … 11 = B). */
      tonicRoot: number;
    }
  | {
      type: "custom";
      /**
       * Explicit axis centre in pitch-class space.
       * Fractional values are valid (e.g. 3.5 = between Eb and E).
       */
      centre: number;
    };

/**
 * Controls which portion of the progression a negative harmony transform
 * is applied to.
 *
 * - `"chord"` — transform a single chord in isolation.
 * - `"progression"` — transform every chord in the progression.
 * - `"region"` — transform only the chords whose indices fall within
 *   `[startIndex, endIndex]` (inclusive).
 */
export type TransformScope =
  | { type: "chord" }
  | { type: "progression" }
  | { type: "region"; startIndex: number; endIndex: number };

/**
 * The result of applying a negative harmony transform to a single chord.
 *
 * `matchScore` is the Jaccard similarity (0–1) between the reflected pitch
 * classes and the nearest named chord.  A score of 1 indicates an exact
 * match; lower scores signal an enharmonically ambiguous or non-tertian
 * result that may benefit from manual reinterpretation.
 */
export interface NegativeHarmonyResult {
  /** The reflected chord (root + quality derived from reflected pitch classes). */
  chord: Chord;
  /** Raw reflected pitch classes before chord identification. */
  reflectedPitchClasses: number[];
  /**
   * Jaccard similarity score of the reflected pitch classes against the
   * nearest named chord (0 = no match, 1 = exact match).
   */
  matchScore: number;
}
