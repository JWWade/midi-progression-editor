import { memo } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { NoteStyle } from "../utils/noteStyles";
import {
  ACCIDENTAL_LABEL_FONT_SIZE,
  NATURAL_LABEL_FONT_SIZE,
  NODE_RADIUS,
  NODE_STROKE_WIDTH,
  NOTE_FONT_FAMILY,
  DRAG_TARGET_STROKE,
} from "../constants/visualConstants";

interface NoteNodeProps {
  label: string;
  index: number;
  x: number;
  y: number;
  noteStyle: NoteStyle;
  /** True when this note is the current drag-and-drop target. */
  isDropTarget: boolean;
  /** True when this note is selected in the tone info panel (not as a chord vertex). */
  isSelected: boolean;
  isInFromChord: boolean;
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * A single interactive note node on the chromatic ring.
 *
 * Renders the coloured circle, the note-name label, an optional drag-preview
 * ring (while dragging), and an optional selection ring.
 *
 * Wrapped with React.memo so it only re-renders when its own props change.
 */
export const NoteNode = memo(function NoteNode({
  label,
  index,
  x,
  y,
  noteStyle,
  isDropTarget,
  isSelected,
  isInFromChord,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClick,
  onKeyDown,
}: NoteNodeProps) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={isInFromChord ? `${label}, chord tone` : label}
      aria-pressed={isSelected}
      data-note-index={index}
      data-note-label={label}
      style={{ cursor: isInFromChord ? "grab" : "pointer" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <circle
        cx={x}
        cy={y}
        r={NODE_RADIUS}
        fill={noteStyle.fill}
        stroke="#fff"
        strokeWidth={NODE_STROKE_WIDTH}
        opacity={noteStyle.opacity}
        aria-hidden="true"
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={label.length > 1 ? ACCIDENTAL_LABEL_FONT_SIZE : NATURAL_LABEL_FONT_SIZE}
        fill={noteStyle.textFill}
        fontFamily={NOTE_FONT_FAMILY}
        fontWeight="bold"
        pointerEvents="none"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        aria-hidden="true"
      >
        {label}
      </text>

      {/* Drop-target highlight shown while dragging */}
      {isDropTarget && (
        <circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + 8}
          fill="none"
          stroke={DRAG_TARGET_STROKE}
          strokeWidth={3}
          opacity={0.8}
          pointerEvents="none"
          aria-hidden="true"
        />
      )}

      {/* Selection ring for keyboard / screen-reader users */}
      {isSelected && (
        <circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + 4}
          fill="none"
          stroke={noteStyle.fill}
          strokeWidth={2}
          opacity={0.7}
          pointerEvents="none"
          aria-hidden="true"
        />
      )}
    </g>
  );
});
