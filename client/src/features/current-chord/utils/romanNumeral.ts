import type { ChordType } from "@/features/chord/types";
import type { ScaleType } from "@/features/scale/types";
import { SCALE_INTERVALS } from "@/features/scale/types";

export interface RomanNumeralAnalysis {
  /** Display string, e.g. "♭VII" or "V". */
  label: string;
  /** 0-based scale step (0 = tonic). */
  degree: number;
  /** Chromatic accidental relative to the scale degree, or null if in key. */
  accidental: "♭" | "♯" | null;
  isDiatonic: boolean;
  /**
   * Reserved: future flow-based functional scoring (V→I ≠ random adjacency).
   * Always undefined in v1.
   */
  contextualWeight?: number;
  /**
   * True when isDiatonic===false and chord quality implies a harmonic function
   * (e.g. dom7 not occupying scale degree V). Passive flag only — not rendered
   * in v1. Hook for future secondary-dominant tooltips and scoring.
   */
  isFunctionalOutlier?: boolean;
}

/** Roman numeral strings by scale degree (0-based). Upper = major quality basis. */
const DEGREE_UPPER = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;
const DEGREE_LOWER = ["i", "ii", "iii", "iv", "v", "vi", "vii"] as const;

/** Chord qualities whose scale-degree basis is minor/dim → lowercase numeral. */
const MINOR_QUALITY_BASIS = new Set<ChordType>(["minor", "dim", "min7", "halfdim7"]);

/**
 * Computes the Roman numeral analysis for a chord relative to a key.
 *
 * Degree identity is primary: we identify the scale step first, then annotate
 * any quality or accidental deviation. A non-diatonic result always carries its
 * accidental in the label so it reads as "intentionally incomplete" rather than
 * quietly misleading.
 *
 * Extension point (not implemented in E12):
 * @see getHarmonicFunction — for secondary dominants (V/V, V/ii), borrowed chords, etc.
 */
export function getRomanNumeral(
  chordRoot: number,
  keyRoot: number,
  keyScale: ScaleType,
  chordQuality: ChordType,
): RomanNumeralAnalysis {
  const intervals = SCALE_INTERVALS[keyScale];

  // Semitone distance of chordRoot from keyRoot (mod 12)
  const semitones = ((chordRoot - keyRoot) % 12 + 12) % 12;

  const diatonicIndex = intervals.indexOf(semitones);
  const isDiatonic = diatonicIndex !== -1;

  if (isDiatonic) {
    // Determine expected quality for this scale degree
    const useLower = MINOR_QUALITY_BASIS.has(chordQuality);
    const numeralStr = useLower ? DEGREE_LOWER[diatonicIndex] : DEGREE_UPPER[diatonicIndex];

    // Diminished chords get the ° symbol
    const label =
      chordQuality === "dim" || chordQuality === "halfdim7"
        ? `${numeralStr}°`
        : (numeralStr ?? "?");

    return {
      label,
      degree: diatonicIndex,
      accidental: null,
      isDiatonic: true,
    };
  }

  // Non-diatonic: find the nearest scale degree below and compute accidental
  let nearestDegreeIndex = 0;
  let nearestSemitones = 0;
  for (let i = intervals.length - 1; i >= 0; i--) {
    const interval = intervals[i];
    if (interval !== undefined && interval <= semitones) {
      nearestDegreeIndex = i;
      nearestSemitones = interval;
      break;
    }
  }

  const diff = semitones - nearestSemitones;
  let accidental: "♭" | "♯" | null = null;
  let degreeIndex = nearestDegreeIndex;

  if (diff === 1) {
    // One semitone above the nearest scale degree → sharp of that degree
    accidental = "♯";
  } else {
    // One semitone below the next scale degree → flat of that degree
    degreeIndex = (nearestDegreeIndex + 1) % intervals.length;
    accidental = "♭";
  }

  const useLower = MINOR_QUALITY_BASIS.has(chordQuality);
  const numeralStr = useLower ? DEGREE_LOWER[degreeIndex] : DEGREE_UPPER[degreeIndex];
  const qualitySuffix =
    chordQuality === "dim" || chordQuality === "halfdim7" ? "°" : "";
  const label = `${accidental}${numeralStr ?? "?"}${qualitySuffix}`;

  // isFunctionalOutlier: dom7 not occupying scale degree V
  const scaleVInterval = intervals[4]; // scale degree V
  const isFunctionalOutlier =
    chordQuality === "dom7" && scaleVInterval !== undefined && semitones !== scaleVInterval;

  return {
    label,
    degree: degreeIndex,
    accidental,
    isDiatonic: false,
    isFunctionalOutlier,
  };
}

// Future extension point (not implemented in E12):
// export function getHarmonicFunction(chord, key): HarmonicFunction
// → handles secondary dominants (V/V, V/ii), borrowed chords (♭VI, iv), etc.
