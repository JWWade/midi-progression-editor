import React, { useCallback, useEffect, useRef } from "react";
import type { BridgeSuggestion } from "@/features/ii-v-suggestions";
import type { Chord } from "@/features/current-chord/types";
import { getChordName } from "@/features/chord/data/chordNames";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import styles from "./BridgeSuggestionPopover.module.css";

export interface BridgeSuggestionPopoverProps {
  suggestions: BridgeSuggestion[];
  sourceChordName: string;
  targetChordName: string;
  insertAfterIndex: number;
  progressionLength: number;
  maxProgressionLength: number;
  onApply: (bridge: Chord[]) => void;
  onPreview: (bridge: Chord[]) => void;
  onClose: () => void;
  /** The bridge currently being previewed (null when no preview is active). */
  previewBridge?: Chord[] | null;
  /** Whether the preview sequence is currently playing. */
  isPreviewPlaying?: boolean;
  /** Stops the in-progress preview. */
  onStopPreview?: () => void;
}

/** Returns true when two bridge arrays represent the same sequence of chords. */
function bridgesMatch(a: Chord[], b: Chord[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (c, i) => c.root === b[i].root && c.quality === b[i].quality,
  );
}

/** Format an ordered list of bridge chords into "Am7 → D7" style. */
function formatBridgeChordNames(
  bridge: Chord[],
  pitchClasses: readonly string[],
): string {
  return bridge
    .map((c) => getChordName(c.root, c.quality, pitchClasses))
    .join(" → ");
}

export function BridgeSuggestionPopover({
  suggestions,
  sourceChordName,
  targetChordName,
  progressionLength,
  maxProgressionLength,
  onApply,
  onPreview,
  onClose,
  previewBridge = null,
  isPreviewPlaying = false,
  onStopPreview,
}: BridgeSuggestionPopoverProps): React.ReactElement {
  const { pitchClasses } = useEnharmonic();
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus into the popover when it opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const handleClose = useCallback(() => {
    onStopPreview?.();
    onClose();
  }, [onClose, onStopPreview]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  // Close on outside click
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [handleClose]);

  return (
    <div
      ref={popoverRef}
      className={styles.popover}
      role="dialog"
      aria-label={`ii–V bridge suggestions between ${sourceChordName} and ${targetChordName}`}
    >
      <div className={styles.header}>
        <p className={styles.title}>ii–V Bridge</p>
        <button
          ref={closeButtonRef}
          className={styles.closeButton}
          type="button"
          aria-label="Close bridge suggestions"
          onClick={handleClose}
        >
          ✕
        </button>
      </div>
      <ul className={styles.suggestionList}>
        {suggestions.map((suggestion, idx) => {
          const chordNames = formatBridgeChordNames(
            suggestion.bridge,
            pitchClasses,
          );
          const wouldExceedCap =
            progressionLength + suggestion.bridge.length > maxProgressionLength;
          const rowAriaLabel = `${chordNames} — ${suggestion.label} — score ${suggestion.score.toFixed(2)}`;
          const isThisPreviewPlaying =
            isPreviewPlaying &&
            previewBridge !== null &&
            bridgesMatch(suggestion.bridge, previewBridge);

          return (
            <li
              key={idx}
              className={styles.suggestionRow}
              aria-label={rowAriaLabel}
            >
              <span className={styles.chordNames}>{chordNames}</span>
              <span className={styles.label}>{suggestion.label}</span>
              <div className={styles.scoreBarContainer}>
                <div
                  className={styles.scoreBarFill}
                  style={{ width: `${suggestion.score * 100}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className={styles.score}>{suggestion.score.toFixed(2)}</span>
              <button
                className={styles.actionButton}
                type="button"
                aria-label={
                  isThisPreviewPlaying
                    ? "Stop preview"
                    : `Preview bridge: ${chordNames}`
                }
                onClick={() => {
                  if (isThisPreviewPlaying) {
                    onStopPreview?.();
                  } else {
                    onPreview(suggestion.bridge);
                  }
                }}
              >
                {isThisPreviewPlaying ? "■" : "▶"}
              </button>
              <button
                className={`${styles.actionButton} ${styles.applyButton}`}
                type="button"
                aria-label={`Apply bridge: ${chordNames}`}
                aria-disabled={wouldExceedCap ? "true" : undefined}
                title={
                  wouldExceedCap
                    ? `Adding this bridge would exceed the ${maxProgressionLength}-chord limit`
                    : undefined
                }
                disabled={wouldExceedCap}
                onClick={() => onApply(suggestion.bridge)}
              >
                ✓
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
