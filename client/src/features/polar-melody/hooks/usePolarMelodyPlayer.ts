import { useState, useCallback, useRef, useEffect } from "react";
import { useAudioPlayback } from "@/features/audio";
import type { AudioParams } from "@/features/audio/constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "@/features/audio/constants/audioConfig";

export interface UsePolarMelodyPlayerResult {
  isPlaying: boolean;
  currentStep: number;
  currentPitchClass: number | null;
  play: () => void;
  stop: () => void;
}

/**
 * Advances through a polar melody sequence at a rate derived from BPM with
 * sixteenth-note subdivision (one step = one sixteenth note).
 *
 * Calls `useAudioPlayback().play()` on each step and exposes
 * `currentPitchClass` for wiring to the chromatic circle.
 */
export function usePolarMelodyPlayer(
  sequence: number[],
  bpm: number,
  audioParams: AudioParams = DEFAULT_AUDIO_PARAMS,
): UsePolarMelodyPlayerResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPitchClass, setCurrentPitchClass] = useState<number | null>(null);
  const { play: playNote } = useAudioPlayback(audioParams);

  const intervalRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const sequenceRef = useRef(sequence);
  const playNoteRef = useRef(playNote);

  // Keep refs current without restarting playback
  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  useEffect(() => {
    playNoteRef.current = playNote;
  }, [playNote]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /** Shared interval tick: advance step, update state, play the note. */
  const makeTickCallback = useCallback(
    (stepMs: number) => () => {
      const seq = sequenceRef.current;
      if (seq.length === 0) return;

      const step = stepRef.current % seq.length;
      const pitchClass = seq[step]!;

      setCurrentStep(step);
      setCurrentPitchClass(pitchClass);

      // Fire-and-forget — do not await so the interval stays on schedule.
      void playNoteRef.current([{ index: pitchClass, name: "", role: "root" }], {
        duration: stepMs / 1000 - 0.02,
      });

      stepRef.current = (step + 1) % seq.length;
    },
    [],
  );

  /** Start an interval timer for the given BPM. */
  const startTimer = useCallback(
    (currentBpm: number) => {
      const stepMs = (60 / currentBpm) * 0.25 * 1000;
      intervalRef.current = window.setInterval(makeTickCallback(stepMs), stepMs);
    },
    [makeTickCallback],
  );

  const stop = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
    setCurrentStep(0);
    setCurrentPitchClass(null);
    stepRef.current = 0;
  }, [clearTimer]);

  const play = useCallback(() => {
    if (isPlaying) return;
    if (sequenceRef.current.length === 0) return;

    setIsPlaying(true);
    stepRef.current = 0;
    startTimer(bpm);
  }, [isPlaying, bpm, startTimer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // When bpm changes during playback, restart with new tempo
  const bpmRef = useRef(bpm);
  useEffect(() => {
    if (bpmRef.current !== bpm) {
      bpmRef.current = bpm;
      if (isPlaying) {
        clearTimer();
        startTimer(bpm);
      }
    }
  }, [bpm, isPlaying, clearTimer, startTimer]);

  return { isPlaying, currentStep, currentPitchClass, play, stop };
}
