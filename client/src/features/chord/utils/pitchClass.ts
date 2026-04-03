const CHROMATIC_STEPS = 12;

/** Normalizes any integer to a pitch class in the range 0..11. */
export function normalizePitchClass(value: number): number {
  return ((value % CHROMATIC_STEPS) + CHROMATIC_STEPS) % CHROMATIC_STEPS;
}

/** Normalizes all input values to pitch classes in the range 0..11. */
export function normalizePitchClasses(values: readonly number[]): number[] {
  return values.map(normalizePitchClass);
}

/**
 * Deduplicates pitch classes after normalization while preserving first-seen
 * order in the normalized sequence.
 */
export function dedupeNormalizedPitchClasses(values: readonly number[]): number[] {
  const result: number[] = [];
  const seen = new Set<number>();

  for (const value of values) {
    const pc = normalizePitchClass(value);
    if (seen.has(pc)) continue;
    seen.add(pc);
    result.push(pc);
  }

  return result;
}

/** Returns sorted, unique, normalized pitch classes in ascending circular order. */
export function uniqueSortedPitchClasses(values: readonly number[]): number[] {
  return dedupeNormalizedPitchClasses(values).sort((a, b) => a - b);
}
