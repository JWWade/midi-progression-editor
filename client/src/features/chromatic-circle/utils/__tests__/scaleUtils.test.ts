import { describe, it, expect } from "vitest";
import { getDiatonicIndices, DIATONIC_OPACITY, CHROMATIC_OPACITY } from "../scaleUtils";

describe("DIATONIC_OPACITY and CHROMATIC_OPACITY constants", () => {
  it("DIATONIC_OPACITY is 1", () => {
    expect(DIATONIC_OPACITY).toBe(1);
  });

  it("CHROMATIC_OPACITY is 0.3", () => {
    expect(CHROMATIC_OPACITY).toBe(0.3);
  });
});

describe("getDiatonicIndices", () => {
  it("returns the 7 diatonic notes for C major (root 0)", () => {
    // C major: C D E F G A B → 0 2 4 5 7 9 11
    const indices = getDiatonicIndices(0, "major");
    expect(indices).toBeInstanceOf(Set);
    expect(indices.size).toBe(7);
    expect(indices).toEqual(new Set([0, 2, 4, 5, 7, 9, 11]));
  });

  it("returns the 7 diatonic notes for G major (root 7)", () => {
    // G major: G A B C D E F# → 7 9 11 0 2 4 6
    const indices = getDiatonicIndices(7, "major");
    expect(indices.size).toBe(7);
    expect(indices).toEqual(new Set([7, 9, 11, 0, 2, 4, 6]));
  });

  it("returns the 7 diatonic notes for C natural minor (root 0)", () => {
    // C natural minor: C D Eb F G Ab Bb → 0 2 3 5 7 8 10
    const indices = getDiatonicIndices(0, "naturalMinor");
    expect(indices.size).toBe(7);
    expect(indices).toEqual(new Set([0, 2, 3, 5, 7, 8, 10]));
  });

  it("returns the 7 diatonic notes for C harmonic minor (root 0)", () => {
    // C harmonic minor: C D Eb F G Ab B → 0 2 3 5 7 8 11
    const indices = getDiatonicIndices(0, "harmonicMinor");
    expect(indices.size).toBe(7);
    expect(indices).toEqual(new Set([0, 2, 3, 5, 7, 8, 11]));
  });

  it("returns the 7 diatonic notes for C dorian (root 0)", () => {
    // C dorian: C D Eb F G A Bb → 0 2 3 5 7 9 10
    const indices = getDiatonicIndices(0, "dorian");
    expect(indices.size).toBe(7);
    expect(indices).toEqual(new Set([0, 2, 3, 5, 7, 9, 10]));
  });

  it("wraps correctly for all 12 roots in major scale", () => {
    for (let root = 0; root < 12; root++) {
      const indices = getDiatonicIndices(root, "major");
      expect(indices.size).toBe(7);
      // All values should be in range 0–11
      for (const idx of indices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(11);
      }
    }
  });

  it("always includes the root note in the returned set", () => {
    const modes = ["major", "naturalMinor", "harmonicMinor", "dorian", "phrygian", "lydian", "mixolydian"] as const;
    for (let root = 0; root < 12; root++) {
      for (const mode of modes) {
        const indices = getDiatonicIndices(root, mode);
        expect(indices.has(root)).toBe(true);
      }
    }
  });

  it("returns a Set (not an array)", () => {
    const result = getDiatonicIndices(0, "major");
    expect(result).toBeInstanceOf(Set);
  });
});
