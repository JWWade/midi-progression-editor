import React, { useEffect, useRef } from "react";
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
}: BridgeSuggestionPopoverProps): React.ReactElement {
  const { pitchClasses } = useEnharmonic();
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus into the popover when it opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

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
          onClick={onClose}
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
                aria-label={`Preview bridge: ${chordNames}`}
                onClick={() => onPreview(suggestion.bridge)}
              >
                ▶
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
