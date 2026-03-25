import React, { useState, useRef, useEffect, useMemo } from "react";
import type { Chord } from "@/features/current-chord/types";
import { ChordTile } from "./ChordTile";
import { PairMetricBadge } from "./PairMetricBadge";
import { BridgeSuggestionIcon } from "./BridgeSuggestionIcon";
import { BridgeSuggestionPopover } from "./BridgeSuggestionPopover";
import { computeProgressionPairMetrics } from "../utils/pairMetrics";
import type { PairMetric } from "../utils/pairMetrics";
import { useBridgeSuggestions } from "../hooks/useBridgeSuggestions";
import type { ScaleContext } from "../hooks/useBridgeSuggestions";
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
  loop: boolean;
  onToggleLoop: () => void;
  chordDurationMs: number;
  onChordDurationChange: (ms: number) => void;
  scale?: ScaleContext | null;
  onApplyBridge?: (insertAfterIndex: number, bridge: Chord[]) => void;
  onPreviewBridge?: (source: Chord, bridge: Chord[], target: Chord, insertAfterIndex: number) => void;
  onStopPreview?: () => void;
  previewBridge?: Chord[] | null;
  previewInsertAfterIndex?: number | null;
  isPreviewPlaying?: boolean;
}

const DURATION_OPTIONS: { label: string; ms: number }[] = [
  { label: "Slow", ms: 2000 },
  { label: "Medium", ms: 1200 },
  { label: "Fast", ms: 600 },
];

// ── Inner component: renders the gap between two chord tiles ─────────────

interface BridgeGapRowProps {
  chords: Chord[];
  index: number;
  scale: ScaleContext | null;
  maxProgressionLength: number;
  metric: PairMetric;
  metricAriaLabel: string;
  sourceChordName: string;
  targetChordName: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onApply: (insertAfterIndex: number, bridge: Chord[]) => void;
  onPreview: (source: Chord, bridge: Chord[], target: Chord, insertAfterIndex: number) => void;
  onStopPreview: () => void;
  previewingBridge: Chord[] | null;
}

function BridgeGapRow({
  chords,
  index,
  scale,
  maxProgressionLength,
  metric,
  metricAriaLabel,
  sourceChordName,
  targetChordName,
  isOpen,
  onToggle,
  onClose,
  onApply,
  onPreview,
  onStopPreview,
  previewingBridge,
}: BridgeGapRowProps) {
  const suggestions = useBridgeSuggestions(chords, index, scale);
  // Ref to the icon trigger button — used to restore focus when the popover closes
  const iconRef = useRef<HTMLButtonElement>(null);

  function handleClose() {
    onClose();
    // Return focus to the trigger icon button after closing the popover
    setTimeout(() => iconRef.current?.focus(), 0);
  }

  return (
    <li className={styles.metricListItem} role="presentation">
      <PairMetricBadge metric={metric} ariaLabel={metricAriaLabel} />
      <BridgeSuggestionIcon
        ref={iconRef}
        suggestionCount={suggestions.length}
        sourceChordName={sourceChordName}
        targetChordName={targetChordName}
        isOpen={isOpen}
        onToggle={onToggle}
      />
      {isOpen && (
        <BridgeSuggestionPopover
          suggestions={suggestions}
          sourceChordName={sourceChordName}
          targetChordName={targetChordName}
          insertAfterIndex={index}
          progressionLength={chords.length}
          maxProgressionLength={maxProgressionLength}
          onApply={(bridge) => onApply(index, bridge)}
          onPreview={(bridge) => onPreview(chords[index], bridge, chords[index + 1], index)}
          onStopPreview={onStopPreview}
          previewingBridge={previewingBridge}
          onClose={handleClose}
          triggerRef={iconRef}
        />
      )}
    </li>
  );
}

// ── Main component ───────────────────────────────────────────────────────

