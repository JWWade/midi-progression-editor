import { useState, useCallback, useRef, useEffect } from "react";
import { playChord, stopChord, playArpeggio } from "../utils/audioUtils";
import { transposeChord, CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import { isCustomChord } from "@/features/current-chord/utils/chordTypeGuards";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import type { AudioParams } from "../constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "../constants/audioConfig";
import type { Chord } from "@/features/current-chord/types";
import type { ChordNoteInfo } from "@/features/chord/types";
import type { ArpeggioPattern } from "../types/arpeggioPattern";
import { DEFAULT_ARPEGGIO_PATTERN } from "../types/arpeggioPattern";
import { generateArpeggioSequence } from "../utils/arpeggioUtils";

export interface UseProgressionPlaybackResult {
  isPlaying: boolean;
  playingIndex: number | null;
  loop: boolean;
  play: () => void;
  stop: () => void;
  toggleLoop: () => void;
  /** Whether "Play All" uses arpeggiated note sequences instead of block chords. */
  arpeggioEnabled: boolean;
  /** Active arpeggio pattern applied during "Play All". */
  arpeggioPattern: ArpeggioPattern;
  toggleArpeggio: () => void;
  setArpeggioPattern: (pattern: ArpeggioPattern) => void;
}

export function useProgressionPlayback(
  chords: Chord[],
  audioParams: AudioParams = DEFAULT_AUDIO_PARAMS,
  chordDurationMs: number = 1200,
): UseProgressionPlaybackResult {
  const { pitchClasses } = useEnharmonic();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [loop, setLoop] = useState(false);
  const [arpeggioEnabled, setArpeggioEnabled] = useState(false);
  const [arpeggioPattern, setArpeggioPattern] = useState<ArpeggioPattern>(DEFAULT_ARPEGGIO_PATTERN);

  const cancelledRef = useRef(false);
  // Keep a ref so the running loop always reads the latest duration without
  // needing to restart playback when the user changes the value.
  const chordDurationMsRef = useRef(chordDurationMs);
  useEffect(() => {
    chordDurationMsRef.current = chordDurationMs;
  }, [chordDurationMs]);
  // Keep a ref so the async run loop reads the latest loop value without
  // needing to recreate the play callback.
  const loopRef = useRef(loop);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  // Keep refs for arpeggio state so the async run loop reads the latest values.
  const arpeggioEnabledRef = useRef(arpeggioEnabled);
  useEffect(() => { arpeggioEnabledRef.current = arpeggioEnabled; }, [arpeggioEnabled]);

  const arpeggioPatternRef = useRef(arpeggioPattern);
  useEffect(() => { arpeggioPatternRef.current = arpeggioPattern; }, [arpeggioPattern]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    stopChord();
    setIsPlaying(false);
    setPlayingIndex(null);
  }, []);

  const toggleLoop = useCallback(() => {
    setLoop((prev) => !prev);
  }, []);

  const toggleArpeggio = useCallback(() => {
    setArpeggioEnabled((prev) => !prev);
  }, []);

  const play = useCallback(() => {
    if (chords.length === 0) return;

    cancelledRef.current = false;
    setIsPlaying(true);

    const run = async () => {
      do {
        for (let i = 0; i < chords.length; i++) {
          if (cancelledRef.current) break;

          const chord = chords[i];
          const notes: ChordNoteInfo[] = isCustomChord(chord)
            ? chord.customNotes.map((idx) => ({ index: idx, name: pitchClasses[idx], role: "root" as const }))
            : transposeChord(CHORD_INTERVALS[chord.quality], chord.root, pitchClasses);

          setPlayingIndex(i);

          if (arpeggioEnabledRef.current) {
            const pattern = arpeggioPatternRef.current;
            const sequence = generateArpeggioSequence(notes, pattern);
            // Divide chord time evenly among all sequence steps.
            const noteDurationMs = sequence.length > 0
              ? Math.round(chordDurationMsRef.current / sequence.length)
              : chordDurationMsRef.current;
            const handle = playArpeggio(sequence, { duration: noteDurationMs, audioParams });
            await handle.done;
          } else {
            await playChord(notes, { duration: chordDurationMsRef.current, audioParams });
          }

          if (cancelledRef.current) break;
        }
      } while (!cancelledRef.current && loopRef.current);

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

  return { isPlaying, playingIndex, loop, play, stop, toggleLoop, arpeggioEnabled, arpeggioPattern, toggleArpeggio, setArpeggioPattern };
}
