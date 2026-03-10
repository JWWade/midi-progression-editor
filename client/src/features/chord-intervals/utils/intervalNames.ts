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

/**
 * Calculates intervals from the root note (first element) to each other chord tone.
 * Returns one entry per polygon edge. Edges that do not touch the root return null
 * so the caller can skip them.
 *
 * For a chord [root, third, fifth]:
 *   index 0 (root → third edge): returns root→third semitones  (e.g. 4 = M3)
 *   index 1 (third → fifth edge): returns null  (skip E–G on a C major chord)
 *   index 2 (fifth → root edge): returns root→fifth semitones  (e.g. 7 = P5)
 */
export function getRootIntervals(noteIndices: number[]): (number | null)[] {
  if (noteIndices.length < 2) return [];
  const root = noteIndices[0]!;

  const semitones = (note: number): number => {
    const interval = ((note - root) + 12) % 12;
    return interval === 0 ? 12 : interval;
  };

  return noteIndices.map((_note, i) => {
    if (i === 0) {
      // Edge from root to next note
      return semitones(noteIndices[1]!);
    } else if (i === noteIndices.length - 1) {
      // Edge from last note back to root — report as root→last
      return semitones(noteIndices[i]!);
    } else {
      // Edge between two non-root notes — omit
      return null;
    }
  });
}
