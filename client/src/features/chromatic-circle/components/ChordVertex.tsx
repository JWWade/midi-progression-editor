import { memo } from "react";
import type { Point } from "../utils";
import {
  VERTEX_RADIUS,
  VERTEX_RADIUS_SELECTED,
  VERTEX_SELECTED_FILL,
  VERTEX_SELECTED_STROKE,
} from "../constants/visualConstants";

interface ChordVertexProps {
  noteName: string;
  point: Point;
  isSelected: boolean;
  strokeColor: string;
  onActivate: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

/**
 * A single clickable vertex dot rendered at a chord polygon corner.
 * Highlights when selected and supports keyboard activation.
 *
 * Wrapped with React.memo so it only re-renders when its own props change.
 */
export const ChordVertex = memo(function ChordVertex({
  noteName,
  point,
  isSelected,
  strokeColor,
  onActivate,
}: ChordVertexProps) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${noteName} in chord`}
      aria-pressed={isSelected}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate(e);
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <circle
        cx={point.x}
        cy={point.y}
        r={isSelected ? VERTEX_RADIUS_SELECTED : VERTEX_RADIUS}
        fill={isSelected ? VERTEX_SELECTED_FILL : strokeColor}
        stroke={isSelected ? VERTEX_SELECTED_STROKE : "none"}
        strokeWidth={isSelected ? 2 : 0}
        aria-hidden="true"
      />
      {isSelected && (
        <circle
          cx={point.x}
          cy={point.y}
          r={VERTEX_RADIUS_SELECTED + 4}
          fill="none"
          stroke={VERTEX_SELECTED_STROKE}
          strokeWidth={2}
          opacity={0.6}
          aria-hidden="true"
        />
      )}
    </g>
  );
});
