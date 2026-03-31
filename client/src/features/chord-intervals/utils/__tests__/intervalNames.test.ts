import { describe, it, expect } from "vitest";
import {
  getIntervalName,
  getIntervals,
  getRootIntervals,
} from "../intervalNames";

// ── getIntervalName ──────────────────────────────────────────────────────────

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

  it("wraps 13 semitones to the same name as 1 semitone (m2)", () => {
    expect(getIntervalName(13)).toBe(getIntervalName(1));
  });

  it("wraps 24 semitones to the same name as 12 semitones (Octave)", () => {
    expect(getIntervalName(24)).toBe("Octave");
  });
});

// ── getIntervals ─────────────────────────────────────────────────────────────

describe("getIntervals", () => {
  it("returns [] for an empty note list", () => {
    expect(getIntervals([])).toEqual([]);
  });

  it("returns [12] for a single-note list (wrap-around is an octave)", () => {
    expect(getIntervals([0])).toEqual([12]);
  });

  it("returns correct intervals for C major triad [0, 4, 7]", () => {
    // 0→4: 4 semitones (M3), 4→7: 3 semitones (m3), 7→0 wrap: 5 semitones (P4)
    expect(getIntervals([0, 4, 7])).toEqual([4, 3, 5]);
  });

  it("returns correct intervals for C minor triad [0, 3, 7]", () => {
    // 0→3: m3, 3→7: M3, 7→0 wrap: P4
    expect(getIntervals([0, 3, 7])).toEqual([3, 4, 5]);
  });

  it("returns correct intervals for C dom7 [0, 4, 7, 10]", () => {
    // 0→4: M3(4), 4→7: m3(3), 7→10: m3(3), 10→0 wrap: M2(2)
    expect(getIntervals([0, 4, 7, 10])).toEqual([4, 3, 3, 2]);
  });

  it("intervals always sum to 12 for any valid chord", () => {
    const chords = [
      [0, 4, 7],    // major triad
      [0, 3, 7],    // minor triad
      [0, 3, 6],    // diminished
      [0, 4, 8],    // augmented
      [0, 4, 7, 11], // maj7
      [0, 3, 7, 10], // min7
      [0, 4, 7, 10], // dom7
      [0, 3, 6, 10], // halfdim7
    ];
    for (const chord of chords) {
      const intervals = getIntervals(chord);
      const sum = intervals.reduce((a, b) => a + b, 0);
      expect(sum).toBe(12);
    }
  });

  it("all intervals are in the range 1–12", () => {
    const notes = [0, 4, 7, 11];
    const intervals = getIntervals(notes);
    for (const interval of intervals) {
      expect(interval).toBeGreaterThanOrEqual(1);
      expect(interval).toBeLessThanOrEqual(12);
    }
  });

  it("returns one interval per note (including wrap-around)", () => {
    const notes = [0, 4, 7, 10];
    expect(getIntervals(notes)).toHaveLength(notes.length);
  });
});

// ── getRootIntervals ─────────────────────────────────────────────────────────

describe("getRootIntervals", () => {
  it("returns [] for empty input", () => {
    expect(getRootIntervals([])).toEqual([]);
  });

  it("returns [] for a single-note array (fewer than 2 notes)", () => {
    expect(getRootIntervals([0])).toEqual([]);
  });

  it("returns two entries for a 2-note array: root→second and root→second", () => {
    const result = getRootIntervals([0, 7]);
    expect(result).toHaveLength(2);
    // first element: root→next = 7 semitones
    expect(result[0]).toBe(7);
    // last element: root→last = 7 semitones
    expect(result[1]).toBe(7);
  });

  it("returns [4, null, 7] for C major triad [0, 4, 7]", () => {
    // root→third: M3 (4), middle edge: null, root→fifth: P5 (7)
    expect(getRootIntervals([0, 4, 7])).toEqual([4, null, 7]);
  });

  it("returns [3, null, 7] for C minor triad [0, 3, 7]", () => {
    expect(getRootIntervals([0, 3, 7])).toEqual([3, null, 7]);
  });

  it("returns [4, null, null, 10] for C dom7 [0, 4, 7, 10]", () => {
    // first edge (root→M3): 4, middle edges: null, null, last edge (root→m7): 10
    expect(getRootIntervals([0, 4, 7, 10])).toEqual([4, null, null, 10]);
  });

  it("has non-null values only at index 0 and last index", () => {
    const notes = [0, 4, 7, 11]; // Cmaj7
    const result = getRootIntervals(notes);
    expect(result[0]).not.toBeNull();
    expect(result[result.length - 1]).not.toBeNull();
    for (let i = 1; i < result.length - 1; i++) {
      expect(result[i]).toBeNull();
    }
  });

  it("non-null values are in the range 1–12", () => {
    const notes = [0, 3, 6, 10]; // halfdim7
    const result = getRootIntervals(notes);
    for (const val of result) {
      if (val !== null) {
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(12);
      }
    }
  });
});
