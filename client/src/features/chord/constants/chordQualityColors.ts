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
 * | dim         | Burgundy      | Dark, tense          |
 * | aug         | Teal          | Ethereal, lifted     |
 * | sus2        | Sky blue      | Open, airy, suspended|
 * | maj7        | Gold-yellow   | Luminous, open       |
 * | maj6        | Yellow-green  | Bright, major-flavored   |
 * | min6        | Teal-indigo   | Minor-flavored, distinct |
 * | min7        | Deep blue     | Rich, complex        |
 * | minmaj7     | Indigo-violet | Minor-dark, haunting |
 * | dom7        | Red-orange    | Warm, tense          |
 * | dom7sus4    | Amber-orange  | Dominant, unresolved |
 * | halfdim7    | Muted purple  | Mysterious, shadowed |
 * | quartal     | Cyan-green    | Open, suspended      |
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
  dim: {
    base:    "hsl(340, 50%, 44%)",
    fill:    "hsla(340, 50%, 44%, 0.12)",
    light:   "hsl(340, 50%, 95%)",
    dark:    "hsl(340, 50%, 24%)",
    deeper:  "hsl(340, 65%, 37%)",
    richest: "hsl(340, 78%, 30%)",
  },
  aug: {
    base:    "hsl(168, 65%, 40%)",
    fill:    "hsla(168, 65%, 40%, 0.12)",
    light:   "hsl(168, 65%, 95%)",
    dark:    "hsl(168, 65%, 20%)",
    deeper:  "hsl(168, 78%, 33%)",
    richest: "hsl(168, 88%, 26%)",
  },
  sus2: {
    base:    "hsl(200, 65%, 52%)",
    fill:    "hsla(200, 65%, 52%, 0.12)",
    light:   "hsl(200, 65%, 95%)",
    dark:    "hsl(200, 65%, 28%)",
    deeper:  "hsl(200, 78%, 44%)",
    richest: "hsl(200, 88%, 37%)",
  },
  maj7: {
    base:    "hsl(50, 70%, 52%)",
    fill:    "hsla(50, 70%, 52%, 0.12)",
    light:   "hsl(50, 70%, 96%)",
    dark:    "hsl(50, 70%, 28%)",
    deeper:  "hsl(50, 85%, 45%)",
    richest: "hsl(50, 95%, 38%)",
  },
  maj6: {
    base:    "hsl(62, 75%, 48%)",
    fill:    "hsla(62, 75%, 48%, 0.12)",
    light:   "hsl(62, 75%, 95%)",
    dark:    "hsl(62, 75%, 26%)",
    deeper:  "hsl(62, 88%, 41%)",
    richest: "hsl(62, 95%, 34%)",
  },
  min6: {
    base:    "hsl(215, 62%, 48%)",
    fill:    "hsla(215, 62%, 48%, 0.12)",
    light:   "hsl(215, 62%, 95%)",
    dark:    "hsl(215, 62%, 27%)",
    deeper:  "hsl(215, 76%, 41%)",
    richest: "hsl(215, 88%, 34%)",
  },
  min7: {
    base:    "hsl(240, 60%, 52%)",
    fill:    "hsla(240, 60%, 52%, 0.12)",
    light:   "hsl(240, 60%, 95%)",
    dark:    "hsl(240, 60%, 30%)",
    deeper:  "hsl(240, 75%, 45%)",
    richest: "hsl(240, 88%, 38%)",
  },
  minmaj7: {
    base:    "hsl(258, 55%, 48%)",
    fill:    "hsla(258, 55%, 48%, 0.12)",
    light:   "hsl(258, 55%, 95%)",
    dark:    "hsl(258, 55%, 27%)",
    deeper:  "hsl(258, 68%, 41%)",
    richest: "hsl(258, 80%, 34%)",
  },
  dom7: {
    base:    "hsl(15, 85%, 52%)",
    fill:    "hsla(15, 85%, 52%, 0.12)",
    light:   "hsl(15, 85%, 95%)",
    dark:    "hsl(15, 85%, 30%)",
    deeper:  "hsl(15, 95%, 45%)",
    richest: "hsl(15, 95%, 38%)",
  },
  dom7sus4: {
    base:    "hsl(28, 78%, 50%)",
    fill:    "hsla(28, 78%, 50%, 0.12)",
    light:   "hsl(28, 78%, 95%)",
    dark:    "hsl(28, 78%, 28%)",
    deeper:  "hsl(28, 90%, 43%)",
    richest: "hsl(28, 95%, 36%)",
  },
  halfdim7: {
    base:    "hsl(280, 50%, 48%)",
    fill:    "hsla(280, 50%, 48%, 0.12)",
    light:   "hsl(280, 50%, 95%)",
    dark:    "hsl(280, 50%, 28%)",
    deeper:  "hsl(280, 65%, 41%)",
    richest: "hsl(280, 78%, 34%)",
  },
  quartal: {
    base:    "hsl(175, 65%, 40%)",
    fill:    "hsla(175, 65%, 40%, 0.12)",
    light:   "hsl(175, 65%, 95%)",
    dark:    "hsl(175, 65%, 20%)",
    deeper:  "hsl(175, 78%, 33%)",
    richest: "hsl(175, 88%, 26%)",
  },
};
