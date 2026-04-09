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

  // Keep sequenceRef current without restarting playback
  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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

    // Sixteenth note duration: (60 / bpm) * 0.25 seconds
    const stepMs = (60 / bpm) * 0.25 * 1000;

    intervalRef.current = window.setInterval(() => {
      const seq = sequenceRef.current;
      if (seq.length === 0) return;

      const step = stepRef.current % seq.length;
      const pitchClass = seq[step]!;

      setCurrentStep(step);
      setCurrentPitchClass(pitchClass);

      // Play the note (don't await — fire-and-forget)
      void playNote([{ index: pitchClass, name: "", role: "root" }], { duration: stepMs / 1000 - 0.02 });

      stepRef.current = (step + 1) % seq.length;
    }, stepMs);
  }, [isPlaying, bpm, playNote]);

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
        const stepMs = (60 / bpm) * 0.25 * 1000;
        intervalRef.current = window.setInterval(() => {
          const seq = sequenceRef.current;
          if (seq.length === 0) return;

          const step = stepRef.current % seq.length;
          const pitchClass = seq[step]!;

          setCurrentStep(step);
          setCurrentPitchClass(pitchClass);

          void playNote([{ index: pitchClass, name: "", role: "root" }], { duration: stepMs / 1000 - 0.02 });

          stepRef.current = (step + 1) % seq.length;
        }, stepMs);
      }
    }
  }, [bpm, isPlaying, clearTimer, playNote]);

  return { isPlaying, currentStep, currentPitchClass, play, stop };
}
