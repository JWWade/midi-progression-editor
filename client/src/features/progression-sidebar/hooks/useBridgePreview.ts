import { useState, useCallback, useRef, useEffect } from "react";
import { playChord, stopChord } from "@/features/audio/utils/audioUtils";
import { transposeChord, CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import { isCustomChord } from "@/features/current-chord/utils/chordTypeGuards";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import type { AudioParams } from "@/features/audio/constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "@/features/audio/constants/audioConfig";
import type { Chord } from "@/features/current-chord/types";
import type { ChordNoteInfo } from "@/features/chord/types";

export interface UseBridgePreviewResult {
  isPreviewPlaying: boolean;
  previewBridge: Chord[] | null;
  previewInsertAfterIndex: number | null;
  startPreview: (
    insertAfterIndex: number,
    source: Chord,
    bridge: Chord[],
    target: Chord,
  ) => void;
  stopPreview: () => void;
}

export function useBridgePreview(
  chordDurationMs: number,
  audioParams: AudioParams = DEFAULT_AUDIO_PARAMS,
): UseBridgePreviewResult {
  const { pitchClasses } = useEnharmonic();
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewBridge, setPreviewBridge] = useState<Chord[] | null>(null);
  const [previewInsertAfterIndex, setPreviewInsertAfterIndex] = useState<
    number | null
  >(null);

  // Cancelled flag — read inside async run loops.
  const cancelledRef = useRef(false);
  // Generation counter — incremented on each startPreview call so that a
  // previously-started (now-superseded) run can detect it should not mutate state.
  const generationRef = useRef(0);
  // Keep duration ref so live changes take effect without restarting playback.
  const chordDurationMsRef = useRef(chordDurationMs);
  useEffect(() => {
    chordDurationMsRef.current = chordDurationMs;
  }, [chordDurationMs]);

  const stopPreview = useCallback(() => {
    cancelledRef.current = true;
    stopChord();
    setIsPreviewPlaying(false);
    setPreviewBridge(null);
    setPreviewInsertAfterIndex(null);
  }, []);

  const startPreview = useCallback(
    (
      insertAfterIndex: number,
      source: Chord,
      bridge: Chord[],
      target: Chord,
    ) => {
      // Stop any in-progress sequence before starting a new one.
      cancelledRef.current = true;
      stopChord();

      const myGeneration = ++generationRef.current;
      cancelledRef.current = false;

      setIsPreviewPlaying(true);
      setPreviewBridge(bridge);
      setPreviewInsertAfterIndex(insertAfterIndex);

      const sequence: Chord[] = [source, ...bridge, target];

      const run = async () => {
        for (const chord of sequence) {
          if (
            cancelledRef.current ||
            generationRef.current !== myGeneration
          ) {
            break;
          }

          const notes: ChordNoteInfo[] = isCustomChord(chord)
            ? chord.customNotes.map((idx) => ({
                index: idx,
                name: pitchClasses[idx],
                role: "root" as const,
              }))
            : transposeChord(
                CHORD_INTERVALS[chord.quality],
                chord.root,
                pitchClasses,
              );

          await playChord(notes, {
            duration: chordDurationMsRef.current,
            audioParams,
          });

          if (
            cancelledRef.current ||
            generationRef.current !== myGeneration
          ) {
            break;
          }
        }

        // Only clear state if this run still owns the active generation.
        if (
          generationRef.current === myGeneration &&
          !cancelledRef.current
        ) {
          setIsPreviewPlaying(false);
          setPreviewBridge(null);
          setPreviewInsertAfterIndex(null);
        }
      };

      run();
    },
    [pitchClasses, audioParams],
  );

  // Stop and clean up on unmount.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopChord();
    };
  }, []);

  return {
    isPreviewPlaying,
    previewBridge,
    previewInsertAfterIndex,
    startPreview,
    stopPreview,
  };
}
