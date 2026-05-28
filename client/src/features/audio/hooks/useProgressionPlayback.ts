import { useState, useCallback, useRef, useEffect } from "react";
import { playChord, stopChord, playArpeggio } from "../utils/audioUtils";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import type { AudioParams } from "../constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "../constants/audioConfig";
import type { Chord } from "@/features/current-chord/types";
import type { ChordNoteInfo } from "@/features/chord/types";
import type { ArpeggioPattern } from "../types/arpeggioPattern";
import { DEFAULT_ARPEGGIO_PATTERN } from "../types/arpeggioPattern";
import { planLiveArpeggioPlayback } from "../utils/arpeggioUtils";
import type { ArpeggioHandle } from "../utils/audioUtils";
import {
  computeNextChordVoicing,
} from "@/features/voice-leading";
import type { VoiceLeadingConfig } from "@/features/voice-leading";

const DEFAULT_VOICE_LEADING_CONFIG: VoiceLeadingConfig = {
  style: "minimal",
  strictness: 2,
  motionBias: "neutral",
  startOctave: 3,
  extensionRegisterPolicy: "strict",
};

type PlaybackNote = ChordNoteInfo & { octave: number };

export interface UseProgressionPlaybackResult {
  isPlaying: boolean;
  playingIndex: number | null;
  playingPitchClass: number | null;
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
  voiceLeadingConfig: VoiceLeadingConfig = DEFAULT_VOICE_LEADING_CONFIG,
): UseProgressionPlaybackResult {
  const { pitchClasses } = useEnharmonic();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [playingPitchClass, setPlayingPitchClass] = useState<number | null>(null);
  const [loop, setLoop] = useState(false);
  const [arpeggioEnabled, setArpeggioEnabled] = useState(false);
  const [arpeggioPattern, setArpeggioPattern] = useState<ArpeggioPattern>(DEFAULT_ARPEGGIO_PATTERN);

  const cancelledRef = useRef(false);
  const activeArpeggioRef = useRef<ArpeggioHandle | null>(null);
  const arpeggioUiTimerIdsRef = useRef<number[]>([]);
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

  // Keep a ref so the running loop always reads the latest audio params without
  // needing to restart playback when the user changes volume or tone mid-playback.
  const audioParamsRef = useRef(audioParams);
  useEffect(() => { audioParamsRef.current = audioParams; }, [audioParams]);

  // Keep refs for arpeggio state so the async run loop reads the latest values.
  const arpeggioEnabledRef = useRef(arpeggioEnabled);
  useEffect(() => { arpeggioEnabledRef.current = arpeggioEnabled; }, [arpeggioEnabled]);

  const arpeggioPatternRef = useRef(arpeggioPattern);
  useEffect(() => { arpeggioPatternRef.current = arpeggioPattern; }, [arpeggioPattern]);

  const voiceLeadingConfigRef = useRef(voiceLeadingConfig);
  useEffect(() => {
    voiceLeadingConfigRef.current = voiceLeadingConfig;
  }, [voiceLeadingConfig]);

  const clearArpeggioUiTimers = useCallback(() => {
    for (const timerId of arpeggioUiTimerIdsRef.current) {
      window.clearTimeout(timerId);
    }
    arpeggioUiTimerIdsRef.current = [];
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    activeArpeggioRef.current?.cancel();
    activeArpeggioRef.current = null;
    clearArpeggioUiTimers();
    stopChord();
    setIsPlaying(false);
    setPlayingIndex(null);
    setPlayingPitchClass(null);
  }, [clearArpeggioUiTimers]);

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
        // Reset at loop boundary so each cycle starts from the same anchor
        // voicing for chord 1, preventing cumulative octave drift.
        let previousVoicing: number[] = [];

        for (let i = 0; i < chords.length; i++) {
          if (cancelledRef.current) break;

          const chord = chords[i];
          const cfg = voiceLeadingConfigRef.current;
          const constrainedVoicing = computeNextChordVoicing(chord, previousVoicing, cfg);

          const notes: PlaybackNote[] = constrainedVoicing.map((midiNote) => {
            const pitchClass = ((midiNote % 12) + 12) % 12;
            return {
              index: pitchClass,
              octave: Math.floor(midiNote / 12) - 1,
              name: pitchClasses[pitchClass],
              role: "root" as const,
            };
          });
          previousVoicing = constrainedVoicing;

          setPlayingIndex(i);
          setPlayingPitchClass(null);

          if (arpeggioEnabledRef.current) {
            const pattern = arpeggioPatternRef.current;
            const scheduledNotes = planLiveArpeggioPlayback(
              notes,
              pattern,
              chordDurationMsRef.current,
            );
            clearArpeggioUiTimers();
            for (const step of scheduledNotes) {
              const timerId = window.setTimeout(() => {
                if (!cancelledRef.current) {
                  setPlayingPitchClass(step.note.index);
                }
              }, step.startOffsetMs);
              arpeggioUiTimerIdsRef.current.push(timerId);
            }
            const clearTimerId = window.setTimeout(() => {
              if (!cancelledRef.current) {
                setPlayingPitchClass(null);
              }
            }, chordDurationMsRef.current);
            arpeggioUiTimerIdsRef.current.push(clearTimerId);

            const handle = playArpeggio(
              scheduledNotes.map((step) => step.note),
              {
                audioParams: audioParamsRef.current,
                startOffsetsMs: scheduledNotes.map((step) => step.startOffsetMs),
                noteDurationsMs: scheduledNotes.map((step) => step.durationMs),
                totalDurationMs: chordDurationMsRef.current,
              },
            );
            activeArpeggioRef.current = handle;
            await handle.done;
            clearArpeggioUiTimers();
            setPlayingPitchClass(null);
            if (activeArpeggioRef.current === handle) {
              activeArpeggioRef.current = null;
            }
          } else {
            activeArpeggioRef.current = null;
            clearArpeggioUiTimers();
            setPlayingPitchClass(null);
            await playChord(notes, { duration: chordDurationMsRef.current, audioParams: audioParamsRef.current });
          }

          if (cancelledRef.current) break;
        }
      } while (!cancelledRef.current && loopRef.current);

      if (!cancelledRef.current) {
        clearArpeggioUiTimers();
        setIsPlaying(false);
        setPlayingIndex(null);
        setPlayingPitchClass(null);
      }
    };

    run();
  }, [chords, pitchClasses, clearArpeggioUiTimers]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearArpeggioUiTimers();
      stopChord();
    };
  }, [clearArpeggioUiTimers]);

  return {
    isPlaying,
    playingIndex,
    playingPitchClass,
    loop,
    play,
    stop,
    toggleLoop,
    arpeggioEnabled,
    arpeggioPattern,
    toggleArpeggio,
    setArpeggioPattern,
  };
}
