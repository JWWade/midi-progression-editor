import { useCallback, useState } from "react";
import type { Chord } from "@/features/current-chord/types";
import type { ArpeggioPattern } from "@/features/audio/types/arpeggioPattern";
import type { ScaleContext } from "@/shared/types/ScaleContext";
import type { VoiceLeadingStyle, MotionBias } from "@/features/voice-leading";
import { buildMidiFile } from "../utils/midiBuilder";

export function useMidiExport(
  chords: Chord[],
  arpeggioPattern: ArpeggioPattern | undefined,
  scaleContext: ScaleContext | null | undefined,
  bpm: number,
  beatsPerChord: number,
): {
  exportMidi: () => void;
  startOctave: number;
  setStartOctave: (v: number) => void;
  voiceLeadingStyle: VoiceLeadingStyle;
  setVoiceLeadingStyle: (v: VoiceLeadingStyle) => void;
  strictness: number;
  setStrictness: (v: number) => void;
  motionBias: MotionBias;
  setMotionBias: (v: MotionBias) => void;
} {
  const [startOctave, setStartOctave] = useState(4);
  const [voiceLeadingStyle, setVoiceLeadingStyle] = useState<VoiceLeadingStyle>('minimal');
  const [strictness, setStrictness] = useState(2);
  const [motionBias, setMotionBias] = useState<MotionBias>('neutral');

  const exportMidi = useCallback(() => {
    const bytes = buildMidiFile(chords, {
      bpm,
      beatsPerChord,
      startOctave,
      voiceLeadingStyle,
      strictness,
      motionBias,
      arpeggioPattern,
      scaleContext,
    });
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progression-${Date.now()}.mid`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [chords, bpm, beatsPerChord, startOctave, voiceLeadingStyle, strictness, motionBias, arpeggioPattern, scaleContext]);

  return {
    exportMidi,
    startOctave,
    setStartOctave,
    voiceLeadingStyle,
    setVoiceLeadingStyle,
    strictness,
    setStrictness,
    motionBias,
    setMotionBias,
  };
}
