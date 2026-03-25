import React, { useEffect, useRef } from "react";
import type { BridgeSuggestion } from "@/features/ii-v-suggestions";
import type { Chord } from "@/features/current-chord/types";
import { getChordName } from "@/features/chord/data/chordNames";
import {
  generateBridgeLabel,
  generateBridgeExplanation,
} from "@/features/ii-v-suggestions/utils/bridgeLabel";
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
  onStopPreview: () => void;
  previewingBridge: Chord[] | null;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
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
  onStopPreview,
  previewingBridge,
  onClose,
  triggerRef,
}: BridgeSuggestionPopoverProps): React.ReactElement | null {
  const { pitchClasses } = useEnharmonic();
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus into the popover when it opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Close on Escape key — also stop any in-progress preview
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onStopPreview();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onStopPreview]);

  // Close on outside click — also stop any in-progress preview
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !(triggerRef?.current && triggerRef.current.contains(e.target as Node))
      ) {
        onStopPreview();
        onClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose, onStopPreview, triggerRef]);

  // Guard: popover requires at least two chords in the progression
  if (progressionLength < 2) return null;

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
          onClick={() => { onStopPreview(); onClose(); }}
        >
          ✕
        </button>
      </div>
      <ul className={styles.suggestionList}>
        {suggestions.length === 0 ? (
          <li className={styles.emptyState}>No bridge suggestions</li>
        ) : (
          suggestions.map((suggestion, idx) => {
          const chordNames = formatBridgeChordNames(
            suggestion.bridge,
            pitchClasses,
          );
          const label = generateBridgeLabel(
            suggestion,
            targetChordName,
            pitchClasses,
          );
          const explanation = generateBridgeExplanation(
            suggestion,
            targetChordName,
            pitchClasses,
          );
          const wouldExceedCap =
            progressionLength + suggestion.bridge.length > maxProgressionLength;
          const rowAriaLabel = `${chordNames} — ${label} — score ${suggestion.score.toFixed(2)}`;

          return (
            <li
              key={idx}
              className={styles.suggestionRow}
              aria-label={rowAriaLabel}
            >
              <span className={styles.chordNames}>{chordNames}</span>
              <span className={styles.label}>{label}</span>
              <div className={styles.scoreBarContainer}>
                <div
                  className={styles.scoreBarFill}
                  style={{ width: `${suggestion.score * 100}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className={styles.score}>{suggestion.score.toFixed(2)}</span>
              {(() => {
                // Reference equality is intentional: startPreview stores the exact
                // suggestion.bridge reference, so this correctly identifies the active row.
                const isThisPreviewPlaying = previewingBridge === suggestion.bridge;
                return (
                  <button
                    className={styles.actionButton}
                    type="button"
                    aria-label={isThisPreviewPlaying ? "Stop preview" : `Preview bridge: ${chordNames}`}
                    onClick={() => isThisPreviewPlaying ? onStopPreview() : onPreview(suggestion.bridge)}
                  >
                    {isThisPreviewPlaying ? "■" : "▶"}
                  </button>
                );
              })()}
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
                onClick={() => { onApply(suggestion.bridge); onClose(); }}
              >
                ✓
              </button>
              <span className={styles.explanation}>{explanation}</span>
            </li>
          );
        })
        )}
      </ul>
    </div>
  );
}
