import type { Chord } from "@/features/current-chord/types";
import { ChordTile } from "./ChordTile";
import styles from "./ProgressionSidebar.module.css";

interface ProgressionSidebarProps {
  chords: Chord[];
}

export function ProgressionSidebar({ chords }: ProgressionSidebarProps) {
  return (
    <aside
      className={styles.sidebar}
      aria-label="Chord progression"
    >
      <div className={styles.header}>
        <h2 className={styles.heading}>Progression</h2>
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
          <ChordTile key={`${i}-${chord.root}-${chord.quality}`} chord={chord} index={i} />
        ))}
      </div>
    </aside>
  );
}
