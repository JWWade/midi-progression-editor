import { describe, it, expect } from "vitest";
import { generateChords, containsTritoneMotion } from "../buildChordGraph";

// ---------------------------------------------------------------------------
// generateChords
// ---------------------------------------------------------------------------

describe("generateChords — size 3 (triads)", () => {
  it("generates C(12,3) = 220 sorted triad combinations", () => {
    const result = generateChords({ sizes: [3] });
    expect(result).toHaveLength(220);
  });

  it("every chord is a sorted ascending array of length 3", () => {
    for (const chord of generateChords({ sizes: [3] })) {
      expect(chord).toHaveLength(3);
      for (let i = 1; i < chord.length; i++) {
        expect(chord[i]).toBeGreaterThan(chord[i - 1]);
      }
    }
  });

  it("all pitch classes are in [0, 11]", () => {
    for (const chord of generateChords({ sizes: [3] })) {
      for (const pc of chord) {
        expect(pc).toBeGreaterThanOrEqual(0);
        expect(pc).toBeLessThanOrEqual(11);
      }
    }
  });

  it("no duplicate chord entries", () => {
    const result = generateChords({ sizes: [3] });
    const keys = result.map((c) => c.join(","));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("generateChords — size 4 (seventh chords)", () => {
  it("generates C(12,4) = 495 sorted four-note combinations", () => {
    const result = generateChords({ sizes: [4] });
    expect(result).toHaveLength(495);
  });

  it("every chord is a sorted ascending array of length 4", () => {
    for (const chord of generateChords({ sizes: [4] })) {
      expect(chord).toHaveLength(4);
      for (let i = 1; i < chord.length; i++) {
        expect(chord[i]).toBeGreaterThan(chord[i - 1]);
      }
    }
  });

  it("no duplicate chord entries", () => {
    const result = generateChords({ sizes: [4] });
    const keys = result.map((c) => c.join(","));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("generateChords — multi-size", () => {
  it("produces 220 + 495 = 715 entries for sizes [3, 4]", () => {
    const result = generateChords({ sizes: [3, 4] });
    expect(result).toHaveLength(715);
  });

  it("produces 220 entries for sizes [3] in isolation and combined", () => {
    const triadsOnly = generateChords({ sizes: [3] });
    const triadsInCombined = generateChords({ sizes: [3, 4] }).filter(
      (c) => c.length === 3,
    );
    expect(triadsInCombined).toHaveLength(triadsOnly.length);
  });

  it("empty sizes array produces no chords", () => {
    const result = generateChords({ sizes: [] });
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// containsTritoneMotion
// ---------------------------------------------------------------------------

describe("containsTritoneMotion", () => {
  it("returns true when a note in 'a' is a tritone away from a note in 'b'", () => {
    // [0] vs [6]: distance 6
    expect(containsTritoneMotion([0, 4, 7], [6, 9, 1])).toBe(true);
  });

  it("returns false when no tritone (distance 6) relationship exists", () => {
    // C major [0,4,7] vs A minor [0,3,7]: no tritone pairs
    expect(containsTritoneMotion([0, 4, 7], [0, 3, 7])).toBe(false);
  });

  it("detects tritone between any pair of notes (not just aligned voices)", () => {
    // 0 and 6 are a tritone apart; only b has 6
    expect(containsTritoneMotion([0, 3, 7], [2, 6, 9])).toBe(true);
  });

  it("returns false for two identical chords with no tritone intervals", () => {
    expect(containsTritoneMotion([0, 4, 7], [0, 4, 7])).toBe(false);
  });

  it("returns true for a chord that contains an internal tritone", () => {
    // [0, 6] — tritone dyad against itself
    expect(containsTritoneMotion([0, 6], [0, 6])).toBe(true);
  });

  it("works with four-note chords", () => {
    // Dominant 7th [0,4,7,10] contains tritone between 4 and 10
    expect(containsTritoneMotion([0, 4, 7, 10], [0, 4, 7, 10])).toBe(true);
  });

  it("returns false for empty arrays", () => {
    expect(containsTritoneMotion([], [])).toBe(false);
  });
});
