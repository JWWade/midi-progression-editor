import { useState, useCallback } from "react";
import type { ChordType } from "@/features/chord/types";
import type { Chord, PrimitiveShape } from "@/features/current-chord";
import {
  rotateChordNotes,
  rotateNamedChordRoot,
  dedupePitchClasses,
  getPrimitiveNoteIndices,
  CHORD_INTERVALS,
} from "@/features/chord/utils/transpose";
import { findNearestChord } from "@/features/chord/utils/findNearestChord";
import { reflectPitchClasses, type ReflectionAxis } from "@/features/chord/utils/reflectChord";
import { getChordPitchClasses } from "@/features/chord/utils/getChordPitchClasses";
import { rerootChord } from "@/features/chord/utils/rerootChord";
import { CHORD_NAME_TO_DATA, CHORD_NAMES, getChordName } from "@/features/chord/data/chordNames";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { CustomChordState } from "../types";

const PRIMITIVE_SHAPE_META: Record<PrimitiveShape, { quality: ChordType; label: string }> = {
  "equilateral-triangle": { quality: "aug", label: "equilateral triangle" },
  "suspended-triangle": { quality: "major", label: "sus4 triangle" },
  rectangle: { quality: "dom7", label: "dominant 7" },
  square: { quality: "dim", label: "diminished" },
  "symmetrical-trapezoid": { quality: "maj7", label: "major 7 trapezoid" },
};
interface UseCustomChordStateOptions {
  selectedChordName: string;
  setSelectedChordName: (name: string) => void;
  onCurrentChordChange?: (chord: Chord) => void;
  onAnnounce?: (msg: string) => void;
}
export interface CustomChordStateResult {
  customFromChord: CustomChordState | null;
  setCustomFromChord: (chord: CustomChordState | null) => void;
  handleRotateChord: (direction: "clockwise" | "counterclockwise") => void;
  handleMirrorWithAxis: (axis: ReflectionAxis) => void;
  handleRandomChord: () => void;
  handleMutateChord: () => void;
  handleSelectPrimitiveShape: (shape: PrimitiveShape) => void;
  handleRerootChord: (newRoot: number, pitchClassLabel: string) => void;
}

