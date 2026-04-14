export type ChordRole = "root" | "second" | "third" | "fourth" | "fifth" | "sixth" | "seventh";

export interface ChordNoteInfo {
  index: number;
  name: string;
  role: ChordRole;
}

export type ChordType = "major" | "minor" | "dim" | "aug" | "sus2" | "dom7sus4" | "maj6" | "min6" | "maj7" | "min7" | "minmaj7" | "dom7" | "halfdim7" | "quartal";

/**
 * The set of valid chord extension labels.
 *
 * These strings are used in {@link Chord.extensions} to indicate which upper
 * partials are added above the base chord quality.
 */
export type ChordExtension = "9" | "b9" | "#9" | "11" | "#11" | "13" | "b13";

export const SEVENTH_CHORD_TYPES: ReadonlySet<ChordType> = new Set([
  "maj6",
  "min6",
  "maj7",
  "min7",
  "minmaj7",
  "dom7",
  "dom7sus4",
  "halfdim7",
]);
