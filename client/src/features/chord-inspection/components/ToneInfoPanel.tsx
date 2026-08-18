import { useState, useCallback } from "react";
import type { ToneInfo } from "../types/tone-info";
import styles from "./ToneInfoPanel.module.css";

interface ToneInfoPanelProps {
  selectedTone: ToneInfo | null;
  onClose?: () => void;
}

export function ToneInfoPanel({ selectedTone, onClose }: ToneInfoPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyFrequency = useCallback(() => {
    if (selectedTone === null) return;
    navigator.clipboard.writeText(selectedTone.frequency.toFixed(2)).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => { /* clipboard write failed silently */ },
    );
  }, [selectedTone]);

  if (selectedTone === null) return null;

  return (
    <div className={styles.panel} aria-label="Tone information panel" aria-live="polite">
      <div className={styles.header}>
        <h3 className={styles.title}>{selectedTone.note.name}</h3>
        {onClose && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close tone info panel"
          >
            ×
          </button>
        )}
      </div>
      {selectedTone.enharmonicEquivalent !== undefined && (
        <>
          <p className={styles.label}>Enharmonic Equivalent</p>
          <p className={styles.value}>{selectedTone.enharmonicEquivalent}</p>
        </>
      )}
      {selectedTone.scaleDegree !== undefined && (
        <>
          <p className={styles.label}>Scale Degree</p>
          <p className={styles.value}>{selectedTone.scaleDegree}</p>
        </>
      )}
      <p className={styles.label}>Frequency</p>
      <p className={styles.value}>
        <button
          className={styles.copyButton}
          onClick={handleCopyFrequency}
          aria-label="Copy frequency value"
          title="Click to copy"
        >
          {selectedTone.frequency.toFixed(2)}
        </button>
        {" "}Hz{copied && <span className={styles.copiedLabel} aria-hidden="true">Copied!</span>}
      </p>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {copied ? "Frequency copied to clipboard" : ""}
      </div>
    </div>
  );
}
