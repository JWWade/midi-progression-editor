import React, { useState, useRef, useEffect, useMemo } from "react";
import type { Chord } from "@/features/current-chord/types";
import { ChordTile } from "./ChordTile";
import { PairMetricBadge } from "./PairMetricBadge";
import { computeProgressionPairMetrics } from "../utils/pairMetrics";
import { MidiExportControls } from "@/features/midi-export/components/MidiExportControls";
import { getChordName } from "@/features/chord/data/chordNames";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import styles from "./ProgressionSidebar.module.css";

/** Must match the `tileHighlight` animation duration in ChordTile.module.css */
const HIGHLIGHT_ANIMATION_DURATION_MS = 300;

interface ProgressionSidebarProps {
  chords: Chord[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  maxLength: number;
  isPlaying: boolean;
  playingIndex: number | null;
  onPlay: () => void;
  onStop: () => void;
}

export function ProgressionSidebar({ chords, onMoveUp, onMoveDown, onDelete, maxLength, isPlaying, playingIndex, onPlay, onStop }: ProgressionSidebarProps) {
  const { pitchClasses } = useEnharmonic();
  const isFull = chords.length >= maxLength;
  const [newTileIndex, setNewTileIndex] = useState<number | null>(null);
  const [prevLength, setPrevLength] = useState(chords.length);
  const tileRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Compute pair metrics for the progression
  const pairMetrics = useMemo(() => computeProgressionPairMetrics(chords), [chords]);

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
        <button
          className={styles.playAllButton}
          onClick={isPlaying ? onStop : onPlay}
          disabled={chords.length === 0}
          aria-label={isPlaying ? "Stop playback" : "Play all chords"}
        >
          {isPlaying ? "■ Stop" : "▶ Play All"}
        </button>
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
        {chords.map((chord, i) => {
          const elements: React.ReactElement[] = [];

          // Render the chord tile
          elements.push(
            <ChordTile
              key={`tile-${i}-${chord.root}-${chord.quality}`}
              ref={(el) => { tileRefs.current[i] = el; }}
              chord={chord}
              index={i}
              isFirst={i === 0}
              isLast={i === chords.length - 1}
              isNew={newTileIndex === i}
              isPlaying={playingIndex === i}
              onMoveUp={() => onMoveUp(i)}
              onMoveDown={() => onMoveDown(i)}
              onDelete={() => onDelete(i)}
              onAnimationEnd={() => setNewTileIndex(null)}
            />
          );

          // Render the pair metric badge after each tile (except the last)
          if (i < chords.length - 1 && pairMetrics[i]) {
            const metric = pairMetrics[i];
            const chordAName = getChordName(chord.root, chord.quality, pitchClasses);
            const chordBName = getChordName(chords[i + 1].root, chords[i + 1].quality, pitchClasses);
            const ariaLabel = `${metric.sharedCount} notes in common between ${chordAName} and ${chordBName}, ${Math.round(metric.proportion * 100)} percent`;

            elements.push(
              <li key={`metric-${i}`} className={styles.metricListItem} role="presentation">
                <PairMetricBadge metric={metric} ariaLabel={ariaLabel} />
              </li>
            );
          }

          return elements;
        })}
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
