/** Tempo marking thresholds (inclusive lower bound, exclusive upper bound). */
const TEMPO_MARKINGS: ReadonlyArray<{ label: string; min: number }> = [
  { label: "Prestissimo", min: 200 },
  { label: "Presto",      min: 176 },
  { label: "Vivace",      min: 156 },
  { label: "Allegro",     min: 120 },
  { label: "Moderato",    min: 108 },
  { label: "Andante",     min: 76 },
  { label: "Adagio",      min: 60 },
  { label: "Largo",       min: 40 },
];

/**
 * Returns the classical tempo marking for a given BPM value.
 *
 * | Range       | Label       |
 * |-------------|-------------|
 * | 200–240     | Prestissimo |
 * | 176–199     | Presto      |
 * | 156–175     | Vivace      |
 * | 120–155     | Allegro     |
 * | 108–119     | Moderato    |
 * | 76–107      | Andante     |
 * | 60–75       | Adagio      |
 * | 40–59       | Largo       |
 */
export function getBpmTempoLabel(bpm: number): string {
  for (const { label, min } of TEMPO_MARKINGS) {
    if (bpm >= min) return label;
  }
  return "Largo";
}

/**
 * Returns the minimum BPM for a given tempo marking label.
 * Throws if label is not found.
 */
export function getTempoMarkingMin(label: string): number {
  const marking = TEMPO_MARKINGS.find(m => m.label.toLowerCase() === label.toLowerCase());
  if (!marking) throw new Error(`Unknown tempo marking: ${label}`);
  return marking.min;
}

/**
 * Returns the maximum BPM (exclusive) for a given tempo marking label.
 * This is the min BPM of the next faster marking, or Infinity for the fastest.
 * Throws if label is not found.
 */
export function getTempoMarkingMax(label: string): number {
  const idx = TEMPO_MARKINGS.findIndex(m => m.label.toLowerCase() === label.toLowerCase());
  if (idx === -1) throw new Error(`Unknown tempo marking: ${label}`);
  if (idx === 0) return Infinity;
  return TEMPO_MARKINGS[idx - 1].min;
}

/**
 * Returns a random integer BPM between the min of minLabel and max of maxLabel (inclusive lower, inclusive upper).
 * Example: getRandomBpmInRange("Adagio", "Presto") yields 60–199.
 */
export function getRandomBpmInRange(minLabel: string, maxLabel: string): number {
  const min = getTempoMarkingMin(minLabel);
  // max is exclusive, but we want inclusive, so subtract 1
  const max = getTempoMarkingMax(maxLabel) - 1;
  if (min > max) throw new Error(`Invalid tempo range: ${minLabel}–${maxLabel}`);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
