import { useState, useRef, useEffect } from "react";
import type { Chord } from "@/features/current-chord/types";
import { ChordTile } from "./ChordTile";
import { MidiExportControls } from "@/features/midi-export/components/MidiExportControls";
import styles from "./ProgressionSidebar.module.css";

/** Must match the `tileHighlight` animation duration in ChordTile.module.css */
const HIGHLIGHT_ANIMATION_DURATION_MS = 300;

interface ProgressionSidebarProps {
  chords: Chord[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  maxLength: number;
}

export function ProgressionSidebar({ chords, onMoveUp, onMoveDown, onDelete, maxLength }: ProgressionSidebarProps) {
  const isFull = chords.length >= maxLength;
  const [newTileIndex, setNewTileIndex] = useState<number | null>(null);
  const [prevLength, setPrevLength] = useState(chords.length);
  const tileRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Derive newTileIndex during render when the chord list changes (React-documented
  // derived-state pattern; avoids setState-in-effect which the linter forbids).
  if (chords.length !== prevLength) {
    setPrevLength(chords.length);
    if (chords.length > prevLength) {
      setNewTileIndex(chords.length - 1);
    } else {
      // A chord was deleted; clear any stale highlight to avoid highlighting a
      // different chord that now occupies the same index slot.
      setNewTileIndex(null);
    }
  }

  // Scroll to and focus the newly added tile
  useEffect(() => {
    if (newTileIndex === null) return;
    const el = tileRefs.current[newTileIndex];
    if (!el) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
    const focusTimer = setTimeout(() => {
      tileRefs.current[newTileIndex]?.focus();
    }, HIGHLIGHT_ANIMATION_DURATION_MS);
    return () => clearTimeout(focusTimer);
  }, [newTileIndex]);

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
      <p className={styles.resetNote}>Resets on page reload</p>
      <ol className={styles.chordList} aria-label="Chord list">
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
            ref={(el) => { tileRefs.current[i] = el; }}
            chord={chord}
            index={i}
            isFirst={i === 0}
            isLast={i === chords.length - 1}
            isNew={newTileIndex === i}
            onMoveUp={() => onMoveUp(i)}
            onMoveDown={() => onMoveDown(i)}
            onDelete={() => onDelete(i)}
            onAnimationEnd={() => setNewTileIndex(null)}
          />
        ))}
      </ol>
      {isFull && (
        <div className={styles.fullIndicator} role="status" aria-live="polite">
          Maximum {maxLength} chords reached
        </div>
      )}
      <MidiExportControls chords={chords} disabled={chords.length === 0} />
    </aside>
  );
}
