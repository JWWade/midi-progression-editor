import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ChordType } from "../types";

export interface ChordNameData {
  root: number;
  type: ChordType;
}

const CHORD_TYPE_ORDER: readonly ChordType[] = [
  "major",
  "minor",
  "dim",
  "aug",
  "sus2",
  "dom7",
  "dom7sus4",
  "maj7",
  "maj6",
  "min6",
  "min7",
  "minmaj7",
  "halfdim7",
  "quartal",
];

const CHORD_TYPE_SUFFIXES: Record<ChordType, string> = {
  major: "",
  minor: "m",
  dim:   "dim",
  aug:   "aug",
  sus2:  "sus2",
  dom7: "7",
  dom7sus4: "7sus4",
  maj7: "maj7",
  maj6: "6",
  min6: "m6",
  min7: "m7",
  minmaj7: "m(maj7)",
  halfdim7: "ø7",
  quartal: "q",
};

export function getChordName(
  root: number,
  type: ChordType,
  pitchClasses: readonly string[] = PITCH_CLASSES,
): string {
  return `${pitchClasses[root]}${CHORD_TYPE_SUFFIXES[type]}`;
}

function buildChordData(): {
  names: string[];
  nameToData: Record<string, ChordNameData>;
} {
  const names: string[] = [];
  const nameToData: Record<string, ChordNameData> = {};

  for (let root = 0; root < 12; root++) {
    for (const type of CHORD_TYPE_ORDER) {
      const name = getChordName(root, type);
      nameToData[name] = { root, type };
      names.push(name);
    }
  }

  return { names, nameToData };
}

const { names: CHORD_NAMES, nameToData: CHORD_NAME_TO_DATA } = buildChordData();

export { CHORD_NAMES, CHORD_NAME_TO_DATA, CHORD_TYPE_ORDER };
