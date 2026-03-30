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

function randomInt(maxExclusive: number, rng: () => number): number {
  return Math.floor(rng() * maxExclusive);
}

export function selectRandomDiatonicStartupChord(
  rng: () => number = Math.random,
): RandomDiatonicStartupSelection {
  const keyRoot = randomInt(12, rng);
  const keyScale = SCALE_TYPES[randomInt(SCALE_TYPES.length, rng)] ?? "major";

  const diatonicRoots = Array.from(getDiatonicIndices(keyRoot, keyScale));
  const chordRoot = diatonicRoots[randomInt(diatonicRoots.length, rng)] ?? keyRoot;
  const chordQuality =
    WESTERN_CHORD_TYPES[randomInt(WESTERN_CHORD_TYPES.length, rng)] ?? "major";

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
