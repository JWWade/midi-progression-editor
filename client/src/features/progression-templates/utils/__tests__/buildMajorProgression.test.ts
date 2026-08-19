import { describe, expect, it } from "vitest";
import {
  buildMajorOneFiveSixFour,
  buildMajorOneFourFive,
  buildMajorTwoFiveOne,
} from "../buildMajorProgression";

describe("buildMajorTwoFiveOne", () => {
  it("builds Dm -> G -> C triads for C major", () => {
    const result = buildMajorTwoFiveOne(0, "major");

    expect(result.supported).toBe(true);
    expect(result.chords).toEqual([
      { root: 2, quality: "minor" },
      { root: 7, quality: "major" },
      { root: 0, quality: "major" },
    ]);
  });

  it("builds mode-relative triads for C dorian", () => {
    const result = buildMajorTwoFiveOne(0, "dorian");

    expect(result.supported).toBe(true);
    expect(result.chords).toEqual([
      { root: 2, quality: "minor" },
      { root: 7, quality: "minor" },
      { root: 0, quality: "minor" },
    ]);
  });
});

describe("buildMajorOneFourFive", () => {
  it("builds C -> F -> G triads for C major", () => {
    const result = buildMajorOneFourFive(0, "major");

    expect(result.supported).toBe(true);
    expect(result.chords).toEqual([
      { root: 0, quality: "major" },
      { root: 5, quality: "major" },
      { root: 7, quality: "major" },
    ]);
  });

  it("builds mode-relative triads for C dorian", () => {
    const result = buildMajorOneFourFive(0, "dorian");

    expect(result.supported).toBe(true);
    expect(result.chords).toEqual([
      { root: 0, quality: "minor" },
      { root: 5, quality: "major" },
      { root: 7, quality: "minor" },
    ]);
  });
});

describe("buildMajorOneFiveSixFour", () => {
  it("builds C -> G -> Am -> F triads for C major", () => {
    const result = buildMajorOneFiveSixFour(0, "major");

    expect(result.supported).toBe(true);
    expect(result.chords).toEqual([
      { root: 0, quality: "major" },
      { root: 7, quality: "major" },
      { root: 9, quality: "minor" },
      { root: 5, quality: "major" },
    ]);
  });

  it("builds mode-relative triads for A natural minor", () => {
    const result = buildMajorOneFiveSixFour(9, "naturalMinor");

    expect(result.supported).toBe(true);
    expect(result.chords).toEqual([
      { root: 9, quality: "minor" },
      { root: 4, quality: "minor" },
      { root: 5, quality: "major" },
      { root: 2, quality: "minor" },
    ]);
  });
});