export function ProgressionSidebar({
  chords,
  onMoveUp,
  onMoveDown,
  onDelete,
  maxLength,
  isPlaying,
  playingIndex,
  onPlay,
  onStop,
  loop,
  onToggleLoop,
  chordDurationMs,
  onChordDurationChange,
  scale = null,
  onApplyBridge,
  onPreviewBridge,
  onStopPreview,
  previewBridge = null,
  previewInsertAfterIndex = null,
}: ProgressionSidebarProps) {
  const { pitchClasses } = useEnharmonic();
  const isFull = chords.length >= maxLength;
  const [newTileIndex, setNewTileIndex] = useState<number | null>(null);
  const [prevLength, setPrevLength] = useState(chords.length);
  const tileRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [openBridgeIndex, setOpenBridgeIndex] = useState<number | null>(null);

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
        <div className={styles.titleRow}>
          <h2 className={styles.heading}>Progression</h2>
          <span className={styles.count} aria-label={`${chords.length} of ${maxLength} chords`}>
            {chords.length}/{maxLength}
          </span>
        </div>
        <div className={styles.controls}>
          <label className={styles.durationLabel} htmlFor="chord-duration-select">
            Speed
          </label>
          <select
            id="chord-duration-select"
            className={styles.durationSelect}
            value={chordDurationMs}
            aria-label="Chord duration"
            onChange={(e) => onChordDurationChange(Number(e.target.value))}
          >
            {DURATION_OPTIONS.map(({ label, ms }) => (
              <option key={ms} value={ms}>{label}</option>
            ))}
          </select>
          <button
            className={styles.playAllButton}
            onClick={isPlaying ? onStop : onPlay}
            disabled={chords.length === 0}
            aria-label={isPlaying ? "Stop playback" : "Play all chords"}
          >
            {isPlaying ? "■ Stop" : "▶ Play All"}
          </button>
          <button
            className={`${styles.loopButton}${loop ? ` ${styles.loopButtonActive}` : ""}`}
            onClick={onToggleLoop}
            disabled={chords.length === 0}
            aria-label={loop ? "Disable loop" : "Enable loop"}
            aria-pressed={loop}
          >
            ↻ Loop
          </button>
        </div>
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

          // Render ghost tiles immediately after the source chord during preview
          if (previewBridge !== null && previewInsertAfterIndex === i) {
            previewBridge.forEach((ghostChord, gi) => {
              elements.push(
                <ChordTile
                  key={`ghost-${i}-${gi}`}
                  chord={ghostChord}
                  index={i + gi + 1}
                  isFirst={false}
                  isLast={false}
                  isGhost={true}
                  onDelete={() => {}}
                />
              );
            });
          }

          // Render the gap (metric badge + bridge suggestion) after each tile except the last
          if (i < chords.length - 1 && pairMetrics[i]) {
            const metric = pairMetrics[i];
            const chordAName = getChordName(chord.root, chord.quality, pitchClasses);
            const chordBName = getChordName(chords[i + 1].root, chords[i + 1].quality, pitchClasses);
            const ariaLabel = `${metric.sharedCount} notes in common between ${chordAName} and ${chordBName}, ${Math.round(metric.proportion * 100)} percent`;

            elements.push(
              <BridgeGapRow
                key={`gap-${i}`}
                chords={chords}
                index={i}
                scale={scale}
                maxProgressionLength={maxLength}
                metric={metric}
                metricAriaLabel={ariaLabel}
                sourceChordName={chordAName}
                targetChordName={chordBName}
                isOpen={openBridgeIndex === i}
                onToggle={() =>
                  setOpenBridgeIndex((prev) => (prev === i ? null : i))
                }
                onClose={() => setOpenBridgeIndex(null)}
                onApply={onApplyBridge ?? (() => {})}
                onPreview={onPreviewBridge ?? (() => {})}
                onStopPreview={onStopPreview ?? (() => {})}
                previewingBridge={previewBridge}
              />
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

