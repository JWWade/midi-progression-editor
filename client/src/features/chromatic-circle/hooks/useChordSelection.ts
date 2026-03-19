import { useState } from "react";

export interface ChordSelectionResult {
  selectedChordName: string;
  setSelectedChordName: (name: string) => void;
}

export function useChordSelection(initialChordName = "C"): ChordSelectionResult {
  const [selectedChordName, setSelectedChordName] = useState(initialChordName);
  return { selectedChordName, setSelectedChordName };
}
