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
  "dom7",
  "maj7",
  "min7",
  "halfdim7",
  "quartal",
];

const CHORD_TYPE_SUFFIXES: Record<ChordType, string> = {
  major: "",
  minor: "m",
  dim:   "dim",
  aug:   "aug",
  dom7: "7",
  maj7: "maj7",
  min7: "m7",
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
