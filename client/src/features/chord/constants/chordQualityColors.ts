import type { ChordType } from "@/features/chord/types";

/**
 * Per-quality color family used as the system-wide visual grammar for chord
 * types throughout the UI (chromatic circle, current-chord panel, progression
 * tiles, etc.).
 */
export interface ChordQualityColor {
  /** Solid accent color — used for filled note nodes, polygon strokes, and buttons. */
  base: string;
  /**
   * Semi-transparent fill — used for polygon interior fills.
   * Derived from `base` with low opacity so the circle background shows through.
   */
  fill: string;
  /** Very light tint — used for panel backgrounds and surface tints. */
  light: string;
  /** Dark shade — used for text rendered on light-tinted backgrounds. */
  dark: string;
  /**
   * Deeper shade — 15–20 percentage points more saturated and slightly darker
   * than `base`.  Used for seventh-chord intensity (Tier 2).
   */
  deeper: string;
  /**
   * Richest shade — 25–35 percentage points more saturated and/or noticeably
   * darker than `base`.  Used for extended-chord intensity (Tier 3).
   */
  richest: string;
}

/**
 * Maps every {@link ChordType} to its quality-specific color family.
 *
 * Color families are chosen to be perceptually distinct while remaining
 * harmonious together:
 *
 * | Quality     | Hue           | Character            |
 * |-------------|---------------|----------------------|
 * | major       | Amber / gold  | Bright, uplifting    |
 * | minor       | Blue / indigo | Cool, introspective  |
 * | maj7        | Gold-yellow   | Luminous, open       |
 * | min7        | Deep blue     | Rich, complex        |
 * | dom7        | Red-orange    | Warm, tense          |
 * | halfdim7    | Muted purple  | Mysterious, shadowed |
 */
export const ChordQualityColors: Record<ChordType, ChordQualityColor> = {
  major: {
    base:    "hsl(45, 80%, 50%)",
    fill:    "hsla(45, 80%, 50%, 0.12)",
    light:   "hsl(45, 80%, 95%)",
    dark:    "hsl(45, 80%, 28%)",
    deeper:  "hsl(45, 90%, 43%)",
    richest: "hsl(45, 95%, 36%)",
  },
  minor: {
    base:    "hsl(230, 65%, 50%)",
    fill:    "hsla(230, 65%, 50%, 0.12)",
    light:   "hsl(230, 65%, 95%)",
    dark:    "hsl(230, 65%, 30%)",
    deeper:  "hsl(230, 80%, 43%)",
    richest: "hsl(230, 92%, 36%)",
  },
  maj7: {
    base:    "hsl(50, 70%, 52%)",
    fill:    "hsla(50, 70%, 52%, 0.12)",
    light:   "hsl(50, 70%, 96%)",
    dark:    "hsl(50, 70%, 28%)",
    deeper:  "hsl(50, 85%, 45%)",
    richest: "hsl(50, 95%, 38%)",
  },
  min7: {
    base:    "hsl(240, 60%, 52%)",
    fill:    "hsla(240, 60%, 52%, 0.12)",
    light:   "hsl(240, 60%, 95%)",
    dark:    "hsl(240, 60%, 30%)",
    deeper:  "hsl(240, 75%, 45%)",
    richest: "hsl(240, 88%, 38%)",
  },
  dom7: {
    base:    "hsl(15, 85%, 52%)",
    fill:    "hsla(15, 85%, 52%, 0.12)",
    light:   "hsl(15, 85%, 95%)",
    dark:    "hsl(15, 85%, 30%)",
    deeper:  "hsl(15, 95%, 45%)",
    richest: "hsl(15, 95%, 38%)",
  },
  halfdim7: {
    base:    "hsl(280, 50%, 48%)",
    fill:    "hsla(280, 50%, 48%, 0.12)",
    light:   "hsl(280, 50%, 95%)",
    dark:    "hsl(280, 50%, 28%)",
    deeper:  "hsl(280, 65%, 41%)",
    richest: "hsl(280, 78%, 34%)",
  },
};
