import { useCallback } from "react";
import type { Chord } from "@/features/current-chord/types";
import type { ArpeggioPattern } from "@/features/audio/types/arpeggioPattern";
import type { ScaleContext } from "@/shared/types/ScaleContext";
import { buildMidiFile } from "../utils/midiBuilder";

export function useMidiExport(
  chords: Chord[],
  arpeggioPattern: ArpeggioPattern | undefined,
  scaleContext: ScaleContext | null | undefined,
  bpm: number,
  beatsPerChord: number,
): { exportMidi: () => void } {
  const startOctave = 4;

  const exportMidi = useCallback(() => {
    const bytes = buildMidiFile(chords, { bpm, beatsPerChord, startOctave, arpeggioPattern, scaleContext });
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progression-${Date.now()}.mid`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [chords, bpm, beatsPerChord, startOctave, arpeggioPattern, scaleContext]);

  return { exportMidi };
}
