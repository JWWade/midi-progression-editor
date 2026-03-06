import type { ChordType } from "../types";

/**
 * Three-stop color entry for a single chord quality.
 *
 * - `base`  – vivid fill used for chord-tone nodes and polygon outlines.
 * - `light` – soft tint used for panel backgrounds and ambient circle tints.
 * - `dark`  – deep shade used for text rendered on a light-variant background.
 */
export interface ChordQualityColorEntry {
  readonly base: string;
  readonly light: string;
  readonly dark: string;
}

/**
 * System-wide quality colour grammar.
 *
 * Every surface that reflects chord quality (chromatic-circle node fills,
 * chord polygon fill, current-chord panel tint, progression sidebar tiles)
 * draws from this single source of truth so colours remain consistent across
 * the whole UI.
 *
 * Hue references from the design spec:
 *   Major        – warm gold / amber   HSL 45
 *   Minor        – cool blue / indigo  HSL 230
 *   Major 7      – bright gold         HSL 48  (lighter major variant)
 *   Minor 7      – deep indigo         HSL 235 (darker minor variant)
 *   Dominant 7th – red-orange          HSL 15
 *   Half-dim 7   – muted purple        HSL 280
 */
export const ChordQualityColors: Readonly<Record<ChordType, ChordQualityColorEntry>> = {
  major:    { base: "hsl(45, 82%, 49%)",   light: "hsl(45, 85%, 93%)",   dark: "hsl(45, 82%, 28%)"   },
  minor:    { base: "hsl(230, 65%, 52%)",  light: "hsl(230, 60%, 91%)",  dark: "hsl(230, 65%, 30%)"  },
  maj7:     { base: "hsl(48, 70%, 55%)",   light: "hsl(48, 78%, 94%)",   dark: "hsl(48, 70%, 26%)"   },
  min7:     { base: "hsl(235, 60%, 48%)",  light: "hsl(235, 55%, 90%)",  dark: "hsl(235, 60%, 26%)"  },
  dom7:     { base: "hsl(15, 88%, 52%)",   light: "hsl(15, 85%, 92%)",   dark: "hsl(15, 85%, 28%)"   },
  halfdim7: { base: "hsl(280, 50%, 52%)",  light: "hsl(280, 50%, 92%)",  dark: "hsl(280, 50%, 28%)"  },
};
