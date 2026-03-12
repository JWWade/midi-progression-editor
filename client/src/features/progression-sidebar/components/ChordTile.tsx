import { forwardRef } from "react";
import { ChordThumbnail } from "@/features/current-chord/components/ChordThumbnail";
import { getChordName } from "@/features/chord/data/chordNames";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";
import { getChordComplexity, getChordColor } from "@/features/color-language/utils/chordColorUtils";
import type { Chord } from "@/features/current-chord/types";
import { isCustomChord } from "@/features/current-chord/utils/chordTypeGuards";
import { formatPrimitiveChordName } from "@/features/current-chord/utils/chordName";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import styles from "./ChordTile.module.css";

interface ChordTileProps {
  chord: Chord;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isNew?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  onAnimationEnd?: () => void;
}

export const ChordTile = forwardRef<HTMLDivElement, ChordTileProps>(
  function ChordTile({ chord, index, isFirst, isLast, isNew = false, onMoveUp, onMoveDown, onDelete, onAnimationEnd }, ref) {
  const noteIndices = isCustomChord(chord) 
    ? chord.customNotes 
    : getChordNoteIndices(chord.root, chord.quality);
  const complexity = getChordComplexity(chord);
  const accentColor = getChordColor(chord.quality, complexity);
  const chordName = isCustomChord(chord)
    ? (chord.primitiveShape === "equilateral-triangle"
      ? getChordName(chord.root, chord.quality)
      : chord.primitiveShape
        ? formatPrimitiveChordName(chord)
        : chord.customNotes.map(i => PITCH_CLASSES[i]).join(" "))
    : getChordName(chord.root, chord.quality);

  return (
    <div
      ref={ref}
      className={`${styles.tile}${isNew ? ` ${styles.tileHighlight}` : ""}`}
      style={{ "--accent-color": accentColor } as React.CSSProperties}
      aria-label={`${chordName}, position ${index + 1}`}
      tabIndex={0}
      onAnimationEnd={onAnimationEnd}
    >
      <div className={styles.thumbnail}>
        <ChordThumbnail
          noteIndices={noteIndices}
          quality={chord.quality}
          complexity={complexity}
          size={48}
        />
      </div>
      <span className={styles.chordName}>{chordName}</span>
      <div className={styles.controls} aria-label="Chord controls">
        <button
          className={styles.controlBtn}
          onClick={onMoveUp}
          disabled={isFirst}
          aria-disabled={isFirst}
          aria-label="Move chord up"
          title="Move up"
        >
          ↑
        </button>
        <button
          className={styles.controlBtn}
          onClick={onMoveDown}
          disabled={isLast}
          aria-disabled={isLast}
          aria-label="Move chord down"
          title="Move down"
        >
          ↓
        </button>
        <button
          className={`${styles.controlBtn} ${styles.deleteBtn}`}
          onClick={onDelete}
          aria-label="Delete chord"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
});

