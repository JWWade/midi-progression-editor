import type { Chord } from "@/features/current-chord";
import type { ChordType } from "@/features/chord/types";
import type { ScaleType } from "../types/scales";
import { getScaleNotes } from "./scaleUtils";

export interface DiatonicChordOption {
  chord: Chord;
  qualityLabel: string;
  degree: number;
}

type DiatonicTriadQuality = Extract<ChordType, "major" | "minor" | "dim" | "aug">;

const TRIAD_QUALITY_LABELS: Record<DiatonicTriadQuality, string> = {
  major: "major",
  minor: "minor",
  dim: "diminished",
  aug: "augmented",
};

function getDiatonicTriadQuality(root: number, third: number, fifth: number): DiatonicTriadQuality {
  const thirdInterval = ((third - root) + 12) % 12;
  const fifthInterval = ((fifth - root) + 12) % 12;

  if (thirdInterval === 4 && fifthInterval === 7) return "major";
  if (thirdInterval === 3 && fifthInterval === 7) return "minor";
  if (thirdInterval === 3 && fifthInterval === 6) return "dim";
  if (thirdInterval === 4 && fifthInterval === 8) return "aug";

  return "major";
}

export function buildDiatonicChordOptions(root: number, scaleType: ScaleType): DiatonicChordOption[] {
  const scaleNotes = getScaleNotes(root, scaleType);

  return scaleNotes.map((scaleRoot, degreeIndex) => {
    const third = scaleNotes[(degreeIndex + 2) % scaleNotes.length];
    const fifth = scaleNotes[(degreeIndex + 4) % scaleNotes.length];
    const quality = getDiatonicTriadQuality(scaleRoot, third, fifth);

    return {
      chord: {
        root: scaleRoot,
        quality,
      },
      qualityLabel: TRIAD_QUALITY_LABELS[quality],
      degree: degreeIndex + 1,
    };
  });
}