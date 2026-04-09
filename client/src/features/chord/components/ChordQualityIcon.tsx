import type { ChordType } from "@/features/chord/types";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import { NOTE_FONT_FAMILY } from "@/features/chromatic-circle/constants/visualConstants";
import styles from "./ChordQualityIcon.module.css";

/**
 * Pitch-class intervals (relative to root = 0) for each chord quality,
 * placed on the chromatic circle to produce the symmetrical polygon shape
 * described by the Symmetrical Polygon Mapping visual specification.
 *
 * | Quality   | Pitch classes | Polygon               |
 * |-----------|---------------|-----------------------|
 * | aug       | 0, 4, 8       | Equilateral triangle  |
 * | dim       | 0, 3, 6       | Isosceles triangle    |
 * | dom7      | 0, 4, 7, 10   | Isosceles trapezoid   |
 * | maj6      | 0, 4, 7, 9    | Quadrilateral         |
 * | maj7      | 0, 4, 7, 11   | Kite                  |
 * | min7      | 0, 3, 7, 10   | Kite                  |
 * | halfdim7  | 0, 3, 6, 10   | Rectangle             |
 * | major     | 0, 4, 7       | Scalene triangle      |
 * | minor     | 0, 3, 7       | Scalene triangle      |
 * | quartal   | 0, 5, 10      | Scalene triangle      |
 */
const QUALITY_PITCH_CLASSES: Record<ChordType, readonly number[]> = {
  aug:      [0, 4, 8],
  dim:      [0, 3, 6],
  dom7:     [0, 4, 7, 10],
  maj6:     [0, 4, 7, 9],
  maj7:     [0, 4, 7, 11],
  min7:     [0, 3, 7, 10],
  halfdim7: [0, 3, 6, 10],
  major:    [0, 4, 7],
  minor:    [0, 3, 7],
  quartal:  [0, 5, 10],
};

/**
 * Interior glyph for each chord quality per the Symmetrical Polygon Mapping
 * specification.  Only the seven symmetrical chord types receive a glyph;
 * `major` and `minor` (non-symmetrical) are omitted.
 */
const QUALITY_GLYPHS: Partial<Record<ChordType, string>> = {
  aug:      "+",
  dim:      "°",
  dom7:     "7",
  maj6:     "6",
  maj7:     "+7",
  min7:     "\u22127", // −7  (\u2212 = Unicode minus sign U+2212, followed by literal "7")
  halfdim7: "\u00f8",  // ø   (U+00F8)
  quartal:  "4",
};

/** Compute the centroid (average of vertices) of a polygon. */
function polygonCentroid(
  points: Array<{ x: number; y: number }>,
): { x: number; y: number } {
  const n = points.length;
  const x = points.reduce((sum, p) => sum + p.x, 0) / n;
  const y = points.reduce((sum, p) => sum + p.y, 0) / n;
  return { x, y };
}

interface ChordQualityIconProps {
  /** Chord quality that determines the polygon shape, glyph, and color. */
  quality: ChordType;
  /**
   * Width and height of the SVG bounding box in dp/px.
   * @default 24
   */
  size?: number;
  /** Render in the active/selected visual state (darker shade, polygon fill). */
  isSelected?: boolean;
  /** Render at 40% opacity with no pointer events. */
  isDisabled?: boolean;
  /** Additional CSS class applied to the wrapper element. */
  className?: string;
  /** Accessible label; defaults to the quality name. */
  "aria-label"?: string;
}

/**
 * A compact SVG icon that encodes chord quality using the Symmetrical Polygon
 * Mapping visual grammar:
 *
 * - A symmetrical polygon derived from the chord's pitch-class geometry
 * - An interior glyph (e.g. `+`, `°`, `ø`, `7`, `+7`, `−7`) encoding quality
 * - Quality-specific stroke color from the shared `ChordQualityColors` system
 * - Hover (+20% brightness), selected (darker/filled), and disabled (40% opacity)
 *   interaction states
 *
 * The icon is drawn inside a 24 × 24 dp bounding box (configurable via `size`)
 * with 2 dp padding on all sides so the polygon fits within a 20 × 20 inner box.
 */
export function ChordQualityIcon({
  quality,
  size = 24,
  isSelected = false,
  isDisabled = false,
  className,
  "aria-label": ariaLabel,
}: ChordQualityIconProps) {
  const center = size / 2;

  // Circumradius: half of the 20 × 20 inner box, minus 1 dp clearance from its edge.
  // For the default size=24: circumradius = (24-4)/2 - 1 = 9.
  const r = (size - 4) / 2 - 1;

  const pitchClasses = QUALITY_PITCH_CLASSES[quality];
  const glyph = QUALITY_GLYPHS[quality];
  const colors = ChordQualityColors[quality];

  // Stroke and glyph color: `dark` for selected (20% darker), `base` for default.
  const strokeColor = isSelected ? colors.dark : colors.base;

  // Fill: light semi-transparent fill for selected state (10–15% opacity of base).
  const polygonFill = isSelected ? colors.fill : "none";

  // Compute polygon vertices on the circumscribed circle.
  // pc=0 maps to 12 o'clock; angle increases clockwise.
  const points = pitchClasses.map((pc) => {
    const angle = (pc / 12) * 2 * Math.PI;
    return {
      x: center + r * Math.sin(angle),
      y: center - r * Math.cos(angle),
    };
  });

  const polygonPoints = points
    .map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`)
    .join(" ");

  // Place the glyph at the polygon centroid so it sits visually inside the shape.
  const centroid = polygonCentroid(points);

  // Glyph size: ~35% of the icon height (≈ 8 dp for size=24).
  const glyphFontSize = Math.max(6, Math.round(size * 0.35));

  const wrapperClass = [
    styles.icon,
    isSelected ? styles.selected : "",
    isDisabled ? styles.disabled : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={ariaLabel ?? quality}
      className={wrapperClass}
    >
      <polygon
        points={polygonPoints}
        fill={polygonFill}
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      {glyph && (
        <text
          x={centroid.x.toFixed(3)}
          y={centroid.y.toFixed(3)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={glyphFontSize}
          fontFamily={NOTE_FONT_FAMILY}
          fontWeight="400"
          fill={strokeColor}
          pointerEvents="none"
        >
          {glyph}
        </text>
      )}
    </svg>
  );
}
