import type { ChordType } from "@/features/chord/types";
import { calculatePolygonPoints } from "@/features/chromatic-circle/utils/geometry";
import type { ChordComplexity } from "@/features/color-language/utils/chordColorUtils";
import { getChordColor } from "@/features/color-language/utils/chordColorUtils";
import { getHarmonyOpacity } from "@/features/color-language/utils/harmonyOpacity";

interface ChordThumbnailProps {
  noteIndices: number[];
  quality: ChordType;
  /** Complexity tier that controls the fill intensity. Defaults to `"triad"`. */
  complexity?: ChordComplexity;
  size?: number;
  /**
   * Optional diatonic note indices for the current key. When provided, vertex
   * dots are rendered at each polygon corner with opacity derived from
   * {@link getHarmonyOpacity} so chromatic chord tones appear ghosted.
   */
  diatonicIndices?: Set<number>;
}

/** Fraction of `size` used as the polygon circumradius. */
const RADIUS_RATIO = 0.38;

/** Fraction of `size` used as the radius for each chord-tone vertex dot. */
const VERTEX_DOT_RADIUS_RATIO = 0.055;

/**
 * A small, self-contained SVG thumbnail that renders the chord's polygon shape
 * with a quality-specific radial gradient fill.
 *
 * When fewer than two note indices are provided (e.g. no active chord) a
 * neutral grey circle placeholder is shown instead.
 */
export function ChordThumbnail({ noteIndices, quality, complexity = "triad", size = 80, diatonicIndices }: ChordThumbnailProps) {
  const center = size / 2;
  const radius = size * RADIUS_RATIO;
  const gradientId = `thumb-gradient-${quality}-${complexity}`;
  const baseColor = getChordColor(quality, complexity);

  if (noteIndices.length < 2) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="#e5e7eb"
          stroke="#d1d5db"
          strokeWidth="1"
        />
      </svg>
    );
  }

  const points = calculatePolygonPoints(center, center, radius, noteIndices);
  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const dotRadius = size * VERTEX_DOT_RADIUS_RATIO;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="100%" stopColor={baseColor} stopOpacity="1" />
        </radialGradient>
      </defs>
      <polygon
        points={polygonPoints}
        fill={`url(#${gradientId})`}
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {diatonicIndices &&
        noteIndices.map((noteIndex, i) => {
          const pt = points[i];
          if (!pt) return null;
          const opacity = getHarmonyOpacity(noteIndex, diatonicIndices, true);
          return (
            <circle
              key={noteIndex}
              cx={pt.x}
              cy={pt.y}
              r={dotRadius}
              fill={baseColor}
              opacity={opacity}
            />
          );
        })}
    </svg>
  );
}
