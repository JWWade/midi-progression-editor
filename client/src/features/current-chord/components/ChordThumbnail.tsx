import type { ChordType } from "@/features/chord/types";
import { calculatePolygonPoints } from "@/features/chromatic-circle/utils/geometry";
import { CHORD_TONE_FILLS } from "@/features/chromatic-circle/utils/noteStyles";

interface ChordThumbnailProps {
  noteIndices: number[];
  quality: ChordType;
  size?: number;
}

/** Fraction of `size` used as the polygon circumradius. */
const RADIUS_RATIO = 0.38;

/**
 * A small, self-contained SVG thumbnail that renders the chord's polygon shape
 * with a quality-specific radial gradient fill.
 *
 * When fewer than two note indices are provided (e.g. no active chord) a
 * neutral grey circle placeholder is shown instead.
 */
export function ChordThumbnail({ noteIndices, quality, size = 80 }: ChordThumbnailProps) {
  const center = size / 2;
  const radius = size * RADIUS_RATIO;
  const gradientId = `thumb-gradient-${quality}`;
  const baseColor = CHORD_TONE_FILLS[quality];

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
    </svg>
  );
}
