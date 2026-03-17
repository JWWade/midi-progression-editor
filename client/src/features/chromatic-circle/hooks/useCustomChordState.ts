import { useState, useCallback } from "react";
import type { ChordType } from "@/features/chord/types";
import type { Chord, PrimitiveShape } from "@/features/current-chord";
import {
  rotateChordNotes,
  rotateNamedChordRoot,
  dedupePitchClasses,
  getPrimitiveNoteIndices,
  mirrorChordAboutRoot,
  CHORD_INTERVALS,
} from "@/features/chord/utils/transpose";
import { findNearestChord } from "@/features/chord/utils/findNearestChord";
import { CHORD_NAME_TO_DATA, getChordName } from "@/features/chord/data/chordNames";
import type { CustomChordState } from "../types";

const PRIMITIVE_SHAPE_META: Record<PrimitiveShape, { quality: ChordType; label: string }> = {
  "equilateral-triangle": { quality: "aug", label: "equilateral triangle" },
  "suspended-triangle": { quality: "major", label: "sus4 triangle" },
  rectangle: { quality: "dom7", label: "rectangle" },
  square: { quality: "dim", label: "square" },
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
  handleMirrorChord: () => void;
  handleRandomChord: () => void;
  handleSelectPrimitiveShape: (shape: PrimitiveShape) => void;
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
  const handleMirrorChord = useCallback(() => {
    const applyMirrored = (notes: number[]) => {
      const { root: r, quality: q, matchScore } = findNearestChord(notes);
      if (matchScore === 1) {
        setCustomFromChord(null);
        setSelectedChordName(getChordName(r, q));
        onCurrentChordChange?.({ root: r, quality: q });
      } else {
        const newChord: CustomChordState = { root: r, quality: q, customNotes: notes };
        setCustomFromChord(newChord);
        onCurrentChordChange?.(newChord);
      }
    };
    if (customFromChord) {
      const mirrored = dedupePitchClasses(
        mirrorChordAboutRoot(customFromChord.customNotes, customFromChord.root),
      );
      if (mirrored.length === 0) return;
      if (customFromChord.primitiveShape) {
        const newChord: CustomChordState = {
          root: customFromChord.root, quality: customFromChord.quality,
          customNotes: mirrored, primitiveShape: customFromChord.primitiveShape,
        };
        setCustomFromChord(newChord);
        onCurrentChordChange?.(newChord);
      } else {
        applyMirrored(mirrored);
      }
    } else {
      const { root, type } = CHORD_NAME_TO_DATA[selectedChordName];
      const currentNotes = CHORD_INTERVALS[type].map((i) => (root + i) % 12);
      applyMirrored(dedupePitchClasses(mirrorChordAboutRoot(currentNotes, root)));
    }
    onAnnounce?.("Mirrored chord about root");
  }, [customFromChord, selectedChordName, setSelectedChordName, onCurrentChordChange, onAnnounce]);
  const handleRandomChord = useCallback(() => {
    const indices = Array.from({ length: 12 }, (_, i) => i);
    for (let i = 0; i < 3; i++) {
      const j = i + Math.floor(Math.random() * (12 - i));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const notes = indices.slice(0, 3);
    const { root: r, quality: q } = findNearestChord(notes);
    const newChord: CustomChordState = { root: r, quality: q, customNotes: notes };
    setCustomFromChord(newChord);
    onCurrentChordChange?.(newChord);
    onAnnounce?.("Generated random chord");
  }, [onCurrentChordChange, onAnnounce]);
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

  return {
    customFromChord,
    setCustomFromChord,
    handleRotateChord,
    handleMirrorChord,
    handleRandomChord,
    handleSelectPrimitiveShape,
  };
}
