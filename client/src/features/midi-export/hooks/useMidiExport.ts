import { useState, useCallback } from "react";
import type { Chord } from "@/features/current-chord/types";
import { buildMidiFile } from "../utils/midiBuilder";

export function useMidiExport(chords: Chord[]): {
  bpm: number;
  setBpm: (v: number) => void;
  beatsPerChord: number;
  setBeatsPerChord: (v: number) => void;
  startOctave: number;
  setStartOctave: (v: number) => void;
  exportMidi: () => void;
} {
  const [bpm, setBpm] = useState(120);
  const [beatsPerChord, setBeatsPerChord] = useState(2);
  const [startOctave, setStartOctave] = useState(4);

  const exportMidi = useCallback(() => {
    const bytes = buildMidiFile(chords, { bpm, beatsPerChord, startOctave });
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progression-${Date.now()}.mid`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [chords, bpm, beatsPerChord, startOctave]);

  return { bpm, setBpm, beatsPerChord, setBeatsPerChord, startOctave, setStartOctave, exportMidi };
}
