import { forwardRef, memo, useState, useCallback, useRef, useEffect } from "react";
import { ChordThumbnail } from "@/features/current-chord/components/ChordThumbnail";
import { getChordName } from "@/features/chord/data/chordNames";
import { getChordPitchClasses } from "@/features/chord/utils";
import { getChordComplexity, getChordColor } from "@/features/color-language/utils/chordColorUtils";
import type { Chord } from "@/features/current-chord/types";
import { isCustomChord, getChordNotes } from "@/features/current-chord/utils/chordTypeGuards";
import { formatChordSymbol, formatPrimitiveChordName } from "@/features/current-chord/utils/chordName";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import { playChord, playArpeggio, stopChord } from "@/features/audio";
import type { ArpeggioHandle } from "@/features/audio";
import { transposeChord, CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import { ChordStaffChart } from "./ChordStaffChart";
import styles from "./ChordTile.module.css";

interface ChordTileProps {
  chord: Chord;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isNew?: boolean;
  isPlaying?: boolean;
  activeArpeggioPitchClass?: number | null;
  showStaffChart?: boolean;
  voicedMidiNotes?: number[] | null;
  isGhost?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  onAnimationEnd?: () => void;
  /** Called before this tile starts audio playback so the caller can stop global playback. */
  onWillPlay?: () => void;
  /** Called when the user sends this chord back to the chromatic circle. */
  onSendBack?: () => void;
}

type TilePlayMode = "chord" | "arpeggio" | null;

// Memoize using data-only comparison so that inline callback wrappers created
// in the parent's render/map loop do not trigger unnecessary re-renders.
// Only chord identity and boolean display flags drive visual output; the
// callback props (onMoveUp, onMoveDown, onDelete, onAnimationEnd, onWillPlay) are stable
// in behaviour per tile even when their reference changes.
export const ChordTile = memo(
  forwardRef<HTMLLIElement, ChordTileProps>(
    function ChordTile({ chord, index, isFirst, isLast, isNew = false, isPlaying = false, activeArpeggioPitchClass = null, showStaffChart = false, voicedMidiNotes = null, isGhost = false, onMoveUp, onMoveDown, onDelete, onAnimationEnd, onWillPlay, onSendBack }, ref) {
  const { pitchClasses } = useEnharmonic();
  const noteIndices = getChordPitchClasses(chord);
  const complexity = getChordComplexity(chord);
  const accentColor = getChordColor(chord.quality, complexity);
  const chordName = isCustomChord(chord)
    ? (chord.primitiveShape === "equilateral-triangle"
      ? getChordName(chord.root, chord.quality, pitchClasses)
      : chord.primitiveShape
        ? formatPrimitiveChordName(chord, pitchClasses)
        : formatChordSymbol(chord, pitchClasses))
    : getChordName(chord.root, chord.quality, pitchClasses);
  const activePitchClass = activeArpeggioPitchClass === null
    ? null
    : ((activeArpeggioPitchClass % 12) + 12) % 12;
  const staffDescriptionId = `chord-staff-description-${index}`;

  // ── Inline audio playback state ────────────────────────────────────────
  const [tilePlayMode, setTilePlayMode] = useState<TilePlayMode>(null);
  const arpeggioHandleRef = useRef<ArpeggioHandle | null>(null);
  const isTilePlaying = tilePlayMode !== null;

  // Clean up any in-progress arpeggio when the component unmounts.
  useEffect(() => {
    return () => {
      arpeggioHandleRef.current?.cancel();
      arpeggioHandleRef.current = null;
    };
  }, []);

  const stopTilePlayback = useCallback(() => {
    arpeggioHandleRef.current?.cancel();
    arpeggioHandleRef.current = null;
    stopChord();
    setTilePlayMode(null);
  }, []);

  const getPlayNotes = useCallback(() =>
    isCustomChord(chord)
      ? getChordNotes(chord).map((idx) => ({ index: idx }))
      : transposeChord(CHORD_INTERVALS[chord.quality], chord.root, pitchClasses),
  [chord, pitchClasses]);

  const handlePlayChord = useCallback(async () => {
    if (isTilePlaying) {
      stopTilePlayback();
      return;
    }
    onWillPlay?.();
    const notes = getPlayNotes();
    setTilePlayMode("chord");
    try {
      await playChord(notes, { duration: 900 });
    } finally {
      setTilePlayMode((prev) => (prev === "chord" ? null : prev));
    }
  }, [isTilePlaying, stopTilePlayback, getPlayNotes, onWillPlay]);

  const handlePlayArpeggio = useCallback(() => {
    if (isTilePlaying) {
      stopTilePlayback();
      return;
    }
    onWillPlay?.();
    const notes = getPlayNotes();
    setTilePlayMode("arpeggio");
    const handle = playArpeggio(notes, { duration: 350 });
    arpeggioHandleRef.current = handle;
    handle.done.finally(() => {
      arpeggioHandleRef.current = null;
      setTilePlayMode((prev) => (prev === "arpeggio" ? null : prev));
    });
  }, [isTilePlaying, stopTilePlayback, getPlayNotes, onWillPlay]);

  return (
    <li
      ref={ref}
      className={`${styles.tile}${isNew ? ` ${styles.tileHighlight}` : ""}${isPlaying ? ` ${styles.tilePlaying}` : ""}${isGhost ? ` ${styles.ghostTile}` : ""}`}
      style={{ "--accent-color": accentColor } as React.CSSProperties}
      aria-label={isGhost ? undefined : `${chordName}, position ${index + 1}`}
      aria-hidden={isGhost ? "true" : undefined}
      tabIndex={isGhost ? -1 : 0}
      onAnimationEnd={onAnimationEnd}
    >
      <div className={styles.thumbnail}>
        <ChordThumbnail
          noteIndices={noteIndices}
          quality={chord.quality}
          complexity={complexity}
          size={48}
        />
      </div>
      <div className={styles.chordInfo}>
        <div className={styles.chordInfoHeader}>
          <span className={styles.chordName}>{chordName}</span>
          <span className={styles.chordNotes}>
            {noteIndices.map((noteIndex, noteSlotIndex) => {
              const noteName = pitchClasses[noteIndex];
              const isActive = activePitchClass === noteIndex;
              return (
                <span
                  key={`${noteIndex}-${noteSlotIndex}`}
                  className={`${styles.noteToken}${isActive ? ` ${styles.noteActive}` : ""}`}
                >
                  {noteName}
                  {noteSlotIndex < noteIndices.length - 1 ? " " : ""}
                </span>
              );
            })}
          </span>
        </div>
        {showStaffChart && !isGhost && (
          <ChordStaffChart
            chordName={chordName}
            voicedMidiNotes={voicedMidiNotes}
            pitchClasses={pitchClasses}
            descriptionId={staffDescriptionId}
          />
        )}
      </div>
      {!isGhost && (
        <div className={styles.tileActions}>
          <button
            className={styles.sendBackBtn}
            onClick={onSendBack}
            disabled={!onSendBack}
            aria-label="Send chord to circle"
            title="Send to circle"
          >
            ↩
          </button>
          <div className={styles.playbackControls} aria-label="Chord playback">
            <button
              className={`${styles.playBtn}${tilePlayMode === "chord" ? ` ${styles.playBtnActive}` : ""}`}
              onClick={handlePlayChord}
              aria-label={tilePlayMode === "chord" ? "Stop chord" : "Play chord"}
              title={tilePlayMode === "chord" ? "Stop" : "Play chord"}
            >
              {tilePlayMode === "chord" ? "■" : "▶"}
            </button>
            <button
              className={`${styles.playBtn}${tilePlayMode === "arpeggio" ? ` ${styles.playBtnActive}` : ""}`}
              onClick={handlePlayArpeggio}
              aria-label={tilePlayMode === "arpeggio" ? "Stop arpeggio" : "Play arpeggio"}
              title={tilePlayMode === "arpeggio" ? "Stop" : "Play arpeggio"}
            >
              {tilePlayMode === "arpeggio" ? "■" : "≈"}
            </button>
          </div>
          <div className={styles.controls} aria-label="Chord controls">
            <button
              className={styles.controlBtn}
              onClick={onMoveUp}
              disabled={isFirst}
              aria-disabled={isFirst}
              aria-label="Move chord up"
              title="Move up"
            >
              ↑
            </button>
            <button
              className={styles.controlBtn}
              onClick={onMoveDown}
              disabled={isLast}
              aria-disabled={isLast}
              aria-label="Move chord down"
              title="Move down"
            >
              ↓
            </button>
            <button
              className={`${styles.controlBtn} ${styles.deleteBtn}`}
              onClick={onDelete}
              aria-label="Delete chord"
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </li>
  );
}),
  (prev, next) =>
    prev.chord === next.chord &&
    prev.index === next.index &&
    prev.isFirst === next.isFirst &&
    prev.isLast === next.isLast &&
    prev.isNew === next.isNew &&
    prev.isPlaying === next.isPlaying &&
    prev.activeArpeggioPitchClass === next.activeArpeggioPitchClass &&
    prev.showStaffChart === next.showStaffChart &&
    prev.voicedMidiNotes === next.voicedMidiNotes &&
    prev.isGhost === next.isGhost,
);

