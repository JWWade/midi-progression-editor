import { useState, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { CENTER } from "../constants/visualConstants";

const DRAG_THRESHOLD_PX = 8;

export interface DragStateResult {
  isDragging: boolean;
  draggedNoteIndex: number | null;
  dragTargetIndex: number | null;
  didDrag: boolean;
  startDrag: (noteIndex: number, e: ReactPointerEvent) => void;
  updateDragPosition: (e: ReactPointerEvent) => void;
  resetDrag: () => void;
}

export function useDragState(): DragStateResult {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNoteIndex, setDraggedNoteIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [didDrag, setDidDrag] = useState(false);

  const startDrag = useCallback((noteIndex: number, e: ReactPointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDidDrag(false);
    setDraggedNoteIndex(noteIndex);
    setDragTargetIndex(noteIndex);
    setDragStartPoint({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const updateDragPosition = useCallback(
    (e: ReactPointerEvent) => {
      if (!isDragging || draggedNoteIndex === null || dragStartPoint === null) return;

      const dx = e.clientX - dragStartPoint.x;
      const dy = e.clientY - dragStartPoint.y;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      if (!didDrag) setDidDrag(true);

      const svgElement = (e.currentTarget as SVGGElement).ownerSVGElement;
      if (!svgElement) return;
      const rect = svgElement.getBoundingClientRect();
      const x = e.clientX - rect.left - CENTER;
      const y = e.clientY - rect.top - CENTER;
      const angle = Math.atan2(x, -y);
      const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI);
      const index = Math.round((normalizedAngle / (2 * Math.PI)) * 12) % 12;

      setDragTargetIndex(index);
    },
    [isDragging, draggedNoteIndex, dragStartPoint, didDrag],
  );

  const resetDrag = useCallback(() => {
    setIsDragging(false);
    setDidDrag(false);
    setDraggedNoteIndex(null);
    setDragTargetIndex(null);
    setDragStartPoint(null);
  }, []);

  return {
    isDragging,
    draggedNoteIndex,
    dragTargetIndex,
    didDrag,
    startDrag,
    updateDragPosition,
    resetDrag,
  };
}
