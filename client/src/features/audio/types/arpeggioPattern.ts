/**
 * Arpeggio direction — determines the order in which chord tones are played.
 *
 * - "up"      : lowest pitch first (ascending)
 * - "down"    : highest pitch first (descending)
 * - "up-down" : ascend then descend (inner notes repeated once)
 * - "random"  : shuffled each time
 */
export type ArpeggioDirection = "up" | "down" | "up-down" | "random";

/**
 * Rhythmic subdivision of each arpeggiated note relative to a beat.
 *
 * - "quarter"   : 1 beat per note
 * - "eighth"    : ½ beat per note
 * - "sixteenth" : ¼ beat per note
 * - "triplet"   : ⅓ beat per note
 */
export type ArpeggioSubdivision = "quarter" | "eighth" | "sixteenth" | "triplet";

/** Full arpeggio pattern configuration. */
export interface ArpeggioPattern {
  /** Order in which chord tones are played. */
  direction: ArpeggioDirection;
  /** Rhythmic subdivision for each arpeggiated note. */
  subdivision: ArpeggioSubdivision;
  /** Swing percentage: 0 = straight, 100 = maximum swing (≈ dotted-eighth feel). */
  swingPercent: number;
  /** Number of times to repeat the direction pattern within a single chord. 1–4. */
  repeats: number;
}

export const DEFAULT_ARPEGGIO_PATTERN: ArpeggioPattern = {
  direction: "up",
  subdivision: "eighth",
  swingPercent: 0,
  repeats: 1,
};

export const ARPEGGIO_DIRECTION_LABELS: Record<ArpeggioDirection, string> = {
  up: "Up ↑",
  down: "Down ↓",
  "up-down": "Up–Down ⇅",
  random: "Random ⁑",
};

export const ARPEGGIO_SUBDIVISION_LABELS: Record<ArpeggioSubdivision, string> = {
  quarter: "Quarter (♩)",
  eighth: "Eighth (♪)",
  sixteenth: "Sixteenth (𝅘𝅥𝅯)",
  triplet: "Triplet (♩³)",
};
