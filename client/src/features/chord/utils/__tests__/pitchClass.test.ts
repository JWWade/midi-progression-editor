import { describe, expect, it } from "vitest";
import {
  dedupeNormalizedPitchClasses,
  normalizePitchClass,
  normalizePitchClasses,
  uniqueSortedPitchClasses,
} from "../pitchClass";

describe("normalizePitchClass", () => {
  it("keeps in-range values unchanged", () => {
    expect(normalizePitchClass(0)).toBe(0);
    expect(normalizePitchClass(7)).toBe(7);
    expect(normalizePitchClass(11)).toBe(11);
  });

  it("wraps out-of-range values", () => {
    expect(normalizePitchClass(12)).toBe(0);
    expect(normalizePitchClass(13)).toBe(1);
    expect(normalizePitchClass(25)).toBe(1);
  });

  it("wraps negative values", () => {
    expect(normalizePitchClass(-1)).toBe(11);
    expect(normalizePitchClass(-12)).toBe(0);
    expect(normalizePitchClass(-25)).toBe(11);
  });
});

describe("normalizePitchClasses", () => {
  it("normalizes each value in sequence", () => {
    expect(normalizePitchClasses([0, 12, -1, 25, -26])).toEqual([0, 0, 11, 1, 10]);
  });
});

describe("dedupeNormalizedPitchClasses", () => {
  it("deduplicates after normalization while preserving first-seen order", () => {
    expect(dedupeNormalizedPitchClasses([12, 0, -12, 7, 19, -5])).toEqual([0, 7]);
  });

  it("returns empty array for empty input", () => {
    expect(dedupeNormalizedPitchClasses([])).toEqual([]);
  });
});

describe("uniqueSortedPitchClasses", () => {
  it("returns sorted unique normalized pitch classes", () => {
    expect(uniqueSortedPitchClasses([10, -2, 0, 12, 25, -14, 10])).toEqual([0, 1, 10]);
  });
});
