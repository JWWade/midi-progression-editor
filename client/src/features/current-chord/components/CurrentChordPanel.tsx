import { useState, useCallback, useEffect, memo } from "react";
import type { Chord } from "../types";
import {
  formatChordName,
  formatChordSymbol,
  formatPrimitiveChordName,
  resolveChordIdentity,
} from "../utils/chordName";
import { transposeChord, CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import { getChordPitchClasses } from "@/features/chord/utils";
import { getCircleColorForTheme } from "@/features/chromatic-circle/utils/circleColors";
import { ChordColors } from "@/features/color-language/constants/chordColors";
import { getChordComplexity, getChordColor, getAccessibleTextColor } from "@/features/color-language/utils/chordColorUtils";
import { ChordThumbnail } from "./ChordThumbnail";
import styles from "./CurrentChordPanel.module.css";
import { isCustomChord } from "../utils/chordTypeGuards";
import { useTheme } from "@/app/providers/useTheme";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import { useAudioPlayback } from "@/features/audio";
import type { AudioParams } from "@/features/audio/constants/audioConfig";
import { getRomanNumeral } from "../utils/romanNumeral";
import type { ScaleType } from "@/features/scale/types";
import type { SetKeyContextAction } from "@/features/scale";

/** Duration the "Copied!" feedback badge remains visible (milliseconds). */
const COPY_FEEDBACK_DURATION_MS = 1500;

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
  /** Audio playback parameters. */
  audioParams?: AudioParams;
  /** Active key root (pitch class 0–11) for Roman numeral display. */
  keyRoot?: number;
  /** Active key scale for Roman numeral display. */
  keyScale?: ScaleType;
  /** Callback to update the key context (primary tonic-snap affordance). */
  onSetKeyContext?: (action: SetKeyContextAction) => void;
}

export const CurrentChordPanel = memo(function CurrentChordPanel({
  chord,
  onAddChord,
  diatonicIndices,
  isProgressionFull = false,
  progressionLength = 0,
  maxProgressionLength = 8,
  audioParams,
  keyRoot,
  keyScale,
  onSetKeyContext,
}: CurrentChordPanelProps) {
  const { theme } = useTheme();
  const { pitchClasses } = useEnharmonic();
  const { isPlaying, play, stop } = useAudioPlayback(audioParams);

  const noteIndices = chord ? getChordPitchClasses(chord) : [];
  const isDisabled = chord === null || isProgressionFull;
  const [pressing, setPressing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [copied, setCopied] = useState(false);

  const noteNames = noteIndices.map(i => pitchClasses[i]).join('-');
  const resolvedIdentity = chord ? resolveChordIdentity(chord) : null;

  // Roman numeral analysis relative to the declared key
  const romanAnalysis =
    chord !== null && keyRoot !== undefined && keyScale !== undefined
      ? getRomanNumeral(
          resolvedIdentity?.root ?? chord.root,
          keyRoot,
          keyScale,
          resolvedIdentity?.quality ?? chord.quality,
        )
      : null;

  // Primary tonic-snap: set the key root to this chord's root, preserving mode
  const handleSetAsTonic = useCallback(() => {
    if (!chord || !onSetKeyContext || keyScale === undefined) return;
    onSetKeyContext({
      root: resolvedIdentity?.root ?? chord.root,
      scale: keyScale,
      source: "tonicSnap",
    });
  }, [chord, resolvedIdentity, keyScale, onSetKeyContext]);

  const handleClick = useCallback(() => {
    if (isDisabled) return;
    onAddChord();
    setIsAnimating(true);
  }, [isDisabled, onAddChord, setIsAnimating]);

  const handlePointerDown = useCallback(() => {
    if (!isDisabled) setPressing(true);
  }, [isDisabled, setPressing]);

  const handlePointerUp = useCallback(() => {
    setPressing(false);
  }, [setPressing]);

  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false);
  }, [setIsAnimating]);

  const handleCopy = useCallback(() => {
    if (!chord) return;
    navigator.clipboard.writeText(noteNames).catch(() => {
      // Silently fail if clipboard write is denied
    });
    setCopied(true);
  }, [chord, noteNames, setCopied]);

  const handlePlay = useCallback(() => {
    if (!chord) return;
    if (isPlaying) {
      stop();
      return;
    }
    const notes = isCustomChord(chord)
      ? chord.customNotes.map((idx) => ({
          index: idx,
          name: pitchClasses[idx],
          role: "root" as const,
        }))
      : transposeChord(CHORD_INTERVALS[chord.quality], chord.root, pitchClasses);
    void play(notes);
  }, [chord, isPlaying, stop, play, pitchClasses]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    return () => clearTimeout(timer);
  }, [copied]);

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
          rootIndex={resolvedIdentity?.root ?? chord?.root}
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
                : formatChordSymbol(chord, pitchClasses))
              : formatChordName(chord, pitchClasses)
            }
          </span>
          {/* Roman numeral — scale degree label */}
          {romanAnalysis && (
            <div className={styles.romanNumeralRow}>
              <span
                className={styles.romanNumeral}
                title={`Scale degree relative to active key`}
                aria-label={`Scale degree: ${romanAnalysis.label}`}
              >
                {romanAnalysis.label}.
              </span>
            </div>
          )}
          <div className={styles.actionRow}>
            <button
              className={`${styles.playButton}${isPlaying ? ` ${styles.playButtonActive}` : ''}`}
              onClick={handlePlay}
              aria-label={isPlaying ? "Stop chord playback" : "Play chord"}
              title={isPlaying ? "Stop" : "Play chord"}
            >
              {isPlaying ? '■ Stop' : '▶ Play'}
            </button>
            {onSetKeyContext && (
              <button
                type="button"
                className={styles.tonicSnapButton}
                onClick={handleSetAsTonic}
                disabled={chord === null}
                aria-label="Set key root to this chord's root"
                title="Set as tonic"
              >
                Set as tonic
              </button>
            )}
          </div>
          <div className={styles.notesRow}>
            <span
              className={styles.noteNames}
              aria-label={`Chord notes: ${noteNames}`}
            >
              {noteIndices.map((i) => (
                <span key={i}>{pitchClasses[i]}</span>
              ))}
            </span>
            <button
              className={`${styles.copyIconButton}${copied ? ` ${styles.copyIconButtonCopied}` : ''}`}
              onClick={handleCopy}
              disabled={!chord}
              aria-label="Copy note names to clipboard"
              title={`Copy notes: ${noteNames}`}
            >
              {copied ? '✓' : '⎘'}
            </button>
          </div>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {copied ? 'Notes copied to clipboard' : ''}
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
        <div className={styles.fullRow} role="status">
          <span className={styles.fullMessage}>
            Progression is full ({progressionLength}/{maxProgressionLength})
          </span>
        </div>
      )}
    </div>
  );
});
