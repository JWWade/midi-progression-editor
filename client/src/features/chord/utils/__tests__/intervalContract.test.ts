/**
 * @file intervalContract.test.ts
 *
 * Contract tests: assert that the frontend CHORD_INTERVALS table matches the
 * canonical interval values defined in the backend ChordGenerator.cs.
 *
 * These tests act as a compile-time + runtime firewall against accidental drift
 * between the two definitions.  If the backend adds or modifies a chord quality,
 * the corresponding update must be made to the frontend CHORD_INTERVALS and this
 * test must continue to pass.
 *
 * Reference: server/ParametricMusic.Api/Services/ChordGenerator.cs – Intervals dict.
 */
import { describe, it, expect } from "vitest";
import { CHORD_INTERVALS } from "../transpose";

/**
 * Canonical interval patterns copied verbatim from
 * `ChordGenerator.Intervals` in the backend.
 *
 * Tertian (Western tonal harmony) intervals following Aldwell & Schachter,
 * *Harmony and Voice Leading*, 4th ed., 2010.
 */
const BACKEND_CHORD_INTERVALS = {
  // Triads
  major:    [0, 4, 7],
  minor:    [0, 3, 7],
  dim:      [0, 3, 6],
  aug:      [0, 4, 8],
  // Sixth chord
  maj6:     [0, 4, 7, 9],
  // Seventh chords
  maj7:     [0, 4, 7, 11],
  min7:     [0, 3, 7, 10],
  minmaj7:  [0, 3, 7, 11],
  dom7:     [0, 4, 7, 10],
  halfdim7: [0, 3, 6, 10],
  // Quartal (stacked perfect fourths)
  quartal:  [0, 5, 10],
} as const;

describe("CHORD_INTERVALS frontend↔backend contract", () => {
  it("major triad matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.major)).toEqual(BACKEND_CHORD_INTERVALS.major);
  });

  it("minor triad matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.minor)).toEqual(BACKEND_CHORD_INTERVALS.minor);
  });

  it("diminished triad matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.dim)).toEqual(BACKEND_CHORD_INTERVALS.dim);
  });

  it("augmented triad matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.aug)).toEqual(BACKEND_CHORD_INTERVALS.aug);
  });

  it("major 6th matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.maj6)).toEqual(BACKEND_CHORD_INTERVALS.maj6);
  });

  it("major 7th matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.maj7)).toEqual(BACKEND_CHORD_INTERVALS.maj7);
  });

  it("minor 7th matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.min7)).toEqual(BACKEND_CHORD_INTERVALS.min7);
  });

  it("minor-major 7th matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.minmaj7)).toEqual(BACKEND_CHORD_INTERVALS.minmaj7);
  });

  it("dominant 7th matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.dom7)).toEqual(BACKEND_CHORD_INTERVALS.dom7);
  });

  it("half-diminished 7th matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.halfdim7)).toEqual(BACKEND_CHORD_INTERVALS.halfdim7);
  });

  it("quartal chord matches backend", () => {
    expect(Array.from(CHORD_INTERVALS.quartal)).toEqual(BACKEND_CHORD_INTERVALS.quartal);
  });

  it("all 11 chord qualities have a matching backend entry", () => {
    const backendQualities = Object.keys(BACKEND_CHORD_INTERVALS) as Array<keyof typeof BACKEND_CHORD_INTERVALS>;
    for (const quality of backendQualities) {
      expect(CHORD_INTERVALS[quality]).toBeDefined();
    }
  });

  it("all intervals start with 0 (root position)", () => {
    for (const [quality] of Object.entries(BACKEND_CHORD_INTERVALS)) {
      expect(CHORD_INTERVALS[quality as keyof typeof BACKEND_CHORD_INTERVALS][0]).toBe(0);
    }
  });
});
