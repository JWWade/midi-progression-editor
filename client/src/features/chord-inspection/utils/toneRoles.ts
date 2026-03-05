import type { ChordType } from "@/features/chord/types";

const TONE_ROLES: Record<ChordType, Record<number, string>> = {
  major: {
    0: "Root",
    4: "Major Third",
    7: "Perfect Fifth",
  },
  minor: {
    0: "Root",
    3: "Minor Third",
    7: "Perfect Fifth",
  },
  maj7: {
    0: "Root",
    4: "Major Third",
    7: "Perfect Fifth",
    11: "Major Seventh",
  },
  min7: {
    0: "Root",
    3: "Minor Third",
    7: "Perfect Fifth",
    10: "Minor Seventh",
  },
  dom7: {
    0: "Root",
    4: "Major Third",
    7: "Perfect Fifth",
    10: "Minor Seventh",
  },
  halfdim7: {
    0: "Root",
    3: "Minor Third",
    6: "Diminished Fifth",
    10: "Minor Seventh",
  },
};

/**
 * Returns the human-readable role name for a note at the given interval from root.
 */
export function getToneRole(intervalFromRoot: number, chordType: ChordType): string {
  return TONE_ROLES[chordType]?.[intervalFromRoot] ?? `+${intervalFromRoot} semitones`;
}

/**
 * Calculates the frequency of a note given its chromatic index (0=C, 11=B) and octave.
 * Octave 4 places C4 (middle C) at ~261.63 Hz.
 * MIDI note number: C4 = 60, A4 = 69 = 440 Hz.
 */
export function noteIndexToFrequency(noteIndex: number, octave: number = 4): number {
  // MIDI note: C-1 = 0, C4 = 60, A4 = 69
  const midiNote = noteIndex + (octave + 1) * 12;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}
