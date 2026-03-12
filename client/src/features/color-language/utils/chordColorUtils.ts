import type { ChordType } from "@/features/chord/types";
import { SEVENTH_CHORD_TYPES } from "@/features/chord/types";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import type { Chord } from "@/features/current-chord/types";

/**
 * Three tiers of harmonic complexity that control color intensity.
 *
 * | Tier      | Description                                | Visual treatment        |
 * |-----------|-------------------------------------------|-------------------------|
 * | triad     | Major/minor triads (no extensions)        | Base quality color      |
 * | seventh   | Seventh chords (maj7, min7, dom7, ½dim7)  | Deeper / more saturated |
 * | extended  | Extensions present (9ths, 11ths, 13ths)   | Richest / most saturated|
 */
export type ChordComplexity = "triad" | "seventh" | "extended";

/** Matches extension strings that indicate a 9th, 11th, or 13th. */
const EXTENDED_RE = /\b(9|11|13)\b/;

/**
 * Derives the {@link ChordComplexity} tier for a given chord.
 *
 * - Returns `"extended"` when `chord.extensions` contains a 9, 11, or 13.
 * - Returns `"seventh"` when the chord quality is a seventh-chord type and no
 *   extended interval is present.
 * - Returns `"triad"` otherwise.
 */
export function getChordComplexity(chord: Chord): ChordComplexity {
  if (chord.extensions?.some((ext) => EXTENDED_RE.test(ext))) {
    return "extended";
  }
  if (SEVENTH_CHORD_TYPES.has(chord.quality)) {
    return "seventh";
  }
  return "triad";
}

/**
 * Returns the final render color for the given chord quality and complexity
 * tier.
 *
 * - `"triad"`    → `base` (standard saturation)
 * - `"seventh"`  → `deeper` (15–20 pp more saturated, slightly darker)
 * - `"extended"` → `richest` (25–35 pp more saturated, noticeably darker)
 *
 * The hue family is always preserved; only saturation and lightness vary.
 */
export function getChordColor(quality: ChordType, complexity: ChordComplexity): string {
  const colors = ChordQualityColors[quality];
  switch (complexity) {
    case "seventh":  return colors.deeper;
    case "extended": return colors.richest;
    default:         return colors.base;
  }
}

/**
 * Derives a semi-transparent fill variant (12 % opacity) from the solid render
 * color for the given quality and complexity tier.  Used for polygon interior
 * fills where the circle background should show through.
 *
 * The input color must use the `hsl(H, S%, L%)` format used throughout
 * {@link ChordQualityColors}.
 */
export function getChordFillColor(quality: ChordType, complexity: ChordComplexity): string {
  const solidColor = getChordColor(quality, complexity);
  return solidColor.replace(/^hsl\(/, "hsla(").replace(/\)$/, ", 0.12)");
}

function parseHsl(color: string): [number, number, number] | null {
  const match = color.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]) / 100, Number(match[3]) / 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (hh >= 0 && hh < 1) {
    r = c;
    g = x;
  } else if (hh < 2) {
    r = x;
    g = c;
  } else if (hh < 3) {
    g = c;
    b = x;
  } else if (hh < 4) {
    g = x;
    b = c;
  } else if (hh < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const m = l - c / 2;
  return [r + m, g + m, b + m];
}

function toLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  const rl = toLinear(r);
  const gl = toLinear(g);
  const bl = toLinear(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Returns a text color with stronger contrast against a solid chord background.
 * Uses WCAG contrast ratio against white and a near-black tone.
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const parsed = parseHsl(backgroundColor);
  if (!parsed) return "#111827";

  const [h, s, l] = parsed;
  const [r, g, b] = hslToRgb(h, s, l);
  const bgLum = relativeLuminance(r, g, b);

  const whiteLum = 1;
  const darkLum = relativeLuminance(0x11 / 255, 0x18 / 255, 0x27 / 255);

  const whiteContrast = (Math.max(bgLum, whiteLum) + 0.05) / (Math.min(bgLum, whiteLum) + 0.05);
  const darkContrast = (Math.max(bgLum, darkLum) + 0.05) / (Math.min(bgLum, darkLum) + 0.05);

  return darkContrast >= whiteContrast ? "#111827" : "#ffffff";
}
