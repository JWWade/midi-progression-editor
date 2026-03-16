import { useState, useCallback, useRef, useEffect } from "react";
import { playChord, stopChord } from "../utils/audioUtils";
import { transposeChord, CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import { isCustomChord } from "@/features/current-chord/utils/chordTypeGuards";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import type { AudioParams } from "../constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "../constants/audioConfig";
import type { Chord } from "@/features/current-chord/types";
import type { ChordNoteInfo } from "@/features/chord/types";

export interface UseProgressionPlaybackResult {
  isPlaying: boolean;
  playingIndex: number | null;
  play: () => void;
  stop: () => void;
}

export function useProgressionPlayback(
  chords: Chord[],
  audioParams: AudioParams = DEFAULT_AUDIO_PARAMS,
): UseProgressionPlaybackResult {
  const { pitchClasses } = useEnharmonic();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const cancelledRef = useRef(false);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    stopChord();
    setIsPlaying(false);
    setPlayingIndex(null);
  }, []);

  const play = useCallback(() => {
    if (chords.length === 0) return;

    cancelledRef.current = false;
    setIsPlaying(true);

    const run = async () => {
      for (let i = 0; i < chords.length; i++) {
        if (cancelledRef.current) break;

        const chord = chords[i];
        const notes: ChordNoteInfo[] = isCustomChord(chord)
          ? chord.customNotes.map((idx) => ({ index: idx, name: pitchClasses[idx], role: "root" as const }))
          : transposeChord(CHORD_INTERVALS[chord.quality], chord.root, pitchClasses);

        setPlayingIndex(i);
        await playChord(notes, { duration: 1200, audioParams });

        if (cancelledRef.current) break;
      }

      if (!cancelledRef.current) {
        setIsPlaying(false);
        setPlayingIndex(null);
      }
    };

    run();
  }, [chords, pitchClasses, audioParams]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopChord();
    };
  }, []);

  return { isPlaying, playingIndex, play, stop };
}
