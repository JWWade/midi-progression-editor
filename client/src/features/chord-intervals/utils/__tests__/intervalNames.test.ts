import { describe, it, expect } from "vitest";
import { getIntervalName, getIntervals, getRootIntervals } from "../intervalNames";

// ── getIntervalName ─────────────────────────────────────────────────────────

describe("getIntervalName", () => {
  it("returns 'm2' for 1 semitone", () => {
    expect(getIntervalName(1)).toBe("m2");
  });

  it("returns 'M2' for 2 semitones", () => {
    expect(getIntervalName(2)).toBe("M2");
  });

  it("returns 'm3' for 3 semitones", () => {
    expect(getIntervalName(3)).toBe("m3");
  });

  it("returns 'M3' for 4 semitones", () => {
    expect(getIntervalName(4)).toBe("M3");
  });

  it("returns 'P4' for 5 semitones", () => {
    expect(getIntervalName(5)).toBe("P4");
  });

  it("returns 'A4/d5' for 6 semitones (tritone)", () => {
    expect(getIntervalName(6)).toBe("A4/d5");
  });

  it("returns 'P5' for 7 semitones", () => {
    expect(getIntervalName(7)).toBe("P5");
  });

  it("returns 'm6' for 8 semitones", () => {
    expect(getIntervalName(8)).toBe("m6");
  });

  it("returns 'M6' for 9 semitones", () => {
    expect(getIntervalName(9)).toBe("M6");
  });

  it("returns 'm7' for 10 semitones", () => {
    expect(getIntervalName(10)).toBe("m7");
  });

  it("returns 'M7' for 11 semitones", () => {
    expect(getIntervalName(11)).toBe("M7");
  });

  it("returns 'Octave' for 12 semitones", () => {
    expect(getIntervalName(12)).toBe("Octave");
  });

  it("wraps 13 semitones to 'm2' (same as 1)", () => {
    expect(getIntervalName(13)).toBe("m2");
  });

  it("wraps 24 semitones to 'Octave' (same as 12)", () => {
    expect(getIntervalName(24)).toBe("Octave");
  });
});

// ── getIntervals ────────────────────────────────────────────────────────────

describe("getIntervals", () => {
  it("returns intervals for C major triad [0, 4, 7]: M3, m3, P5 wrap-around", () => {
    // 0→4 = 4 (M3), 4→7 = 3 (m3), 7→0 = 5 (P4 wrap)
    expect(getIntervals([0, 4, 7])).toEqual([4, 3, 5]);
  });

  it("returns intervals for C minor triad [0, 3, 7]: m3, M3, P5 wrap-around", () => {
    // 0→3 = 3, 3→7 = 4, 7→0 = 5
    expect(getIntervals([0, 3, 7])).toEqual([3, 4, 5]);
  });

  it("returns intervals for C diminished triad [0, 3, 6]: m3, m3, tritone wrap", () => {
    // 0→3 = 3, 3→6 = 3, 6→0 = 6
    expect(getIntervals([0, 3, 6])).toEqual([3, 3, 6]);
  });

  it("returns intervals for C augmented triad [0, 4, 8]: M3, M3, M3 wrap", () => {
    // 0→4 = 4, 4→8 = 4, 8→0 = 4
    expect(getIntervals([0, 4, 8])).toEqual([4, 4, 4]);
  });

  it("returns intervals for C maj7 [0, 4, 7, 11]", () => {
    // 0→4=4, 4→7=3, 7→11=4, 11→0=1
    expect(getIntervals([0, 4, 7, 11])).toEqual([4, 3, 4, 1]);
  });

  it("returns an empty array for empty input", () => {
    expect(getIntervals([])).toEqual([]);
  });

  it("returns 12 (Octave) for a single note (wraps to itself)", () => {
    // 0→0 = 0 which is treated as 12
    expect(getIntervals([0])).toEqual([12]);
  });

  it("all intervals are in range 1–12", () => {
    const chords = [
      [0, 4, 7],
      [0, 3, 7],
      [0, 3, 6],
      [0, 4, 8],
      [0, 4, 7, 11],
      [0, 3, 7, 10],
      [7, 11, 2],
    ];
    for (const chord of chords) {
      const intervals = getIntervals(chord);
      for (const interval of intervals) {
        expect(interval).toBeGreaterThanOrEqual(1);
        expect(interval).toBeLessThanOrEqual(12);
      }
    }
  });
});

// ── getRootIntervals ────────────────────────────────────────────────────────

describe("getRootIntervals", () => {
  it("returns [M3, null, P5] for C major triad [0, 4, 7]", () => {
    // Edge 0 (root→third): root→4 = 4 semitones (M3)
    // Edge 1 (third→fifth): null (non-root pair)
    // Edge 2 (fifth→root): root→7 = 7 semitones (P5)
    expect(getRootIntervals([0, 4, 7])).toEqual([4, null, 7]);
  });

  it("returns [m3, null, P5] for C minor triad [0, 3, 7]", () => {
    expect(getRootIntervals([0, 3, 7])).toEqual([3, null, 7]);
  });

  it("returns [M3, null, null, m7] for C dom7 [0, 4, 7, 10]", () => {
    // Edge 0 (root→third): 4 (M3)
    // Edge 1 (third→fifth): null
    // Edge 2 (fifth→seventh): null
    // Edge 3 (seventh→root): root→10 = 10 (m7)
    expect(getRootIntervals([0, 4, 7, 10])).toEqual([4, null, null, 10]);
  });

  it("returns [] for fewer than 2 notes", () => {
    expect(getRootIntervals([])).toEqual([]);
    expect(getRootIntervals([0])).toEqual([]);
  });

  it("root interval is non-null only at index 0 and last index", () => {
    const result = getRootIntervals([0, 4, 7, 11]);
    expect(result[0]).not.toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeNull();
    expect(result[3]).not.toBeNull();
  });
});
