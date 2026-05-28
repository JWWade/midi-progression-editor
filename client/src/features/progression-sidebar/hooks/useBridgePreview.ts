import { useState, useCallback, useRef, useEffect } from "react";
import { playChord, stopChord } from "@/features/audio/utils/audioUtils";
import { transposeChord, CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import { isCustomChord } from "@/features/current-chord/utils/chordTypeGuards";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import { createLogger } from "@/shared/utils/logger";
import type { AudioParams } from "@/features/audio/constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "@/features/audio/constants/audioConfig";
import type { Chord } from "@/features/current-chord/types";
import type { ChordNoteInfo } from "@/features/chord/types";

const PREVIEW_ERROR_AUTO_CLEAR_MS = 3500;
const bridgePreviewLogger = createLogger("progression-sidebar:bridge-preview");

export interface UseBridgePreviewResult {
  isPreviewPlaying: boolean;
  previewBridge: Chord[] | null;
  previewInsertAfterIndex: number | null;
  previewError: string | null;
  startPreview: (source: Chord, bridge: Chord[], target: Chord, insertAfterIndex: number) => void;
  stopPreview: () => void;
  clearPreviewError: () => void;
}

export function useBridgePreview(
  chordDurationMs: number = 1200,
  audioParams: AudioParams = DEFAULT_AUDIO_PARAMS,
): UseBridgePreviewResult {
  const { pitchClasses } = useEnharmonic();
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewBridge, setPreviewBridge] = useState<Chord[] | null>(null);
  const [previewInsertAfterIndex, setPreviewInsertAfterIndex] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const chordDurationMsRef = useRef(chordDurationMs);
  const errorTimerRef = useRef<number | null>(null);

  useEffect(() => {
    chordDurationMsRef.current = chordDurationMs;
  }, [chordDurationMs]);

  const clearErrorTimer = useCallback(() => {
    if (errorTimerRef.current !== null) {
      window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  const clearPreviewState = useCallback(() => {
    setIsPreviewPlaying(false);
    setPreviewBridge(null);
    setPreviewInsertAfterIndex(null);
  }, []);

  const clearPreviewError = useCallback(() => {
    clearErrorTimer();
    setPreviewError(null);
  }, [clearErrorTimer]);

  const notifyPreviewFailure = useCallback(
    (error: unknown) => {
      bridgePreviewLogger.error("Bridge preview playback failed", error);
      setPreviewError("Audio preview failed. Check browser audio permissions and try again.");
      clearErrorTimer();
      errorTimerRef.current = window.setTimeout(() => {
        setPreviewError(null);
        errorTimerRef.current = null;
      }, PREVIEW_ERROR_AUTO_CLEAR_MS);
    },
    [clearErrorTimer],
  );

  const stopPreview = useCallback(() => {
    cancelledRef.current = true;
    clearErrorTimer();
    stopChord();
    clearPreviewState();
  }, [clearErrorTimer, clearPreviewState]);

  const startPreview = useCallback(
    (source: Chord, bridge: Chord[], target: Chord, insertAfterIndex: number) => {
      // Stop any in-progress playback first
      cancelledRef.current = true;
      stopChord();

      cancelledRef.current = false;
      clearPreviewError();
      setIsPreviewPlaying(true);
      setPreviewBridge(bridge);
      setPreviewInsertAfterIndex(insertAfterIndex);

      const sequence = [source, ...bridge, target];

      const run = async () => {
        try {
          for (const chord of sequence) {
            if (cancelledRef.current) break;

            const notes: ChordNoteInfo[] = isCustomChord(chord)
              ? chord.customNotes.map((idx) => ({ index: idx, name: pitchClasses[idx], role: "root" as const }))
              : transposeChord(CHORD_INTERVALS[chord.quality], chord.root, pitchClasses);

            await playChord(notes, { duration: chordDurationMsRef.current, audioParams });

            if (cancelledRef.current) break;
          }
        } catch (error) {
          if (!cancelledRef.current) {
            notifyPreviewFailure(error);
          }
        } finally {
          if (!cancelledRef.current) {
            clearPreviewState();
          }
        }
      };

      run();
    },
    [pitchClasses, audioParams, clearPreviewError, notifyPreviewFailure],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearErrorTimer();
      stopChord();
    };
  }, [clearErrorTimer]);

  return {
    isPreviewPlaying,
    previewBridge,
    previewInsertAfterIndex,
    previewError,
    startPreview,
    stopPreview,
    clearPreviewError,
  };
}
