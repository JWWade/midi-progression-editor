import type { ChordType } from "@/features/chord/types";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";

/**
 * Returns a CSS color string representing the ambient background tint for
 * the chromatic circle based on the active chord quality.
 *
 * The tint is drawn from the quality's {@link ChordQualityColors} `light`
 * variant so that the background colour family always matches the chord-tone
 * node fills and progression sidebar tiles, providing a consistent
 * quality-based colour grammar across the entire UI.
 *
 * @param key     Root note index (0 = C, 1 = C#, …, 11 = B) – reserved for
 *                future per-key modulation; currently unused.
 * @param quality Chord quality / type
 * @returns       CSS color string, e.g. `"hsl(45, 85%, 93%)"`
 */
export function getCircleColor(_key: number, quality: ChordType): string {
  if (import.meta.env.DEV && (_key < 0 || _key > 11 || !Number.isInteger(_key))) {
    console.warn(`getCircleColor: key ${_key} is out of valid range (0–11)`);
  }
  return ChordQualityColors[quality].light;
}
