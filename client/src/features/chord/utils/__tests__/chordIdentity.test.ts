import { describe, expect, it } from "vitest";
import { findBestChordIdentity, findBestQualityForRoot } from "../chordIdentity";

describe("findBestQualityForRoot", () => {
  it("returns exact major match for root C and notes [0,4,7]", () => {
    const result = findBestQualityForRoot([0, 4, 7], 0);
    expect(result.quality).toBe("major");
    expect(result.matchScore).toBeCloseTo(1, 5);
  });

  it("normalizes and deduplicates note indices before scoring", () => {
    const exact = findBestQualityForRoot([0, 4, 7], 0);
    const noisy = findBestQualityForRoot([12, 4, 16, -5, 7, 0, 12], 0);
    expect(noisy.quality).toBe(exact.quality);
    expect(noisy.matchScore).toBeCloseTo(exact.matchScore, 5);
  });

  it("supports cardinality-constrained quality pools", () => {
    const result = findBestQualityForRoot([0, 4, 7, 10], 0, ["major", "minor", "dom7"]);
    expect(result.quality).toBe("dom7");
    expect(result.matchScore).toBeCloseTo(1, 5);
  });
});

describe("findBestChordIdentity", () => {
  it("finds exact nearest chord identity", () => {
    const result = findBestChordIdentity([7, 11, 2]);
    expect(result.root).toBe(7);
    expect(result.quality).toBe("major");
    expect(result.matchScore).toBeCloseTo(1, 5);
  });

  it("identifies Dsus2 from pitch classes [2, 4, 9]", () => {
    const result = findBestChordIdentity([2, 4, 9]);
    expect(result.root).toBe(2);
    expect(result.quality).toBe("sus2");
    expect(result.matchScore).toBeCloseTo(1, 5);
  });

  it("returns a bounded score for empty input", () => {
    const result = findBestChordIdentity([]);
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(1);
  });
});
