export type ChordRole = "root" | "third" | "fifth" | "seventh";

export interface ChordNoteInfo {
  index: number;
  name: string;
  role: ChordRole;
}

export type ChordType = "major" | "minor" | "dim" | "aug" | "maj7" | "min7" | "dom7" | "halfdim7" | "quartal";

/**
 * The set of valid chord extension labels.
 *
 * These strings are used in {@link Chord.extensions} to indicate which upper
 * partials are added above the base chord quality.
 */
export type ChordExtension = "9" | "b9" | "#9" | "11" | "#11" | "13" | "b13";

export const SEVENTH_CHORD_TYPES: ReadonlySet<ChordType> = new Set([
  "maj7",
  "min7",
  "dom7",
  "halfdim7",
]);