export function useCustomChordState({
  selectedChordName,
  setSelectedChordName,
  onCurrentChordChange,
  onAnnounce,
}: UseCustomChordStateOptions): CustomChordStateResult {
  const [customFromChord, setCustomFromChord] = useState<CustomChordState | null>(null);
  const handleRotateChord = useCallback(
    (direction: "clockwise" | "counterclockwise") => {
      const semitones = direction === "clockwise" ? 1 : -1;
      if (customFromChord) {
        const rotatedNotes = dedupePitchClasses(
          rotateChordNotes(customFromChord.customNotes, semitones),
        );
        if (rotatedNotes.length === 0) return;
        const rotatedRoot = rotateNamedChordRoot(customFromChord.root, semitones);
        if (customFromChord.primitiveShape) {
          const newChord: CustomChordState = {
            root: rotatedRoot, quality: customFromChord.quality,
            customNotes: rotatedNotes, primitiveShape: customFromChord.primitiveShape,
          };
          setCustomFromChord(newChord);
          onCurrentChordChange?.(newChord);
          onAnnounce?.(`Rotated ${direction} by one semitone`);
          return;
        }
        const { root: r, quality: q, matchScore } = findNearestChord(rotatedNotes);
        if (matchScore === 1) {
          setCustomFromChord(null);
          setSelectedChordName(getChordName(r, q));
        } else {
          const newChord: CustomChordState = { root: r, quality: q, customNotes: rotatedNotes };
          setCustomFromChord(newChord);
          onCurrentChordChange?.(newChord);
        }
      } else {
        const { root, type } = CHORD_NAME_TO_DATA[selectedChordName];
        setSelectedChordName(getChordName(rotateNamedChordRoot(root, semitones), type));
      }
      onAnnounce?.(`Rotated ${direction} by one semitone`);
    },
    [customFromChord, selectedChordName, setSelectedChordName, onCurrentChordChange, onAnnounce],
  );
  const handleMirrorWithAxis = useCallback(
    (axis: ReflectionAxis) => {
      const sourceChord: Chord = customFromChord ?? {
        root: CHORD_NAME_TO_DATA[selectedChordName].root,
        quality: CHORD_NAME_TO_DATA[selectedChordName].type,
      };
      const reflectedPcs = reflectPitchClasses(getChordPitchClasses(sourceChord), { axis, mode: "chromatic" });
      const { root: r, quality: q, matchScore } = findNearestChord(reflectedPcs);
      if (matchScore === 1) {
        setCustomFromChord(null);
        setSelectedChordName(getChordName(r, q));
        onCurrentChordChange?.({ root: r, quality: q });
      } else {
        const newChord: CustomChordState = { root: r, quality: q, customNotes: reflectedPcs };
        setCustomFromChord(newChord);
        onCurrentChordChange?.(newChord);
      }
      onAnnounce?.(`Reflected across ${axis.label}`);
    },
    [customFromChord, selectedChordName, setSelectedChordName, setCustomFromChord, onCurrentChordChange, onAnnounce],
  );
  const handleRandomChord = useCallback(() => {
    const name = CHORD_NAMES[Math.floor(Math.random() * CHORD_NAMES.length)];
    const { root: r, type: q } = CHORD_NAME_TO_DATA[name];
    setCustomFromChord(null);
    setSelectedChordName(name);
    onCurrentChordChange?.({ root: r, quality: q });
    onAnnounce?.("Generated random chord");
  }, [setSelectedChordName, onCurrentChordChange, onAnnounce]);
  const handleMutateChord = useCallback(() => {
    const currentNotes = customFromChord
      ? customFromChord.customNotes
      : CHORD_INTERVALS[CHORD_NAME_TO_DATA[selectedChordName].type].map(
          (i) => (CHORD_NAME_TO_DATA[selectedChordName].root + i) % 12,
        );
    if (currentNotes.length === 0) return;
    // Pick a random note index to replace.
    const mutatePos = Math.floor(Math.random() * currentNotes.length);
    // Collect all pitch classes not already in the chord.
    const available = Array.from({ length: 12 }, (_, i) => i).filter(
      (pc) => !currentNotes.includes(pc),
    );
    if (available.length === 0) return;
    const newPc = available[Math.floor(Math.random() * available.length)];
    const oldName = PITCH_CLASSES[currentNotes[mutatePos]];
    const newName = PITCH_CLASSES[newPc];
    const newNotes = currentNotes.map((n, i) => (i === mutatePos ? newPc : n));
    const { root: r, quality: q, matchScore } = findNearestChord(newNotes);
    if (matchScore === 1) {
      setCustomFromChord(null);
      setSelectedChordName(getChordName(r, q));
      onCurrentChordChange?.({ root: r, quality: q });
    } else {
      const newChord: CustomChordState = { root: r, quality: q, customNotes: newNotes };
      setCustomFromChord(newChord);
      onCurrentChordChange?.(newChord);
    }
    onAnnounce?.(`Replaced ${oldName} with ${newName}`);
  }, [customFromChord, selectedChordName, setSelectedChordName, onCurrentChordChange, onAnnounce]);
  const handleSelectPrimitiveShape = useCallback(
    (shape: PrimitiveShape) => {
      const root = customFromChord?.root ?? CHORD_NAME_TO_DATA[selectedChordName].root;
      const { quality, label } = PRIMITIVE_SHAPE_META[shape];
      const newChord: CustomChordState = {
        root, quality, customNotes: getPrimitiveNoteIndices(root, shape), primitiveShape: shape,
      };
      setCustomFromChord(newChord);
      onCurrentChordChange?.(newChord);
      onAnnounce?.(`Selected ${label}`);
    },
    [customFromChord, selectedChordName, onCurrentChordChange, onAnnounce],
  );

  const handleRerootChord = useCallback(
    (newRoot: number, pitchClassLabel: string) => {
      const currentNotes =
        customFromChord?.customNotes ??
        CHORD_INTERVALS[CHORD_NAME_TO_DATA[selectedChordName].type].map(
          (i) => (CHORD_NAME_TO_DATA[selectedChordName].root + i) % 12,
        );

      // Find the index of newRoot in currentNotes
      const rootIndex = currentNotes.indexOf(newRoot);
      
      // Reorder notes so newRoot is first (voicing inversion)
      const rotatedNotes =
        rootIndex === -1
          ? currentNotes // newRoot not in chord, keep original order
          : [
              ...currentNotes.slice(rootIndex),
              ...currentNotes.slice(0, rootIndex),
            ];

      const { root, quality, matchScore } = rerootChord(rotatedNotes, newRoot);

      if (matchScore === 1) {
        setCustomFromChord(null);
        setSelectedChordName(getChordName(root, quality));
        onCurrentChordChange?.({ root, quality });
        onAnnounce?.(`Root set to ${pitchClassLabel}. ${getChordName(root, quality)} chord`);
      } else {
        const newChord: CustomChordState = { root, quality, customNotes: rotatedNotes };
        setCustomFromChord(newChord);
        onCurrentChordChange?.(newChord);
        const noteNames = rotatedNotes.map((i) => PITCH_CLASSES[i]).join(", ");
        onAnnounce?.(
          `Root set to ${pitchClassLabel}. No exact chord match. Notes: ${noteNames}`,
        );
      }
    },
    [
      customFromChord,
      selectedChordName,
      setSelectedChordName,
      setCustomFromChord,
      onCurrentChordChange,
      onAnnounce,
    ],
  );

  return {
    customFromChord,
    setCustomFromChord,
    handleRotateChord,
    handleMirrorWithAxis,
    handleRandomChord,
    handleMutateChord,
    handleSelectPrimitiveShape,
    handleRerootChord,
  };
}
