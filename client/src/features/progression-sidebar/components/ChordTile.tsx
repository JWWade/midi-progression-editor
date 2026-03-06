import { ChordThumbnail } from "@/features/current-chord/components/ChordThumbnail";
import { getChordName } from "@/features/chord/data/chordNames";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import { getChordComplexity } from "@/features/color-language/utils/chordColorUtils";
import type { Chord } from "@/features/current-chord/types";
import styles from "./ChordTile.module.css";

interface ChordTileProps {
  chord: Chord;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
}

export function ChordTile({ chord, index, isFirst, isLast, onMoveUp, onMoveDown, onDelete }: ChordTileProps) {
  const noteIndices = getChordNoteIndices(chord.root, chord.quality);
  const complexity = getChordComplexity(chord);
  const accentColor = ChordQualityColors[chord.quality].base;
  const chordName = getChordName(chord.root, chord.quality);

  return (
    <div
      className={styles.tile}
      style={{ "--accent-color": accentColor } as React.CSSProperties}
      aria-label={`Chord ${index + 1}: ${chordName}`}
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
}
