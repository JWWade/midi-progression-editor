import React, { useState, useRef, useEffect, useMemo, memo } from "react";
import type { Chord } from "@/features/current-chord/types";
import type { ProgressionNode } from "../types";
import { ChordTile } from "./ChordTile";
import { PairMetricBadge } from "./PairMetricBadge";
import { BridgeSuggestionIcon } from "./BridgeSuggestionIcon";
import { BridgeSuggestionPopover } from "./BridgeSuggestionPopover";
import { computeProgressionPairMetrics } from "../utils/pairMetrics";
import type { PairMetric } from "../utils/pairMetrics";
import { useBridgeSuggestions } from "../hooks/useBridgeSuggestions";
import type { ScaleContext } from "@/shared/types/ScaleContext";
import { MidiExportControls } from "@/features/midi-export/components/MidiExportControls";
import { getChordName } from "@/features/chord/data/chordNames";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import styles from "./ProgressionSidebar.module.css";

/** Must match the `tileHighlight` animation duration in ChordTile.module.css */
const HIGHLIGHT_ANIMATION_DURATION_MS = 300;

interface ProgressionSidebarProps {
  /** All progression nodes in display order. */
  nodes: ProgressionNode[];
  /** Chord-only subset of nodes (used for playback and metric labels). */
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

const BridgeGapRow = memo(function BridgeGapRow({
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
});

// ── Main component ───────────────────────────────────────────────────────

export function ProgressionSidebar({
  nodes,
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
  const chordCount = chords.length;

  // Track the node-index of the most recently added tile for scroll/focus/animation.
  const [newTileNodeIndex, setNewTileNodeIndex] = useState<number | null>(null);
  const [prevNodeCount, setPrevNodeCount] = useState(nodes.length);
  // tileRefs is indexed by node index for scroll/focus control.
  const tileRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [openBridgeIndex, setOpenBridgeIndex] = useState<number | null>(null);

  // Compute pair metrics for the chord-only subset
  const pairMetrics = useMemo(() => computeProgressionPairMetrics(chords), [chords]);

  // Derive newTileNodeIndex during render when the node list changes.
  // React-documented derived-state pattern; avoids setState-in-effect.
  if (nodes.length !== prevNodeCount) {
    setPrevNodeCount(nodes.length);
    if (nodes.length > prevNodeCount) {
      // Highlight the last added node.
      setNewTileNodeIndex(nodes.length - 1);
    } else {
      // A node was deleted; clear stale highlight
      setNewTileNodeIndex(null);
    }
  }

  // Scroll to and focus the newly added tile
  useEffect(() => {
    if (newTileNodeIndex === null) return;
    const el = tileRefs.current[newTileNodeIndex];
    if (!el) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
    const focusTimer = setTimeout(() => {
      tileRefs.current[newTileNodeIndex]?.focus();
    }, HIGHLIGHT_ANIMATION_DURATION_MS);
    return () => clearTimeout(focusTimer);
  }, [newTileNodeIndex]);

  /**
   * Builds the flat list of rendered tile elements from the node array.
   * Chord tiles include gap rows and optional ghost bridge-preview tiles.
   *
   * Defined as a named helper (not an IIFE) for readability.
   */
  function buildProgressionTiles(): React.ReactElement[] {
    const elements: React.ReactElement[] = [];

    nodes.forEach((node, nodeIndex) => {
      const ci = nodeIndex;
      const chord = node.value;

      elements.push(
        <ChordTile
          key={node.id}
          ref={(el) => { tileRefs.current[nodeIndex] = el; }}
          chord={chord}
          index={ci}
          isFirst={ci === 0}
          isLast={ci === chordCount - 1}
          isNew={newTileNodeIndex === nodeIndex}
          isPlaying={playingIndex === ci}
          onMoveUp={() => onMoveUp(ci)}
          onMoveDown={() => onMoveDown(ci)}
          onDelete={() => onDelete(ci)}
          onAnimationEnd={() => setNewTileNodeIndex(null)}
          onWillPlay={isPlaying ? onStop : undefined}
        />,
      );

      // Render ghost bridge-preview tiles immediately after this chord
      if (previewBridge !== null && previewInsertAfterIndex === ci) {
        previewBridge.forEach((ghostChord, gi) => {
          elements.push(
            <ChordTile
              key={`ghost-${ci}-${gi}`}
              chord={ghostChord}
              index={ci + gi + 1}
              isFirst={false}
              isLast={false}
              isGhost={true}
              onDelete={() => {}}
            />,
          );
        });
      }

      // Gap row between consecutive chord tiles (not after the last chord)
      if (ci < chordCount - 1 && pairMetrics[ci]) {
        const metric = pairMetrics[ci];
        const chordAName = getChordName(chord.root, chord.quality, pitchClasses);
        const chordBName = getChordName(chords[ci + 1].root, chords[ci + 1].quality, pitchClasses);
        const ariaLabel = `${metric.sharedCount} notes in common between ${chordAName} and ${chordBName}, ${Math.round(metric.proportion * 100)} percent`;

        elements.push(
          <BridgeGapRow
            key={`gap-${ci}`}
            chords={chords}
            index={ci}
            scale={scale}
            maxProgressionLength={maxLength}
            metric={metric}
            metricAriaLabel={ariaLabel}
            sourceChordName={chordAName}
            targetChordName={chordBName}
            isOpen={openBridgeIndex === ci}
            onToggle={() =>
              setOpenBridgeIndex((prev) => (prev === ci ? null : ci))
            }
            onClose={() => setOpenBridgeIndex(null)}
            onApply={onApplyBridge ?? (() => {})}
            onPreview={onPreviewBridge ?? (() => {})}
            onStopPreview={onStopPreview ?? (() => {})}
            previewingBridge={previewBridge}
          />,
        );
      }
    });

    return elements;
  }

  return (
    <aside
      className={styles.sidebar}
      aria-label="Chord progression"
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.heading}>Progression</h2>
          <span className={styles.count} aria-label={`${chordCount} of ${maxLength} chords`}>
            {chordCount}/{maxLength}
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
            disabled={chordCount === 0}
            aria-label={isPlaying ? "Stop playback" : "Play all chords"}
          >
            {isPlaying ? "■ Stop" : "▶ Play All"}
          </button>
          <button
            className={`${styles.loopButton}${loop ? ` ${styles.loopButtonActive}` : ""}`}
            onClick={onToggleLoop}
            disabled={chordCount === 0}
            aria-label={loop ? "Disable loop" : "Enable loop"}
            aria-pressed={loop}
          >
            ↻ Loop
          </button>
        </div>
      </div>
      <p className={styles.resetNote}>Resets on page reload</p>
      <ol className={styles.chordList} aria-label="Chord list">
        {nodes.length === 0 && (
          <div className={styles.emptyState} aria-live="polite">
            <span className={styles.emptyIcon} aria-hidden="true">♩</span>
            <p className={styles.emptyMessage}>
              Your progression is empty. Build a chord on the circle and add it here.
            </p>
          </div>
        )}
        {buildProgressionTiles()}
      </ol>
      {isFull && (
        <div className={styles.fullIndicator} role="status" aria-live="polite">
          Maximum {maxLength} chords reached
        </div>
      )}
      <MidiExportControls chords={chords} disabled={chordCount === 0} scaleContext={scale ?? null} />
    </aside>
  );
}

