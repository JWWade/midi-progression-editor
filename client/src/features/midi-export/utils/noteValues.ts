/** Musical note value options for the Beats / chord selector. */
export interface NoteValueOption {
  /** Numeric beat count (1 = quarter, 2 = half, 4 = whole). */
  beats: number;
  /** Display name, e.g. "Quarter". */
  label: string;
  /** Accessible description, e.g. "Quarter note — 1 beat". */
  ariaLabel: string;
}

/** Ordered list of selectable note values (shortest to longest). */
export const NOTE_VALUE_OPTIONS: NoteValueOption[] = [
  { beats: 1, label: "Quarter", ariaLabel: "Quarter note — 1 beat" },
  { beats: 2, label: "Half", ariaLabel: "Half note — 2 beats" },
  { beats: 4, label: "Whole", ariaLabel: "Whole note — 4 beats" },
];

/** Returns the `NoteValueOption` that matches the given beat count, or `undefined`. */
export function getNoteValueOption(beats: number): NoteValueOption | undefined {
  return NOTE_VALUE_OPTIONS.find((opt) => opt.beats === beats);
}
