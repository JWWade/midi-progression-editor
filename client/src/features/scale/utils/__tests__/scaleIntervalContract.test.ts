/**
 * @file scaleIntervalContract.test.ts
 *
 * Regression tests: assert that the SCALE_INTERVALS table retains its
 * canonical scale interval values.
 *
 * These tests act as a compile-time + runtime firewall against accidental drift
 * against accidental drift from the established scale definitions.
 */
import { describe, it, expect } from "vitest";
import { SCALE_INTERVALS } from "../../../scale/types/scales";

/**
 * Canonical scale interval patterns for the supported modes.
 *
 * Diatonic and modal intervals following Aldwell & Schachter,
 * *Harmony and Voice Leading*, 4th ed., 2010, and Levine,
 * *The Jazz Theory Book*, 1995.
 */
const REFERENCE_SCALE_INTERVALS = {
  major:         [0, 2, 4, 5, 7, 9, 11],
  naturalMinor:  [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor:  [0, 2, 3, 5, 7, 9, 11],
  dorian:        [0, 2, 3, 5, 7, 9, 10],
  phrygian:      [0, 1, 3, 5, 7, 8, 10],
  lydian:        [0, 2, 4, 6, 7, 9, 11],
  mixolydian:    [0, 2, 4, 5, 7, 9, 10],
} as const;

describe("SCALE_INTERVALS reference patterns", () => {
  it("major matches the reference", () => {
    expect(Array.from(SCALE_INTERVALS.major)).toEqual(REFERENCE_SCALE_INTERVALS.major);
  });

  it("natural minor matches the reference", () => {
    expect(Array.from(SCALE_INTERVALS.naturalMinor)).toEqual(REFERENCE_SCALE_INTERVALS.naturalMinor);
  });

  it("harmonic minor matches the reference", () => {
    expect(Array.from(SCALE_INTERVALS.harmonicMinor)).toEqual(REFERENCE_SCALE_INTERVALS.harmonicMinor);
  });

  it("melodic minor matches the reference", () => {
    expect(Array.from(SCALE_INTERVALS.melodicMinor)).toEqual(REFERENCE_SCALE_INTERVALS.melodicMinor);
  });

  it("dorian matches the reference", () => {
    expect(Array.from(SCALE_INTERVALS.dorian)).toEqual(REFERENCE_SCALE_INTERVALS.dorian);
  });

  it("phrygian matches the reference", () => {
    expect(Array.from(SCALE_INTERVALS.phrygian)).toEqual(REFERENCE_SCALE_INTERVALS.phrygian);
  });

  it("lydian matches the reference", () => {
    expect(Array.from(SCALE_INTERVALS.lydian)).toEqual(REFERENCE_SCALE_INTERVALS.lydian);
  });

  it("mixolydian matches the reference", () => {
    expect(Array.from(SCALE_INTERVALS.mixolydian)).toEqual(REFERENCE_SCALE_INTERVALS.mixolydian);
  });

  it("all 8 scale modes have a reference entry", () => {
    const referenceModes = Object.keys(REFERENCE_SCALE_INTERVALS) as Array<keyof typeof REFERENCE_SCALE_INTERVALS>;
    for (const mode of referenceModes) {
      expect(SCALE_INTERVALS[mode]).toBeDefined();
    }
  });

  it("all scale intervals start with 0 (root position)", () => {
    for (const [mode] of Object.entries(REFERENCE_SCALE_INTERVALS)) {
      expect(SCALE_INTERVALS[mode as keyof typeof REFERENCE_SCALE_INTERVALS][0]).toBe(0);
    }
  });

  it("all scale modes return exactly 7 pitch classes", () => {
    for (const [mode] of Object.entries(REFERENCE_SCALE_INTERVALS)) {
      expect(SCALE_INTERVALS[mode as keyof typeof REFERENCE_SCALE_INTERVALS]).toHaveLength(7);
    }
  });
});
