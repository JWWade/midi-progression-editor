export type StaffClef = "treble" | "bass";

export interface StaffNoteLayout {
  midi: number;
  noteLabel: string;
  x: number;
  y: number;
  accidental: "#" | "b" | null;
  ledgerLineYs: number[];
}

const FALLBACK_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const LETTER_TO_DIATONIC_INDEX: Readonly<Record<string, number>> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

const STAFF_BOTTOM_LINE_REFERENCE: Readonly<Record<StaffClef, { letter: string; octave: number }>> = {
  treble: { letter: "E", octave: 4 },
  bass: { letter: "G", octave: 2 },
};

function toPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

function toNoteName(pitchClass: number, pitchClasses: readonly string[]): string {
  return pitchClasses[pitchClass] ?? FALLBACK_NOTE_NAMES[pitchClass] ?? "C";
}

function parseLetterAndAccidental(noteName: string): { letter: string; accidental: "#" | "b" | null } {
  const letter = noteName.charAt(0).toUpperCase();
  if (!(letter in LETTER_TO_DIATONIC_INDEX)) {
    return { letter: "C", accidental: null };
  }

  const suffix = noteName.slice(1);
  if (suffix.includes("#") || suffix.includes("♯")) {
    return { letter, accidental: "#" };
  }
  if (suffix.includes("b") || suffix.includes("♭")) {
    return { letter, accidental: "b" };
  }
  return { letter, accidental: null };
}

function toDiatonicNumber(letter: string, octave: number): number {
  return octave * 7 + (LETTER_TO_DIATONIC_INDEX[letter] ?? 0);
}

function getLedgerLineYs(stepFromBottomLine: number, yForStep: (step: number) => number): number[] {
  const yValues: number[] = [];

  if (stepFromBottomLine < 0) {
    for (let step = -2; step >= stepFromBottomLine; step -= 2) {
      yValues.push(yForStep(step));
    }
  } else if (stepFromBottomLine > 8) {
    for (let step = 10; step <= stepFromBottomLine; step += 2) {
      yValues.push(yForStep(step));
    }
  }

  return yValues;
}

/**
 * Chooses a single clef based on average note register for compact tile display.
 */
export function pickStaffClef(voicedMidiNotes: number[]): StaffClef {
  if (voicedMidiNotes.length === 0) return "treble";
  const averageMidi = voicedMidiNotes.reduce((sum, midi) => sum + midi, 0) / voicedMidiNotes.length;
  return averageMidi >= 60 ? "treble" : "bass";
}

export function buildStaffNoteLayout(
  voicedMidiNotes: number[],
  pitchClasses: readonly string[],
  clef: StaffClef,
): StaffNoteLayout[] {
  if (voicedMidiNotes.length === 0) {
    return [];
  }

  const sortedVoicing = [...voicedMidiNotes].sort((a, b) => a - b);
  const width = 150;
  const leftPadding = 34;
  const rightPadding = 14;
  const bottomLineY = 52;
  const stepPx = 5;
  const xStride = sortedVoicing.length === 1
    ? 0
    : (width - leftPadding - rightPadding) / (sortedVoicing.length - 1);

  const bottomReference = STAFF_BOTTOM_LINE_REFERENCE[clef];
  const bottomReferenceDiatonic = toDiatonicNumber(bottomReference.letter, bottomReference.octave);
  const yForStep = (stepFromBottomLine: number) => bottomLineY - (stepFromBottomLine * stepPx);

  return sortedVoicing.map((midi, index) => {
    const pitchClass = toPitchClass(midi);
    const noteName = toNoteName(pitchClass, pitchClasses);
    const { letter, accidental } = parseLetterAndAccidental(noteName);
    const octave = Math.floor(midi / 12) - 1;
    const diatonicNumber = toDiatonicNumber(letter, octave);
    const stepFromBottomLine = diatonicNumber - bottomReferenceDiatonic;
    const y = yForStep(stepFromBottomLine);

    return {
      midi,
      noteLabel: `${noteName}${octave}`,
      x: leftPadding + (xStride * index),
      y,
      accidental,
      ledgerLineYs: getLedgerLineYs(stepFromBottomLine, yForStep),
    };
  });
}
