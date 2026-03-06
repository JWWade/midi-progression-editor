import type { ChordType } from "@/features/chord/types";
import { SEVENTH_CHORD_TYPES } from "@/features/chord/types";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import type { Chord } from "@/features/current-chord/types";

/**
 * Three tiers of harmonic complexity that control color intensity.
 *
 * | Tier      | Description                                | Visual treatment        |
 * |-----------|-------------------------------------------|-------------------------|
 * | triad     | Major/minor triads (no extensions)        | Base quality color      |
 * | seventh   | Seventh chords (maj7, min7, dom7, ½dim7)  | Deeper / more saturated |
 * | extended  | Extensions present (9ths, 11ths, 13ths)   | Richest / most saturated|
 */
export type ChordComplexity = "triad" | "seventh" | "extended";

/** Matches extension strings that indicate a 9th, 11th, or 13th. */
const EXTENDED_RE = /\b(9|11|13)\b/;

/**
 * Derives the {@link ChordComplexity} tier for a given chord.
 *
 * - Returns `"extended"` when `chord.extensions` contains a 9, 11, or 13.
 * - Returns `"seventh"` when the chord quality is a seventh-chord type and no
 *   extended interval is present.
 * - Returns `"triad"` otherwise.
 */
export function getChordComplexity(chord: Chord): ChordComplexity {
  if (chord.extensions?.some((ext) => EXTENDED_RE.test(ext))) {
    return "extended";
  }
  if (SEVENTH_CHORD_TYPES.has(chord.quality)) {
    return "seventh";
  }
  return "triad";
}

/**
 * Returns the final render color for the given chord quality and complexity
 * tier.
 *
 * - `"triad"`    → `base` (standard saturation)
 * - `"seventh"`  → `deeper` (15–20 pp more saturated, slightly darker)
 * - `"extended"` → `richest` (25–35 pp more saturated, noticeably darker)
 *
 * The hue family is always preserved; only saturation and lightness vary.
 */
export function getChordColor(quality: ChordType, complexity: ChordComplexity): string {
  const colors = ChordQualityColors[quality];
  switch (complexity) {
    case "seventh":  return colors.deeper;
    case "extended": return colors.richest;
    default:         return colors.base;
  }
}

/**
 * Derives a semi-transparent fill variant (12 % opacity) from the solid render
 * color for the given quality and complexity tier.  Used for polygon interior
 * fills where the circle background should show through.
 *
 * The input color must use the `hsl(H, S%, L%)` format used throughout
 * {@link ChordQualityColors}.
 */
export function getChordFillColor(quality: ChordType, complexity: ChordComplexity): string {
  const solidColor = getChordColor(quality, complexity);
  return solidColor.replace(/^hsl\(/, "hsla(").replace(/\)$/, ", 0.12)");
}
