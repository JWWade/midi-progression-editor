/**
 * @file scaleIntervalContract.test.ts
 *
 * Contract tests: assert that the frontend SCALE_INTERVALS table matches the
 * canonical interval values defined in the backend ScaleGenerator.cs.
 *
 * These tests act as a compile-time + runtime firewall against accidental drift
 * between the two definitions.  If the backend adds or modifies a scale mode,
 * the corresponding update must be made to the frontend SCALE_INTERVALS and this
 * test must continue to pass.
 *
 * Reference: server/ParametricMusic.Api/Services/ScaleGenerator.cs – ScaleIntervals dict.
 */
import { describe, it, expect } from "vitest";
import { SCALE_INTERVALS } from "../../../scale/types/scales";

/**
 * Canonical scale interval patterns copied verbatim from
 * `ScaleGenerator.ScaleIntervals` in the backend.
 *
 * Diatonic and modal intervals following Aldwell & Schachter,
 * *Harmony and Voice Leading*, 4th ed., 2010, and Levine,
 * *The Jazz Theory Book*, 1995.
 */
const BACKEND_SCALE_INTERVALS = {
  major:         [0, 2, 4, 5, 7, 9, 11],
  naturalMinor:  [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor:  [0, 2, 3, 5, 7, 9, 11],
  dorian:        [0, 2, 3, 5, 7, 9, 10],
  phrygian:      [0, 1, 3, 5, 7, 8, 10],
  lydian:        [0, 2, 4, 6, 7, 9, 11],
  mixolydian:    [0, 2, 4, 5, 7, 9, 10],
} as const;

describe("SCALE_INTERVALS frontend↔backend contract", () => {
  it("major matches backend", () => {
    expect(Array.from(SCALE_INTERVALS.major)).toEqual(BACKEND_SCALE_INTERVALS.major);
  });

  it("natural minor matches backend", () => {
    expect(Array.from(SCALE_INTERVALS.naturalMinor)).toEqual(BACKEND_SCALE_INTERVALS.naturalMinor);
  });

  it("harmonic minor matches backend", () => {
    expect(Array.from(SCALE_INTERVALS.harmonicMinor)).toEqual(BACKEND_SCALE_INTERVALS.harmonicMinor);
  });

  it("melodic minor matches backend", () => {
    expect(Array.from(SCALE_INTERVALS.melodicMinor)).toEqual(BACKEND_SCALE_INTERVALS.melodicMinor);
  });

  it("dorian matches backend", () => {
    expect(Array.from(SCALE_INTERVALS.dorian)).toEqual(BACKEND_SCALE_INTERVALS.dorian);
  });

  it("phrygian matches backend", () => {
    expect(Array.from(SCALE_INTERVALS.phrygian)).toEqual(BACKEND_SCALE_INTERVALS.phrygian);
  });

  it("lydian matches backend", () => {
    expect(Array.from(SCALE_INTERVALS.lydian)).toEqual(BACKEND_SCALE_INTERVALS.lydian);
  });

  it("mixolydian matches backend", () => {
    expect(Array.from(SCALE_INTERVALS.mixolydian)).toEqual(BACKEND_SCALE_INTERVALS.mixolydian);
  });

  it("all 8 scale modes have a matching backend entry", () => {
    const backendModes = Object.keys(BACKEND_SCALE_INTERVALS) as Array<keyof typeof BACKEND_SCALE_INTERVALS>;
    for (const mode of backendModes) {
      expect(SCALE_INTERVALS[mode]).toBeDefined();
    }
  });

  it("all scale intervals start with 0 (root position)", () => {
    for (const [mode] of Object.entries(BACKEND_SCALE_INTERVALS)) {
      expect(SCALE_INTERVALS[mode as keyof typeof BACKEND_SCALE_INTERVALS][0]).toBe(0);
    }
  });

  it("all scale modes return exactly 7 pitch classes", () => {
    for (const [mode] of Object.entries(BACKEND_SCALE_INTERVALS)) {
      expect(SCALE_INTERVALS[mode as keyof typeof BACKEND_SCALE_INTERVALS]).toHaveLength(7);
    }
  });
});
