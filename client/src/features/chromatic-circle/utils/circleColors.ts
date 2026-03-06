import type { ChordType } from "@/features/chord/types";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";

/**
 * Returns the ambient background tint color for the chromatic circle and
 * chord panels.  The color is derived from the quality's light variant in
 * {@link ChordQualityColors}, providing a cohesive, quality-specific hue
 * that reinforces the system-wide color grammar.
 *
 * @param _key    Root note index (0 = C … 11 = B) — currently unused; kept
 *                for API compatibility with call sites that pass the root.
 * @param quality Chord quality / type.
 * @returns       CSS color string from the quality's light palette entry.
 */
export function getCircleColor(_key: number, quality: ChordType): string {
  return ChordQualityColors[quality].light;
}
