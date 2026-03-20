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
  startPreview: (source: Chord, bridge: Chord[], target: Chord, insertAfterIndex: number) => void;
  stopPreview: () => void;
}

export function useBridgePreview(
  chordDurationMs: number = 1200,
  audioParams: AudioParams = DEFAULT_AUDIO_PARAMS,
): UseBridgePreviewResult {
  const { pitchClasses } = useEnharmonic();
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewBridge, setPreviewBridge] = useState<Chord[] | null>(null);
  const [previewInsertAfterIndex, setPreviewInsertAfterIndex] = useState<number | null>(null);
  const cancelledRef = useRef(false);
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
    (source: Chord, bridge: Chord[], target: Chord, insertAfterIndex: number) => {
      // Stop any in-progress playback first
      cancelledRef.current = true;
      stopChord();

      cancelledRef.current = false;
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
        } catch {
          // Silently handle audio context or playback errors
        } finally {
          if (!cancelledRef.current) {
            setIsPreviewPlaying(false);
            setPreviewBridge(null);
            setPreviewInsertAfterIndex(null);
          }
        }
      };

      run();
    },
    [pitchClasses, audioParams],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopChord();
    };
  }, []);

  return { isPreviewPlaying, previewBridge, previewInsertAfterIndex, startPreview, stopPreview };
}
