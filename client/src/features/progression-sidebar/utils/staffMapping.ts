export type StaffClef = "treble" | "bass";
export type AccidentalPreference = "auto" | "sharp" | "flat";

export interface StaffNoteLayout {
  midi: number;
  noteLabel: string;
  x: number;
  y: number;
  accidental: "#" | "b" | null;
  ledgerLineYs: number[];
}

const FALLBACK_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SHARP_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NOTE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
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

const CHART_WIDTH = 156;
const CHART_RIGHT_PADDING = 12;
const STAFF_BOTTOM_LINE_Y = 64;
const STAFF_STEP_PX = 6;
const MIN_NOTEHEAD_SEPARATION_PX = 12;
const STACK_COLUMN_X = 102;

function toPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

function toNoteName(
  pitchClass: number,
  pitchClasses: readonly string[],
  accidentalPreference: AccidentalPreference,
): string {
  if (accidentalPreference === "sharp") {
    return SHARP_NOTE_NAMES[pitchClass] ?? FALLBACK_NOTE_NAMES[pitchClass] ?? "C";
  }
  if (accidentalPreference === "flat") {
    return FLAT_NOTE_NAMES[pitchClass] ?? FALLBACK_NOTE_NAMES[pitchClass] ?? "C";
  }
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
  accidentalPreference: AccidentalPreference = "auto",
): StaffNoteLayout[] {
  if (voicedMidiNotes.length === 0) {
    return [];
  }

  const sortedVoicing = [...voicedMidiNotes].sort((a, b) => a - b);
  const width = CHART_WIDTH;
  const rightPadding = CHART_RIGHT_PADDING;
  const bottomLineY = STAFF_BOTTOM_LINE_Y;
  const stepPx = STAFF_STEP_PX;

  const bottomReference = STAFF_BOTTOM_LINE_REFERENCE[clef];
  const bottomReferenceDiatonic = toDiatonicNumber(bottomReference.letter, bottomReference.octave);
  const yForStep = (stepFromBottomLine: number) => bottomLineY - (stepFromBottomLine * stepPx);

    const layout = sortedVoicing.map((midi) => {
    const pitchClass = toPitchClass(midi);
    const noteName = toNoteName(pitchClass, pitchClasses, accidentalPreference);
    const { letter, accidental } = parseLetterAndAccidental(noteName);
    const octave = Math.floor(midi / 12) - 1;
    const diatonicNumber = toDiatonicNumber(letter, octave);
    const stepFromBottomLine = diatonicNumber - bottomReferenceDiatonic;
    const y = yForStep(stepFromBottomLine);

    return {
      midi,
      noteLabel: `${noteName}${octave}`,
      x: STACK_COLUMN_X,
      y,
      accidental,
      ledgerLineYs: getLedgerLineYs(stepFromBottomLine, yForStep),
    };
  });

  // Prevent notehead overlap for clustered notes by pushing colliding notes right.
  // Collisions are considered only when notes occupy the same or adjacent staff step.
  for (let i = 1; i < layout.length; i++) {
    const current = layout[i];
    if (!current) continue;

    for (let j = i - 1; j >= 0; j--) {
      const previous = layout[j];
      if (!previous) continue;

      const isSameOrAdjacentStep = Math.abs(current.y - previous.y) <= STAFF_STEP_PX;
      const isTooCloseHorizontally = Math.abs(current.x - previous.x) < MIN_NOTEHEAD_SEPARATION_PX;
      if (!isSameOrAdjacentStep || !isTooCloseHorizontally) {
        continue;
      }

      current.x = Math.min(
        width - rightPadding,
        previous.x + MIN_NOTEHEAD_SEPARATION_PX,
      );
    }

    // Keep the stack visually centered by nudging unconstrained notes back
    // toward the target column when they did not need collision offsets.
    if (current.x > STACK_COLUMN_X && i < layout.length - 1) {
      const next = layout[i + 1];
      const nearNext = next
        ? Math.abs(current.y - next.y) <= STAFF_STEP_PX && Math.abs(current.x - next.x) < MIN_NOTEHEAD_SEPARATION_PX
        : false;
      if (!nearNext) {
        current.x = Math.max(STACK_COLUMN_X, current.x - 4);
      }
    }
  }

  return layout;
}
