import type { ChordType } from "@/features/chord/types";
import { DIATONIC_OPACITY, CHROMATIC_OPACITY } from "./scaleUtils";

/** Visual style returned for a single note node on the chromatic circle. */
export interface NoteStyle {
  /** CSS color string or SVG gradient reference (e.g. `url(#chord-tone-major)`). */
  fill: string;
  /** Element-level opacity (0–1). */
  opacity: number;
  /** Fill color for the note label text. */
  textFill: string;
}

// Default note-node colours (mirror the constants in ChromaticCircle.tsx so that
// non-chord-tone nodes render identically to the existing behaviour).
const NOTE_DIATONIC_FILL = "#4F46E5";
const NOTE_CHROMATIC_FILL = "#D1D5DB";
const NOTE_CHROMATIC_TEXT = "#4B5563";

/**
 * Per-quality expressive fill colours for chord-tone nodes.
 * Each hue is vivid and saturated so that chord members pop against the
 * ambient background tint and maintain sufficient contrast with white text.
 */
export const CHORD_TONE_FILLS: Readonly<Record<ChordType, string>> = {
  major:    "#4F46E5", // indigo  – bright, uplifting
  minor:    "#7C3AED", // violet  – darker, introspective
  maj7:     "#0EA5E9", // sky-blue – luminous, open
  min7:     "#6D28D9", // deep-purple – rich, complex
  dom7:     "#D97706", // amber   – warm, tense
  halfdim7: "#0891B2", // cyan    – cool, ambiguous
};

/**
 * Returns the SVG `<radialGradient>` `id` used for a chord-tone node of the
 * given quality.  The matching gradient must be defined in the SVG `<defs>`.
 */
export function chordToneGradientId(quality: ChordType): string {
  return `chord-tone-${quality}`;
}

/**
 * Computes the visual style for a single note node on the chromatic circle.
 *
 * Priority:
 *  1. **Chord tone**  → expressive radial-gradient fill (`url(#chord-tone-{quality})`)
 *  2. **Diatonic**    → solid primary colour, full opacity
 *  3. **Chromatic**   → light grey, reduced opacity
 *
 * @param index          Chromatic index of the note (0 = C … 11 = B).
 * @param chordIndices   Chromatic indices of all notes in the target chord.
 * @param quality        Chord quality used to select the expressive fill colour.
 * @param diatonicIndices Set of diatonic note indices for the current key/scale.
 */
export function getNoteStyle(
  index: number,
  chordIndices: number[],
  quality: ChordType,
  diatonicIndices: Set<number>,
): NoteStyle {
  if (chordIndices.includes(index)) {
    return {
      fill: `url(#${chordToneGradientId(quality)})`,
      opacity: 1,
      textFill: "#fff",
    };
  }
  if (diatonicIndices.has(index)) {
    return {
      fill: NOTE_DIATONIC_FILL,
      opacity: DIATONIC_OPACITY,
      textFill: "#fff",
    };
  }
  return {
    fill: NOTE_CHROMATIC_FILL,
    opacity: CHROMATIC_OPACITY,
    textFill: NOTE_CHROMATIC_TEXT,
  };
}
