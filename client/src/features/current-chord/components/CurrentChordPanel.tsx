import { useState, useCallback } from "react";
import type { Chord } from "../types";
import { formatChordName, formatPrimitiveChordName, CHORD_QUALITY_LABELS } from "../utils/chordName";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";
import { getCircleColorForTheme } from "@/features/chromatic-circle/utils/circleColors";
import { ChordColors } from "@/features/color-language/constants/chordColors";
import { getChordComplexity, getChordColor, getAccessibleTextColor } from "@/features/color-language/utils/chordColorUtils";
import { ChordThumbnail } from "./ChordThumbnail";
import styles from "./CurrentChordPanel.module.css";
import { isCustomChord } from "../utils/chordTypeGuards";
import { useTheme } from "@/app/providers/useTheme";
import { useEnharmonic } from "@/app/providers/useEnharmonic";

interface CurrentChordPanelProps {
  chord: Chord | null;
  onAddChord: () => void;
  /** Optional diatonic indices for the active key, forwarded to the thumbnail. */
  diatonicIndices?: Set<number>;
  /** Whether the progression has reached its maximum length. */
  isProgressionFull?: boolean;
  /** Current number of chords in the progression. */
  progressionLength?: number;
  /** Maximum number of chords allowed in the progression. */
  maxProgressionLength?: number;
}

export function CurrentChordPanel({
  chord,
  onAddChord,
  diatonicIndices,
  isProgressionFull = false,
  progressionLength = 0,
  maxProgressionLength = 8,
}: CurrentChordPanelProps) {
  const { theme } = useTheme();
  const { pitchClasses } = useEnharmonic();

  const noteIndices = chord
    ? (isCustomChord(chord) ? chord.customNotes : getChordNoteIndices(chord.root, chord.quality))
    : [];
  const isDisabled = chord === null || isProgressionFull;
  const [pressing, setPressing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    if (isDisabled) return;
    onAddChord();
    setIsAnimating(true);
  }, [isDisabled, onAddChord]);

  const handlePointerDown = useCallback(() => {
    if (!isDisabled) setPressing(true);
  }, [isDisabled]);

  const handlePointerUp = useCallback(() => {
    setPressing(false);
  }, []);

  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const panelBg = chord
    ? getCircleColorForTheme(chord.root, chord.quality, theme, "panel")
    : undefined;

  const complexity = chord ? getChordComplexity(chord) : "triad" as const;
  const qualityColors = chord ? ChordColors[chord.quality] : null;
  const qualityBase = chord ? getChordColor(chord.quality, complexity) : null;
  const buttonTextColor = qualityBase ? getAccessibleTextColor(qualityBase) : "#ffffff";

  const buttonClassName = [
    styles.addButton,
    isDisabled ? styles.addButtonDisabled : "",
    !isDisabled && pressing ? styles.addButtonActive : "",
    !isDisabled && isAnimating ? styles.addButtonAnimating : "",
  ]
    .filter(Boolean)
    .join(" ");

  const panelStyle = {
    ...(panelBg ? { "--chord-panel-bg": panelBg } : {}),
    ...(qualityBase ? {
      "--chord-quality-base": qualityBase,
      "--chord-quality-dark": qualityColors?.dark,
      "--chord-quality-text": buttonTextColor,
    } : {}),
  } as React.CSSProperties;

  const buttonAriaLabel = isProgressionFull
    ? `Progression is full (${progressionLength}/${maxProgressionLength})`
    : "Add chord to progression";

  const buttonTitle = isProgressionFull
    ? `Progression is full (${progressionLength}/${maxProgressionLength})`
    : undefined;

  return (
    <div
      className={styles.panel}
      style={panelStyle}
      aria-label="Current chord panel"
    >
      <span className={styles.sectionLabel}>Current Chord</span>
      <div className={styles.thumbnail}>
        <ChordThumbnail
          noteIndices={noteIndices}
          quality={chord?.quality ?? "major"}
          complexity={complexity}
          size={80}
          diatonicIndices={diatonicIndices}
        />
      </div>
      {chord === null ? (
        <span className={styles.placeholder} aria-live="polite" aria-atomic="true">No chord selected</span>
      ) : (
        <>
          <span className={styles.chordName} aria-live="polite" aria-atomic="true">
            {isCustomChord(chord)
              ? (chord.primitiveShape === "equilateral-triangle"
                ? formatChordName(chord, pitchClasses)
                : chord.primitiveShape
                  ? formatPrimitiveChordName(chord, pitchClasses)
                : chord.customNotes.map(i => pitchClasses[i]).join(" "))
              : formatChordName(chord, pitchClasses)
            }
          </span>
          <div className={styles.rootQualityRow}>
            <span className={styles.root}>{pitchClasses[chord.root]}</span>
            <span className={styles.quality}>
              {isCustomChord(chord)
                ? (chord.primitiveShape === "equilateral-triangle"
                  ? CHORD_QUALITY_LABELS[chord.quality]
                  : chord.primitiveShape === "suspended-triangle"
                    ? "sus4"
                  : chord.primitiveShape
                    ? CHORD_QUALITY_LABELS[chord.quality]
                    : "(custom)")
                : CHORD_QUALITY_LABELS[chord.quality]}
            </span>
          </div>
        </>
      )}
      <button
        className={buttonClassName}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onAnimationEnd={handleAnimationEnd}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label={buttonAriaLabel}
        title={buttonTitle}
      >
        Add to Progression &#8594;
      </button>
      {isProgressionFull && (
        <span className={styles.fullMessage} role="status">
          Progression is full ({progressionLength}/{maxProgressionLength})
        </span>
      )}
    </div>
  );
}
