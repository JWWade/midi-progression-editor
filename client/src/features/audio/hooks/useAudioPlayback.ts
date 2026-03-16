import { useState, useCallback, useRef } from "react";
import { playChord, stopChord } from "../utils/audioUtils";
import type { PlayOptions } from "../utils/audioUtils";
import type { AudioParams } from "../constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "../constants/audioConfig";
import type { ChordNoteInfo } from "@/features/chord/types";

export interface UseAudioPlaybackResult {
  isPlaying: boolean;
  play: (notes: ChordNoteInfo[], options?: PlayOptions) => Promise<void>;
  stop: () => void;
}

export function useAudioPlayback(audioParams: AudioParams = DEFAULT_AUDIO_PARAMS): UseAudioPlaybackResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);

  const stop = useCallback(() => {
    stopChord();
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    async (notes: ChordNoteInfo[], options?: PlayOptions): Promise<void> => {
      if (isPlayingRef.current) return;

      isPlayingRef.current = true;
      setIsPlaying(true);
      try {
        await playChord(notes, { ...options, audioParams });
      } finally {
        isPlayingRef.current = false;
        setIsPlaying(false);
      }
    },
    [audioParams],
  );

  return { isPlaying, play, stop };
}
