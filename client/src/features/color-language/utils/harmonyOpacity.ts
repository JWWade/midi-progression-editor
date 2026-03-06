import { DIATONIC_OPACITY, CHROMATIC_OPACITY } from "@/features/chromatic-circle/utils/scaleUtils";

/**
 * Opacity applied to chord-tone nodes that fall outside the active key's scale
 * (chromatic chord tones, e.g. "blue notes"). The quality fill colour is
 * preserved; only the opacity is reduced to signal harmonic tension.
 */
export const CHORD_TONE_CHROMATIC_OPACITY = 0.7;

// Re-export so callers can access all opacity constants from one import path.
export { DIATONIC_OPACITY, CHROMATIC_OPACITY };

/**
 * Returns the element-level opacity for a note based on its harmonic function.
 *
 * | Tone type                  | Opacity                                      |
 * |----------------------------|----------------------------------------------|
 * | Chord tone + diatonic      | {@link DIATONIC_OPACITY} (1.0)               |
 * | Chord tone + chromatic     | {@link CHORD_TONE_CHROMATIC_OPACITY} (0.7)   |
 * | Non-chord-tone + diatonic  | {@link DIATONIC_OPACITY} (1.0)               |
 * | Non-chord-tone + chromatic | {@link CHROMATIC_OPACITY} (0.3)              |
 *
 * @param noteIndex       Chromatic index of the note (0 = C … 11 = B).
 * @param diatonicIndices Set of diatonic note indices for the current key.
 * @param isChordTone     Whether the note is part of the active chord.
 */
export function getHarmonyOpacity(
  noteIndex: number,
  diatonicIndices: Set<number>,
  isChordTone: boolean,
): number {
  const isDiatonic = diatonicIndices.has(noteIndex);
  if (isDiatonic) return DIATONIC_OPACITY;
  return isChordTone ? CHORD_TONE_CHROMATIC_OPACITY : CHROMATIC_OPACITY;
}
