import type { Chord } from "@/features/current-chord/types";
import { ChordTile } from "./ChordTile";
import styles from "./ProgressionSidebar.module.css";

interface ProgressionSidebarProps {
  chords: Chord[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  maxLength: number;
}

export function ProgressionSidebar({ chords, onMoveUp, onMoveDown, onDelete, maxLength }: ProgressionSidebarProps) {
  const isFull = chords.length >= maxLength;

  return (
    <aside
      className={styles.sidebar}
      aria-label="Chord progression"
    >
      <div className={styles.header}>
        <h2 className={styles.heading}>Progression</h2>
        <span className={styles.count} aria-label={`${chords.length} of ${maxLength} chords`}>
          {chords.length}/{maxLength}
        </span>
      </div>
      <div className={styles.chordList} aria-label="Chord list">
        {chords.length === 0 && (
          <div className={styles.emptyState} aria-live="polite">
            <span className={styles.emptyIcon} aria-hidden="true">♩</span>
            <p className={styles.emptyMessage}>
              Your progression is empty. Build a chord on the circle and add it here.
            </p>
          </div>
        )}
        {chords.map((chord, i) => (
          <ChordTile
            key={`${i}-${chord.root}-${chord.quality}`}
            chord={chord}
            index={i}
            isFirst={i === 0}
            isLast={i === chords.length - 1}
            onMoveUp={() => onMoveUp(i)}
            onMoveDown={() => onMoveDown(i)}
            onDelete={() => onDelete(i)}
          />
        ))}
      </div>
      {isFull && (
        <div className={styles.fullIndicator} role="status" aria-live="polite">
          Maximum {maxLength} chords reached
        </div>
      )}
    </aside>
  );
}
