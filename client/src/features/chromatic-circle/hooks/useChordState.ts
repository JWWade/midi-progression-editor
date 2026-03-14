import { useState, useEffect, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ChordType } from "@/features/chord/types";
import type { ScaleType } from "@/features/scale/types";
import type { Chord, PrimitiveShape } from "@/features/current-chord";
import {
  transposeChord,
  CHORD_INTERVALS,
  rotateChordNotes,
  rotateNamedChordRoot,
  dedupePitchClasses,
  getPrimitiveNoteIndices,
} from "@/features/chord/utils/transpose";
import { findNearestChord } from "@/features/chord/utils/findNearestChord";
import { CHORD_NAME_TO_DATA, getChordName } from "@/features/chord/data/chordNames";
import { CENTER } from "../constants/visualConstants";
import type { CustomChordState } from "../types";

const DRAG_THRESHOLD_PX = 8;

interface UseChordStateOptions {
  onCurrentChordChange?: (chord: Chord) => void;
  onKeyScaleChange?: (root: number, scale: ScaleType) => void;
  selectedScale: ScaleType;
  pitchClasses: readonly string[];
}

export function useChordState({
  onCurrentChordChange,
  onKeyScaleChange,
  selectedScale,
  pitchClasses,
}: UseChordStateOptions) {
  const [selectedChordName, setSelectedChordName] = useState("C");
  const [customFromChord, setCustomFromChord] = useState<CustomChordState | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNoteIndex, setDraggedNoteIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [didDrag, setDidDrag] = useState(false);
  const [suppressNextClick, setSuppressNextClick] = useState(false);
  const [moveAnnouncement, setMoveAnnouncement] = useState("");

  const handleNoteDragStart = useCallback(
    (noteIndex: number, e: ReactPointerEvent) => {
      const currentChordIndices =
        customFromChord?.customNotes ??
        transposeChord(
          CHORD_INTERVALS[CHORD_NAME_TO_DATA[selectedChordName].type],
          CHORD_NAME_TO_DATA[selectedChordName].root,
        ).map((n) => n.index);

      if (!currentChordIndices.includes(noteIndex)) return;

      e.stopPropagation();
      setIsDragging(true);
      setDidDrag(false);
      setDraggedNoteIndex(noteIndex);
      setDragTargetIndex(noteIndex);
      setDragStartPoint({ x: e.clientX, y: e.clientY });

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [customFromChord, selectedChordName],
  );

  const handleNoteDragMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!isDragging || draggedNoteIndex === null || dragStartPoint === null) return;

      const dx = e.clientX - dragStartPoint.x;
      const dy = e.clientY - dragStartPoint.y;
      const distance = Math.hypot(dx, dy);
      if (distance < DRAG_THRESHOLD_PX) return;
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

  const handleNoteDragEnd = useCallback(() => {
    const resetDragState = () => {
      setIsDragging(false);
      setDidDrag(false);
      setDraggedNoteIndex(null);
      setDragTargetIndex(null);
      setDragStartPoint(null);
    };

    if (!isDragging || draggedNoteIndex === null || dragTargetIndex === null) {
      resetDragState();
      return;
    }

    if (!didDrag) {
      resetDragState();
      return;
    }

    if (dragTargetIndex === draggedNoteIndex) {
      setSuppressNextClick(true);
      resetDragState();
      return;
    }

    const currentChordIndices =
      customFromChord?.customNotes ??
      transposeChord(
        CHORD_INTERVALS[CHORD_NAME_TO_DATA[selectedChordName].type],
        CHORD_NAME_TO_DATA[selectedChordName].root,
      ).map((n) => n.index);

    const newNotes = currentChordIndices.map((idx) =>
      idx === draggedNoteIndex ? dragTargetIndex : idx,
    );

    const { root: bestRoot, quality: bestQuality, matchScore } = findNearestChord(newNotes);

    if (matchScore === 1) {
      setCustomFromChord(null);
      setSelectedChordName(getChordName(bestRoot, bestQuality));
      onCurrentChordChange?.({ root: bestRoot, quality: bestQuality });
    } else {
      const newChord: CustomChordState = {
        root: bestRoot,
        quality: bestQuality,
        customNotes: newNotes,
      };
      setCustomFromChord(newChord);
      onCurrentChordChange?.(newChord);
    }

    setMoveAnnouncement(
      `Moved ${pitchClasses[draggedNoteIndex]} to ${pitchClasses[dragTargetIndex]}`,
    );
    setSuppressNextClick(true);
    resetDragState();
  }, [
    isDragging,
    didDrag,
    draggedNoteIndex,
    dragTargetIndex,
    customFromChord,
    selectedChordName,
    onCurrentChordChange,
    pitchClasses,
  ]);

  const handleRotateChord = useCallback(
    (direction: "clockwise" | "counterclockwise") => {
      const semitones = direction === "clockwise" ? 1 : -1;

      if (customFromChord) {
        const rotatedCustomNotes = dedupePitchClasses(
          rotateChordNotes(customFromChord.customNotes, semitones),
        );
        if (rotatedCustomNotes.length === 0) return;

        const rotatedRoot = rotateNamedChordRoot(customFromChord.root, semitones);

        if (customFromChord.primitiveShape) {
          const newChord: CustomChordState = {
            root: rotatedRoot,
            quality: customFromChord.quality,
            customNotes: rotatedCustomNotes,
            primitiveShape: customFromChord.primitiveShape,
          };
          setCustomFromChord(newChord);
          onCurrentChordChange?.(newChord);
          setMoveAnnouncement(`Rotated ${direction} by one semitone`);
          return;
        }

        const {
          root: bestRoot,
          quality: bestQuality,
          matchScore,
        } = findNearestChord(rotatedCustomNotes);

        if (matchScore === 1) {
          setCustomFromChord(null);
          setSelectedChordName(getChordName(bestRoot, bestQuality));
        } else {
          const newChord: CustomChordState = {
            root: bestRoot,
            quality: bestQuality,
            customNotes: rotatedCustomNotes,
          };
          setCustomFromChord(newChord);
          onCurrentChordChange?.(newChord);
        }
      } else {
        const { root, type } = CHORD_NAME_TO_DATA[selectedChordName];
        const rotatedRoot = rotateNamedChordRoot(root, semitones);
        setSelectedChordName(getChordName(rotatedRoot, type));
      }

      setMoveAnnouncement(`Rotated ${direction} by one semitone`);
    },
    [customFromChord, selectedChordName, onCurrentChordChange],
  );

  const handleSelectPrimitiveShape = useCallback(
    (shape: PrimitiveShape) => {
      const root = customFromChord?.root ?? CHORD_NAME_TO_DATA[selectedChordName].root;
      const quality: ChordType =
        shape === "equilateral-triangle"
          ? "aug"
          : shape === "suspended-triangle"
            ? "major"
            : shape === "rectangle"
              ? "dom7"
              : "dim";
      const customNotes = getPrimitiveNoteIndices(root, shape);
      const newChord: CustomChordState = {
        root,
        quality,
        customNotes,
        primitiveShape: shape,
      };

      setCustomFromChord(newChord);
      onCurrentChordChange?.(newChord);
      setMoveAnnouncement(
        `Selected ${
          shape === "equilateral-triangle"
            ? "equilateral triangle"
            : shape === "suspended-triangle"
              ? "sus4 triangle"
              : shape === "rectangle"
                ? "rectangle"
                : "square"
        }`,
      );
    },
    [customFromChord, selectedChordName, onCurrentChordChange],
  );

  const effectiveRoot =
    customFromChord?.root ?? CHORD_NAME_TO_DATA[selectedChordName].root;
  const effectiveQuality =
    customFromChord?.quality ?? CHORD_NAME_TO_DATA[selectedChordName].type;

  useEffect(() => {
    if (!customFromChord) {
      onCurrentChordChange?.({ root: effectiveRoot, quality: effectiveQuality });
    }
  }, [effectiveRoot, effectiveQuality, onCurrentChordChange, customFromChord]);

  useEffect(() => {
    onKeyScaleChange?.(effectiveRoot, selectedScale);
  }, [effectiveRoot, selectedScale, onKeyScaleChange]);

  useEffect(() => {
    if (!moveAnnouncement) return;
    const timeoutId = window.setTimeout(() => setMoveAnnouncement(""), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [moveAnnouncement]);

  return {
    selectedChordName,
    setSelectedChordName,
    customFromChord,
    setCustomFromChord,
    isDragging,
    dragTargetIndex,
    suppressNextClick,
    setSuppressNextClick,
    moveAnnouncement,
    effectiveRoot,
    effectiveQuality,
    handleNoteDragStart,
    handleNoteDragMove,
    handleNoteDragEnd,
    handleRotateChord,
    handleSelectPrimitiveShape,
  };
}
