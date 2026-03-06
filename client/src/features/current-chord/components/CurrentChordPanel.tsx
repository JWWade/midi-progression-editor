import { useState, useCallback } from "react";
import type { Chord } from "../types";
import { formatChordName, CHORD_QUALITY_LABELS } from "../utils/chordName";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";
import { getCircleColor } from "@/features/chromatic-circle/utils/circleColors";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import { ChordThumbnail } from "./ChordThumbnail";
import styles from "./CurrentChordPanel.module.css";

interface CurrentChordPanelProps {
  chord: Chord | null;
  onAddChord: () => void;
}

export function CurrentChordPanel({ chord, onAddChord }: CurrentChordPanelProps) {
  const noteIndices = chord ? getChordNoteIndices(chord.root, chord.quality) : [];
  const isDisabled = chord === null;
  const [pressing, setPressing] = useState(false);

  const handleClick = useCallback(() => {
    if (isDisabled) return;
    onAddChord();
  }, [isDisabled, onAddChord]);

  const handlePointerDown = useCallback(() => {
    if (!isDisabled) setPressing(true);
  }, [isDisabled]);

  const handlePointerUp = useCallback(() => {
    setPressing(false);
  }, []);

  const panelBg = chord
    ? getCircleColor(chord.root, chord.quality)
    : undefined;

  const qualityColors = chord ? ChordQualityColors[chord.quality] : null;

  const panelStyle = {
    ...(panelBg ? { "--chord-panel-bg": panelBg } : {}),
    ...(qualityColors ? {
      "--chord-quality-base": qualityColors.base,
      "--chord-quality-dark": qualityColors.dark,
    } : {}),
  } as React.CSSProperties;

  const buttonClassName = [
    styles.addButton,
    isDisabled ? styles.addButtonDisabled : "",
    !isDisabled && pressing ? styles.addButtonActive : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={styles.panel}
      style={panelStyle}
      aria-label="Current chord panel"
      aria-live="polite"
    >
      <span className={styles.sectionLabel}>Current Chord</span>
      <div className={styles.thumbnail}>
        <ChordThumbnail
          noteIndices={noteIndices}
          quality={chord?.quality ?? "major"}
          size={80}
        />
      </div>
      {chord === null ? (
        <span className={styles.placeholder}>No chord selected</span>
      ) : (
        <>
          <span className={styles.chordName}>{formatChordName(chord)}</span>
          <div className={styles.rootQualityRow}>
            <span className={styles.root}>{PITCH_CLASSES[chord.root]}</span>
            <span className={styles.quality}>{CHORD_QUALITY_LABELS[chord.quality]}</span>
          </div>
        </>
      )}
      <button
        className={buttonClassName}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label="Add chord to progression"
      >
        Add to Progression &#8594;
      </button>
    </div>
  );
}
