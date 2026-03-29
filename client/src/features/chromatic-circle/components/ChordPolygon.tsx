import { memo } from "react";
import { IntervalLabel, getIntervalName, getRootIntervals } from "@/features/chord-intervals";
import type { Point } from "../utils";
import {
  CENTER,
  CENTROID_CROSSHAIR_LENGTH,
  CENTROID_RADIUS,
  POLYGON_STROKE_WIDTH,
  RING_STROKE_WIDTH,
} from "../constants/visualConstants";
import styles from "./ChordPolygon.module.css";

interface ChordPolygonProps {
  /** Animated (morphed) polygon points — used for rendering the polygon outline. */
  morphedPoints: Point[];
  fillColor: string;
  strokeColor: string;
  strokeDasharray?: string;
  opacity: number;
  showCentroid: boolean;
  centroid: Point;
  showIntervals: boolean;
  /** Chromatic indices of all notes in the current chord (used for interval labels). */
  chordIndices: number[];
  /**
   * Incrementing counter — each new value triggers a single-cycle pulse animation.
   * Pass 0 (or omit) for no animation; increment on each chord onset during playback.
   */
  pulse?: number;
}

/**
 * Renders the chord polygon, optional centroid crosshair, and optional
 * interval labels inside the chromatic circle SVG.
 *
 * Wrapped with React.memo so it only re-renders when its own props change.
 */
export const ChordPolygon = memo(function ChordPolygon({
  morphedPoints,
  fillColor,
  strokeColor,
  strokeDasharray,
  opacity,
  showCentroid,
  centroid,
  showIntervals,
  chordIndices,
  pulse = 0,
}: ChordPolygonProps) {
  return (
    <>
      {/* Main chord polygon — key changes on each chord onset to re-trigger the CSS animation */}
      <polygon
        key={pulse}
        points={morphedPoints.map((p) => `${p.x},${p.y}`).join(" ")}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={POLYGON_STROKE_WIDTH}
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        opacity={opacity}
        className={pulse > 0 ? styles.chordPulse : undefined}
      />

      {/* Centroid crosshair + dot */}
      {showCentroid && (
        <g role="img" aria-label="From chord centroid">
          <line
            x1={centroid.x - CENTROID_CROSSHAIR_LENGTH}
            y1={centroid.y}
            x2={centroid.x + CENTROID_CROSSHAIR_LENGTH}
            y2={centroid.y}
            stroke={strokeColor}
            strokeWidth={RING_STROKE_WIDTH}
            opacity={0.5}
          />
          <line
            x1={centroid.x}
            y1={centroid.y - CENTROID_CROSSHAIR_LENGTH}
            x2={centroid.x}
            y2={centroid.y + CENTROID_CROSSHAIR_LENGTH}
            stroke={strokeColor}
            strokeWidth={RING_STROKE_WIDTH}
            opacity={0.5}
          />
          <circle cx={centroid.x} cy={centroid.y} r={CENTROID_RADIUS} fill={strokeColor} opacity={0.7} />
        </g>
      )}

      {/* Interval labels between polygon vertices */}
      {showIntervals &&
        getRootIntervals(chordIndices).map((semitones, i) => {
          if (semitones === null) return null;
          const from = morphedPoints[i];
          const to = morphedPoints[(i + 1) % morphedPoints.length];
          if (!from || !to) return null;
          return (
            <IntervalLabel
              key={`from-interval-${i}`}
              from={from}
              to={to}
              intervalName={getIntervalName(semitones)}
              centerX={CENTER}
              centerY={CENTER}
            />
          );
        })}
    </>
  );
});
