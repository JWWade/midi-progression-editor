import type { Chord } from "@/features/current-chord/types";
import { formatChordName, CHORD_QUALITY_LABELS } from "@/features/current-chord/utils/chordName";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import styles from "./ProgressionSidebar.module.css";

export interface ProgressionEntry {
  id: string;
  chord: Chord;
}

interface ProgressionSidebarProps {
  progression: ProgressionEntry[];
}

/**
 * Sidebar that displays the chord progression as a vertical list of
 * quality-coloured tiles.  Each tile's background tint, left-border accent,
 * and text colour are derived from {@link ChordQualityColors} so the visual
 * language stays consistent with the chromatic circle and current-chord panel.
 */
export function ProgressionSidebar({ progression }: ProgressionSidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="Chord progression">
      <p className={styles.heading}>Progression</p>
      {progression.length === 0 ? (
        <span className={styles.empty}>No chords yet</span>
      ) : (
        <ol className={styles.tileList}>
          {progression.map((entry, i) => {
            const colors = ChordQualityColors[entry.chord.quality];
            return (
              <li
                key={entry.id}
                className={styles.tile}
                style={{
                  "--tile-base": colors.base,
                  "--tile-light": colors.light,
                  "--tile-dark": colors.dark,
                } as React.CSSProperties}
              >
                <span className={styles.badge}>{i + 1}</span>
                <span className={styles.tileName}>{formatChordName(entry.chord)}</span>
                <span className={styles.tileQuality}>{CHORD_QUALITY_LABELS[entry.chord.quality]}</span>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
