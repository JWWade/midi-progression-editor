import { useState, useEffect, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ScaleType } from "@/features/scale/types";
import type { Chord } from "@/features/current-chord";
import { transposeChord, CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import { findNearestChord } from "@/features/chord/utils/findNearestChord";
import { CHORD_NAME_TO_DATA, getChordName } from "@/features/chord/data/chordNames";
import type { CustomChordState } from "../types";
import { useDragState } from "./useDragState";
import { useChordSelection } from "./useChordSelection";
import { useCustomChordState } from "./useCustomChordState";

interface UseChordStateOptions {
  onCurrentChordChange?: (chord: Chord) => void;
  onKeyScaleChange?: (root: number, scale: ScaleType) => void;
  selectedScale: ScaleType;
  initialChordName?: string;
  pitchClasses: readonly string[];
}

export function useChordState({
  onCurrentChordChange,
  onKeyScaleChange,
  selectedScale,
  initialChordName = "C",
  pitchClasses,
}: UseChordStateOptions) {
  const [suppressNextClick, setSuppressNextClick] = useState(false);
  const [moveAnnouncement, setMoveAnnouncement] = useState("");

  const { selectedChordName, setSelectedChordName } = useChordSelection(initialChordName);

  const {
    customFromChord,
    setCustomFromChord,
    handleRotateChord,
    handleMirrorChord,
    handleRandomChord,
    handleMutateChord,
    handleSelectPrimitiveShape,
    handleRerootChord,
  } = useCustomChordState({
    selectedChordName,
    setSelectedChordName,
    onCurrentChordChange,
    onAnnounce: setMoveAnnouncement,
  });

  const {
    isDragging,
    draggedNoteIndex,
    dragTargetIndex,
    didDrag,
    startDrag,
    updateDragPosition,
    resetDrag,
  } = useDragState();

  const handleNoteDragStart = useCallback(
    (noteIndex: number, e: ReactPointerEvent) => {
      const currentChordIndices =
        customFromChord?.customNotes ??
        transposeChord(
          CHORD_INTERVALS[CHORD_NAME_TO_DATA[selectedChordName].type],
          CHORD_NAME_TO_DATA[selectedChordName].root,
        ).map((n) => n.index);
      if (!currentChordIndices.includes(noteIndex)) return;
      startDrag(noteIndex, e);
    },
    [customFromChord, selectedChordName, startDrag],
  );

  // updateDragPosition already memoised by useDragState; expose under public name
  const handleNoteDragMove = updateDragPosition;

  const handleNoteDragEnd = useCallback(() => {
    if (!isDragging || draggedNoteIndex === null || dragTargetIndex === null || !didDrag) {
      resetDrag();
      return;
    }
    if (dragTargetIndex === draggedNoteIndex) {
      setSuppressNextClick(true);
      resetDrag();
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
      const newChord: CustomChordState = { root: bestRoot, quality: bestQuality, customNotes: newNotes };
      setCustomFromChord(newChord);
      onCurrentChordChange?.(newChord);
    }
    setMoveAnnouncement(`Moved ${pitchClasses[draggedNoteIndex]} to ${pitchClasses[dragTargetIndex]}`);
    setSuppressNextClick(true);
    resetDrag();
  }, [
    isDragging, didDrag, draggedNoteIndex, dragTargetIndex,
    customFromChord, selectedChordName,
    setCustomFromChord, setSelectedChordName,
    onCurrentChordChange, pitchClasses, resetDrag,
  ]);

  const effectiveRoot = customFromChord?.root ?? CHORD_NAME_TO_DATA[selectedChordName].root;
  const effectiveQuality = customFromChord?.quality ?? CHORD_NAME_TO_DATA[selectedChordName].type;

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
    handleMirrorChord,
    handleSelectPrimitiveShape,
    handleRandomChord,
    handleMutateChord,
    handleRerootChord,
  };
}
