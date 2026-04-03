import { useState, useCallback } from "react";
import type { Chord } from "@/features/current-chord/types";
import type { ArpeggioPattern } from "@/features/audio/types/arpeggioPattern";
import type { ScaleContext } from "@/shared/types/ScaleContext";
import { buildMidiFile } from "../utils/midiBuilder";
import { getRandomBpmInRange } from "../utils/bpmTempoLabel";

export function useMidiExport(
  chords: Chord[],
  arpeggioPattern?: ArpeggioPattern,
  scaleContext?: ScaleContext | null,
): {
  bpm: number;
  setBpm: (v: number) => void;
  beatsPerChord: number;
  setBeatsPerChord: (v: number) => void;
  exportMidi: () => void;
} {
  const [bpm, setBpm] = useState(() => getRandomBpmInRange("Adagio", "Presto")); // Random BPM between Adagio and Presto (60–199)
  const [beatsPerChord, setBeatsPerChord] = useState(4);
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

  return { bpm, setBpm, beatsPerChord, setBeatsPerChord, exportMidi };
}
