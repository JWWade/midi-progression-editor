import type { ScaleType } from "@/features/scale/types";

/**
 * Identifies a diatonic context: a root pitch-class (0–11) and a scale mode.
 *
 * This is the canonical shared type used by bridge suggestions, harmony
 * snapshots, score calculations, and any other feature that needs to resolve
 * diatonic membership.  Using `ScaleType` for `mode` (rather than `string`)
 * prevents unknown-mode strings from silently bypassing validation.
 */
export interface ScaleContext {
  /** Root pitch-class (0 = C, 1 = C♯/D♭, …, 11 = B). */
  root: number;
  /** Scale mode — must be one of the eight supported modes. */
  mode: ScaleType;
}
