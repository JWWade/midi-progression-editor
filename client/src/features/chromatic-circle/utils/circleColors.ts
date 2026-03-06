import type { ChordType } from "@/features/chord/types";

/**
 * Maps each root note index (0 = C … 11 = B) to an HSL hue in degrees.
 * The 12 chromatic steps are spread evenly across the colour wheel (30° apart).
 */
const KEY_HUE: Readonly<Record<number, number>> = {
  0: 0,    // C   – red
  1: 30,   // C#  – orange
  2: 60,   // D   – yellow
  3: 90,   // D#  – yellow-green
  4: 120,  // E   – green
  5: 150,  // F   – teal
  6: 180,  // F#  – cyan
  7: 210,  // G   – sky-blue
  8: 240,  // G#  – blue
  9: 270,  // A   – violet
  10: 300, // A#  – magenta
  11: 330, // B   – rose
};

interface QualityStyle {
  readonly saturation: number;
  readonly lightness: number;
}

/**
 * Per-quality saturation / lightness offsets.
 * Values are chosen to be subtle enough not to reduce label contrast while
 * giving each quality its own distinct feel.
 */
const QUALITY_STYLE: Readonly<Record<ChordType, QualityStyle>> = {
  major:    { saturation: 20, lightness: 93 },
  minor:    { saturation: 22, lightness: 89 },
  maj7:     { saturation: 25, lightness: 95 },
  min7:     { saturation: 22, lightness: 87 },
  dom7:     { saturation: 28, lightness: 91 },
  halfdim7: { saturation: 15, lightness: 85 },
};

/**
 * Returns a CSS HSL color string representing the ambient background tint for
 * the chromatic circle based on the active key (root note index 0–11) and the
 * chord quality being built.
 *
 * @param key     Root note index (0 = C, 1 = C#, …, 11 = B)
 * @param quality Chord quality / type
 * @returns       CSS color string, e.g. `"hsl(120, 20%, 93%)"`
 */
export function getCircleColor(key: number, quality: ChordType): string {
  if (import.meta.env.DEV && (key < 0 || key > 11 || !Number.isInteger(key))) {
    console.warn(`getCircleColor: key ${key} is out of valid range (0–11), defaulting to hue 0`);
  }
  const hue = KEY_HUE[key] ?? 0;
  const { saturation, lightness } = QUALITY_STYLE[quality];
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
