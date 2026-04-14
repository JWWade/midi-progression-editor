import type { ScaleContext } from "@/shared/types/ScaleContext";
import { getDiatonicIndices } from "@/features/scale/utils";
import { getChordPitchClasses } from "./getChordPitchClasses";
import { findNearestChord } from "./findNearestChord";
import type { Chord } from "@/features/current-chord/types";

export type AxisType = "through-note" | "between-notes";
export type ReflectionMode = "chromatic" | "scale-aware";
export type CollisionStrategy = "allow-collapse" | "spread-to-nearest-available";

export interface ReflectionAxis {
  /** The axis value used in the formula.  0–11 for through-note; 0.5–11.5 for between-notes. */
  value: number;
  type: AxisType;
  /** Human-readable label, e.g. "C / F♯ axis" or "between C and C♯". */
  label: string;
}

export interface ReflectChordOptions {
  axis: ReflectionAxis;
  mode: ReflectionMode;
  collision?: CollisionStrategy;
  /** Required when mode === "scale-aware". */
  scaleContext?: ScaleContext | null;
}

const NOTE_NAMES = [
  "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B",
] as const;

/** Core formula: f_a(x) = (2a - x) mod 12 */
export function reflectPitchClass(pc: number, axisValue: number): number {
  return ((2 * axisValue - pc) % 12 + 12) % 12;
}

/** Generate all 24 standard reflection axes (12 through-note + 12 between-notes). */
export function allReflectionAxes(): ReflectionAxis[] {
  const axes: ReflectionAxis[] = [];

  // 12 through-note axes (integer values 0–11)
  for (let a = 0; a < 12; a++) {
    const opposite = (a + 6) % 12;
    axes.push({
      value: a,
      type: "through-note",
      label: `${NOTE_NAMES[a]} / ${NOTE_NAMES[opposite]} axis`,
    });
  }

  // 12 between-notes axes (half-integer values 0.5–11.5)
  for (let a = 0; a < 12; a++) {
    const next = (a + 1) % 12;
    axes.push({
      value: a + 0.5,
      type: "between-notes",
      label: `between ${NOTE_NAMES[a]} and ${NOTE_NAMES[next]}`,
    });
  }

  return axes;
}

/** Returns true when f_a(pcs) === pcs as a set (chord is a fixed point of the reflection). */
export function isSymmetricUnderAxis(pcs: number[], axisValue: number): boolean {
  const originalSet = new Set(pcs);
  for (const pc of pcs) {
    if (!originalSet.has(reflectPitchClass(pc, axisValue))) return false;
  }
  return true;
}

/**
 * Spreads colliding reflected pitch classes to the nearest available pitch classes,
 * preserving the original cardinality.
 */
function spreadCollisions(reflected: number[]): number[] {
  const used = new Set<number>();
  const result: number[] = [];
  const pending: number[] = [];

  // First pass: assign non-colliding notes
  for (const pc of reflected) {
    if (!used.has(pc)) {
      used.add(pc);
      result.push(pc);
    } else {
      pending.push(pc);
    }
  }

  // Second pass: handle collisions by finding nearest available pitch class
  for (const preferred of pending) {
    let found = false;
    for (let d = 1; d < 12; d++) {
      const candidates = [(preferred + d) % 12, (preferred - d + 12) % 12];
      for (const c of candidates) {
        if (!used.has(c)) {
          used.add(c);
          result.push(c);
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }

  return result.sort((a, b) => a - b);
}

/** Snap a pitch class to the nearest diatonic degree in the given scale. */
function snapToDiatonic(pc: number, diatonicSet: Set<number>): number {
  if (diatonicSet.has(pc)) return pc;
  for (let d = 1; d < 12; d++) {
    const up = (pc + d) % 12;
    if (diatonicSet.has(up)) return up;
    const down = (pc - d + 12) % 12;
    if (diatonicSet.has(down)) return down;
  }
  return pc;
}

/** Reflect an entire pitch-class set. */
export function reflectPitchClasses(
  pcs: number[],
  options: ReflectChordOptions,
): number[] {
  const { axis, mode, collision = "allow-collapse", scaleContext } = options;

  if (mode === "chromatic") {
    // Step 1: apply f_a to each pitch class
    const reflected = pcs.map((pc) => reflectPitchClass(pc, axis.value));

    if (collision === "spread-to-nearest-available") {
      return spreadCollisions(reflected);
    }
    // allow-collapse: deduplicate and sort
    return [...new Set(reflected)].sort((a, b) => a - b);
  }

  // scale-aware mode: apply f_a then snap each to nearest diatonic degree
  const reflected = pcs.map((pc) => reflectPitchClass(pc, axis.value));

  if (!scaleContext) {
    // No scale context — fall back to chromatic collapse
    return [...new Set(reflected)].sort((a, b) => a - b);
  }

  const diatonicSet = getDiatonicIndices(scaleContext.root, scaleContext.mode);
  const snapped = reflected.map((pc) => snapToDiatonic(pc, diatonicSet));

  if (collision === "spread-to-nearest-available") {
    return spreadCollisions(snapped);
  }
  return [...new Set(snapped)].sort((a, b) => a - b);
}

/**
 * Reflect a full Chord. Returns a Chord with customNotes set to the reflected pcs.
 * root and quality are best-fit derived from the reflected set.
 */
export function reflectChord(chord: Chord, options: ReflectChordOptions): Chord {
  const sourcePcs = getChordPitchClasses(chord);
  const reflectedPcs = reflectPitchClasses(sourcePcs, options);
  const nearest = findNearestChord(reflectedPcs);

  return {
    root: nearest.root,
    quality: nearest.quality,
    customNotes: reflectedPcs,
  };
}
