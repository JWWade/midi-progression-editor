import React from "react";
import styles from "./BridgeSuggestionIcon.module.css";

export interface BridgeSuggestionIconProps {
  suggestionCount: number;
  sourceChordName: string;
  targetChordName: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const BridgeSuggestionIcon = React.forwardRef<
  HTMLButtonElement,
  BridgeSuggestionIconProps
>(function BridgeSuggestionIcon(
  { suggestionCount, sourceChordName, targetChordName, isOpen, onToggle },
  ref,
): React.ReactElement | null {
  if (suggestionCount === 0) {
    return null;
  }

  return (
    <button
      ref={ref}
      className={styles.iconButton}
      type="button"
      aria-label={`Show ii–V bridge suggestions between ${sourceChordName} and ${targetChordName}`}
      aria-expanded={isOpen}
      title={`ii–V bridge suggestions (${suggestionCount} available)`}
      onClick={onToggle}
    >
      <span className={styles.glyph} aria-hidden="true">⟿</span>
      <span className={styles.count}>{suggestionCount}</span>
    </button>
  );
});
