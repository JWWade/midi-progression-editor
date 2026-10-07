/**
 * @file intervalContract.test.ts
 *
 * Regression tests: assert that the CHORD_INTERVALS table retains its
 * canonical chord interval values.
 *
 * These tests act as a compile-time + runtime firewall against accidental drift
 * against accidental drift from the established chord definitions.
 */
import { describe, it, expect } from "vitest";
import { CHORD_INTERVALS } from "../transpose";

/**
 * Canonical interval patterns for the supported chord qualities.
 *
 * Tertian (Western tonal harmony) intervals following Aldwell & Schachter,
 * *Harmony and Voice Leading*, 4th ed., 2010.
 */
const REFERENCE_CHORD_INTERVALS = {
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

describe("CHORD_INTERVALS reference patterns", () => {
  it("major triad matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.major)).toEqual(REFERENCE_CHORD_INTERVALS.major);
  });

  it("minor triad matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.minor)).toEqual(REFERENCE_CHORD_INTERVALS.minor);
  });

  it("diminished triad matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.dim)).toEqual(REFERENCE_CHORD_INTERVALS.dim);
  });

  it("augmented triad matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.aug)).toEqual(REFERENCE_CHORD_INTERVALS.aug);
  });

  it("major 6th matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.maj6)).toEqual(REFERENCE_CHORD_INTERVALS.maj6);
  });

  it("major 7th matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.maj7)).toEqual(REFERENCE_CHORD_INTERVALS.maj7);
  });

  it("minor 7th matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.min7)).toEqual(REFERENCE_CHORD_INTERVALS.min7);
  });

  it("minor-major 7th matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.minmaj7)).toEqual(REFERENCE_CHORD_INTERVALS.minmaj7);
  });

  it("dominant 7th matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.dom7)).toEqual(REFERENCE_CHORD_INTERVALS.dom7);
  });

  it("half-diminished 7th matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.halfdim7)).toEqual(REFERENCE_CHORD_INTERVALS.halfdim7);
  });

  it("quartal chord matches the reference", () => {
    expect(Array.from(CHORD_INTERVALS.quartal)).toEqual(REFERENCE_CHORD_INTERVALS.quartal);
  });

  it("all 11 chord qualities have a reference entry", () => {
    const referenceQualities = Object.keys(REFERENCE_CHORD_INTERVALS) as Array<keyof typeof REFERENCE_CHORD_INTERVALS>;
    for (const quality of referenceQualities) {
      expect(CHORD_INTERVALS[quality]).toBeDefined();
    }
  });

  it("all intervals start with 0 (root position)", () => {
    for (const [quality] of Object.entries(REFERENCE_CHORD_INTERVALS)) {
      expect(CHORD_INTERVALS[quality as keyof typeof REFERENCE_CHORD_INTERVALS][0]).toBe(0);
    }
  });
});
