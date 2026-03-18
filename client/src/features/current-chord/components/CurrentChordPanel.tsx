import { useState, useCallback, useEffect } from "react";
import type { Chord } from "../types";
import { formatChordName, formatPrimitiveChordName, CHORD_QUALITY_LABELS } from "../utils/chordName";
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
import { AudioDebugPanel } from "@/features/audio/components/AudioDebugPanel";

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
  /** Callback fired when audio parameters change. */
  onAudioParamsChange?: (params: AudioParams) => void;
}

export function CurrentChordPanel({
  chord,
  onAddChord,
  diatonicIndices,
  isProgressionFull = false,
  progressionLength = 0,
  maxProgressionLength = 8,
  audioParams,
  onAudioParamsChange,
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
          <div className={styles.actionRow}>
            <button
              className={`${styles.playButton}${isPlaying ? ` ${styles.playButtonActive}` : ''}`}
              onClick={handlePlay}
              aria-label={isPlaying ? "Stop chord playback" : "Play chord"}
              title={isPlaying ? "Stop" : "Play chord"}
            >
              {isPlaying ? '■ Stop' : '▶ Play'}
            </button>
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
        <span className={styles.fullMessage} role="status">
          Progression is full ({progressionLength}/{maxProgressionLength})
        </span>
      )}
      {audioParams && onAudioParamsChange && (
        <AudioDebugPanel params={audioParams} onChange={onAudioParamsChange} />
      )}
    </div>
  );
}
