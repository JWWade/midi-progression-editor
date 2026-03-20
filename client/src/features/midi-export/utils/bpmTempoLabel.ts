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
