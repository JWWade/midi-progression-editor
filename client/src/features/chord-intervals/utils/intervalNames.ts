const INTERVAL_NAMES: Record<number, string> = {
  1: "m2",
  2: "M2",
  3: "m3",
  4: "M3",
  5: "P4",
  6: "A4/d5",
  7: "P5",
  8: "m6",
  9: "M6",
  10: "m7",
  11: "M7",
  12: "Octave",
};

/**
 * Returns the standard interval name for a given semitone distance.
 * Wraps values into the range [1, 12] before lookup.
 */
export function getIntervalName(semitones: number): string {
  const wrapped = ((semitones - 1) % 12) + 1;
  return INTERVAL_NAMES[wrapped] ?? `${wrapped}st`;
}

/**
 * Calculates the semitone intervals between consecutive note indices.
 * Includes the wrap-around interval from the last note back to the first.
 */
export function getIntervals(noteIndices: number[]): number[] {
  const intervals: number[] = [];
  for (let i = 0; i < noteIndices.length; i++) {
    const current = noteIndices[i]!;
    const next = noteIndices[(i + 1) % noteIndices.length]!;
    const interval = ((next - current) + 12) % 12;
    intervals.push(interval === 0 ? 12 : interval);
  }
  return intervals;
}
