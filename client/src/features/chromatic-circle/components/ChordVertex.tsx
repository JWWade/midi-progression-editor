import { memo } from "react";
import type { Point } from "../utils";
import {
  VERTEX_RADIUS,
  VERTEX_RADIUS_SELECTED,
  VERTEX_SELECTED_FILL,
  VERTEX_SELECTED_STROKE,
} from "../constants/visualConstants";

interface ChordVertexProps {
  point: Point;
  /** True when this vertex is the current root of the chord. */
  isRoot: boolean;
  /** True when this vertex is visually highlighted as selected. */
  isSelected: boolean;
  strokeColor: string;
  /** Full accessible label for the vertex (note, interval, and available actions). */
  ariaLabel: string;
  /** Called when the user commits re-rooting (click / Enter / Space / R). */
  onRerootCommit: () => void;
  /** Called on mouse-enter or focus to start an ephemeral preview. */
  onRerootPreview: () => void;
  /** Called on mouse-leave or blur to clear the preview. */
  onRerootPreviewClear: () => void;
}

/**
 * A single vertex dot rendered at a chord polygon corner.
 *
 * Clicking or pressing Enter, Space, or R commits a chord re-root to this note.
 * Hovering or focusing the vertex triggers an ephemeral preview (announced via
 * an external aria-live region).  Blurring or mouse-leaving clears the preview.
 *
 * Wrapped with React.memo so it only re-renders when its own props change.
 */
export const ChordVertex = memo(function ChordVertex({
  point,
  isRoot,
  isSelected,
  strokeColor,
  ariaLabel,
  onRerootCommit,
  onRerootPreview,
  onRerootPreviewClear,
}: ChordVertexProps) {
  const isHighlighted = isRoot || isSelected;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={isRoot}
      onClick={(e) => {
        e.stopPropagation();
        onRerootCommit();
      }}
      onMouseEnter={onRerootPreview}
      onMouseLeave={onRerootPreviewClear}
      onFocus={onRerootPreview}
      onBlur={onRerootPreviewClear}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onRerootCommit();
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <circle
        cx={point.x}
        cy={point.y}
        r={isHighlighted ? VERTEX_RADIUS_SELECTED : VERTEX_RADIUS}
        fill={isHighlighted ? VERTEX_SELECTED_FILL : strokeColor}
        stroke={isHighlighted ? VERTEX_SELECTED_STROKE : "none"}
        strokeWidth={isHighlighted ? 2 : 0}
        aria-hidden="true"
      />
      {isHighlighted && (
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
