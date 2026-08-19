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

  it("returns unsupported for non-major modes", () => {
    const result = buildMajorTwoFiveOne(0, "dorian");

    expect(result.supported).toBe(false);
    expect(result.chords).toEqual([]);
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

  it("returns unsupported for non-major modes", () => {
    const result = buildMajorOneFourFive(0, "dorian");

    expect(result.supported).toBe(false);
    expect(result.chords).toEqual([]);
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

  it("returns unsupported for non-major modes", () => {
    const result = buildMajorOneFiveSixFour(0, "dorian");

    expect(result.supported).toBe(false);
    expect(result.chords).toEqual([]);
  });
});
