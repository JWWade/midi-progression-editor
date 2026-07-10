import type { Chord } from "@/features/current-chord/types";
import { getChordPitchClasses } from "@/features/chord/utils";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const NATURAL_PITCH_CLASS_BY_LETTER: Readonly<Record<(typeof LETTERS)[number], number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function toPitchClass(noteIndex: number): number {
  return ((noteIndex % 12) + 12) % 12;
}

function toSignedSemitoneDelta(delta: number): number {
  const normalized = toPitchClass(delta);
  return normalized > 6 ? normalized - 12 : normalized;
}

function parseRootLetter(rootLabel: string): (typeof LETTERS)[number] | null {
  const letter = rootLabel.charAt(0).toUpperCase() as (typeof LETTERS)[number];
  return letter in NATURAL_PITCH_CLASS_BY_LETTER ? letter : null;
}

function getExpectedLetter(rootLetter: (typeof LETTERS)[number], noteSlot: number): (typeof LETTERS)[number] {
  const rootLetterIndex = LETTERS.indexOf(rootLetter);
  const degreeOffset = noteSlot * 2;
  const expectedIndex = (rootLetterIndex + degreeOffset) % LETTERS.length;
  return LETTERS[expectedIndex] ?? "C";
}

function spellFromExpectedLetter(targetPitchClass: number, expectedLetter: (typeof LETTERS)[number]): string | null {
  const naturalPitchClass = NATURAL_PITCH_CLASS_BY_LETTER[expectedLetter];
  const semitoneDelta = toSignedSemitoneDelta(targetPitchClass - naturalPitchClass);

  if (semitoneDelta === 0) {
    return expectedLetter;
  }
  if (semitoneDelta === 1) {
    return `${expectedLetter}#`;
  }
  if (semitoneDelta === -1) {
    return `${expectedLetter}b`;
  }

  // Avoid double-sharp/flat spellings in the tile/chart path.
  return null;
}

/**
 * Builds a pitch-class spelling map tailored to this chord's tertian slots.
 * Falls back to the active enharmonic pitch-class labels when spelling is ambiguous.
 */
export function buildChordSpellingMap(
  chord: Chord,
  pitchClasses: readonly string[],
): Partial<Record<number, string>> {
  const noteIndices = getChordPitchClasses(chord);
  if (noteIndices.length !== 3 && noteIndices.length !== 4) {
    return {};
  }

  const rootPitchClass = toPitchClass(chord.root);
  const rootLabel = pitchClasses[rootPitchClass] ?? "C";
  const rootLetter = parseRootLetter(rootLabel);
  if (!rootLetter) {
    return {};
  }

  // We can only infer tertian spelling safely when the first tone is the root.
  const firstPitchClass = toPitchClass(noteIndices[0] ?? rootPitchClass);
  if (firstPitchClass !== rootPitchClass) {
    return {};
  }

  const spellingByPitchClass: Partial<Record<number, string>> = {};

  noteIndices.forEach((noteIndex, slot) => {
    const targetPitchClass = toPitchClass(noteIndex);
    const expectedLetter = getExpectedLetter(rootLetter, slot);
    const spelled = spellFromExpectedLetter(targetPitchClass, expectedLetter);
    spellingByPitchClass[targetPitchClass] = spelled ?? (pitchClasses[targetPitchClass] ?? "C");
  });

  return spellingByPitchClass;
}
