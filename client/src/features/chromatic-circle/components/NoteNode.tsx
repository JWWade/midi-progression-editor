import type { PointerEvent as ReactPointerEvent } from "react";
import type { NoteStyle } from "../utils/noteStyles";
import {
  ACCIDENTAL_LABEL_FONT_SIZE,
  NATURAL_LABEL_FONT_SIZE,
  NODE_RADIUS,
  NODE_STROKE_WIDTH,
  NOTE_FONT_FAMILY,
} from "../constants/visualConstants";

interface NoteNodeProps {
  label: string;
  index: number;
  x: number;
  y: number;
  noteStyle: NoteStyle;
  isDragging: boolean;
  dragTargetIndex: number | null;
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
 */
export function NoteNode({
  label,
  index,
  x,
  y,
  noteStyle,
  isDragging,
  dragTargetIndex,
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
      aria-label={label}
      aria-pressed={isInFromChord && isSelected}
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
      {isDragging && dragTargetIndex === index && (
        <circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + 8}
          fill="none"
          stroke="#10b981"
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
}
