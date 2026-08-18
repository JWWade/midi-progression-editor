import type { ChordType } from "@/features/chord/types";
import type { Chord } from "@/features/current-chord/types";
import { getChordName, CHORD_TYPE_ORDER } from "@/features/chord/data/chordNames";
import { getDiatonicIndices } from "@/features/scale/utils/scaleUtils";
import { SCALE_INTERVALS } from "@/features/scale/types/scales";
import type { ScaleType } from "@/features/scale/types";

const WESTERN_CHORD_TYPES: readonly ChordType[] = CHORD_TYPE_ORDER.filter(
  (quality): quality is ChordType => quality !== "quartal",
);

const SCALE_TYPES = Object.keys(SCALE_INTERVALS) as ScaleType[];

export interface RandomDiatonicStartupSelection {
  keyRoot: number;
  keyScale: ScaleType;
  chord: Chord;
  chordName: string;
}

function getScaleForChordQuality(quality: ChordType): ScaleType {
  switch (quality) {
    case "major":
    case "maj7":
    case "maj6":
    case "sus2":
    case "aug":
      return "major";
    case "dom7":
    case "dom7sus4":
      return "mixolydian";
    case "minor":
    case "min7":
    case "min6":
      return "naturalMinor";
    case "minmaj7":
      return "melodicMinor";
    case "dim":
    case "halfdim7":
      return "phrygian";
    default:
      return "major";
  }
}

function randomInt(maxExclusive: number, rng: () => number): number {
  return Math.floor(rng() * maxExclusive);
}

export function selectRandomDiatonicStartupChord(
  rng: () => number = Math.random,
): RandomDiatonicStartupSelection {
  // Startup chord remains random over C-major diatonic roots and western
  // quality types. Key context is then inferred from the selected chord.
  const startupPoolRoot = 0;
  const startupPoolScale: ScaleType = "major";

  const diatonicRoots = Array.from(getDiatonicIndices(startupPoolRoot, startupPoolScale));
  const chordRoot = diatonicRoots[randomInt(diatonicRoots.length, rng)] ?? startupPoolRoot;
  const chordQuality =
    WESTERN_CHORD_TYPES[randomInt(WESTERN_CHORD_TYPES.length, rng)] ?? "major";

  const keyRoot = chordRoot;
  const keyScale = getScaleForChordQuality(chordQuality);

  return {
    keyRoot,
    keyScale,
    chord: {
      root: chordRoot,
      quality: chordQuality,
    },
    chordName: getChordName(chordRoot, chordQuality),
  };
}

export { WESTERN_CHORD_TYPES, SCALE_TYPES };
