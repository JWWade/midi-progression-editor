import type { ChordQualityColor } from "@/features/chord/constants/chordQualityColors";

/**
 * Alias for {@link ChordQualityColor} exposed from this module so that
 * callers can reference the gradient colour shape by name without a deep
 * import.
 */
export type QualityColorSet = ChordQualityColor;

/**
 * Creates a `<radialGradient>` element for use inside an SVG `<defs>` block.
 *
 * The gradient transitions from a soft white highlight near the center (to
 * suggest illumination) to the chord quality's colour at the edges, giving
 * chord polygons an expressive, luminous appearance.
 *
 * Usage:
 * ```tsx
 * <defs>{createRadialGradientDef("my-gradient-id", ChordQualityColors.major)}</defs>
 * <polygon fill="url(#my-gradient-id)" ... />
 * ```
 *
 * @param id       Unique SVG element ID (must be unique in the DOM).
 * @param colorSet Quality-specific colour set; {@link QualityColorSet.base} is
 *                 used as the outer gradient stop colour.
 */
export function createRadialGradientDef(
  id: string,
  colorSet: QualityColorSet,
): React.ReactElement {
  return (
    <radialGradient id={id} cx="50%" cy="40%" r="65%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.65} />
      <stop offset="100%" stopColor={colorSet.base} stopOpacity={1} />
    </radialGradient>
  );
}
