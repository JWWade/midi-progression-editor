import { describe, it, expect } from "vitest";
import { samplePolarMelody } from "./samplePolarMelody";
import { getScaleNotes } from "@/features/scale/utils";

const C_MAJOR = new Set([0, 2, 4, 5, 7, 9, 11]);

describe("samplePolarMelody", () => {
  it("A=1, B=1, k=4, N=16, C major: all 16 pitch classes are in C major", () => {
    const result = samplePolarMelody({ A: 1, B: 1, k: 4, N: 16, keyRoot: 0, keyScale: "major" });
    expect(result).toHaveLength(16);
    for (const pc of result) {
      expect(C_MAJOR.has(pc)).toBe(true);
    }
  });

  it("B=0 (flat circle): returns array of length N, all the same note, no divide-by-zero", () => {
    const result = samplePolarMelody({ A: 1, B: 0, k: 4, N: 16, keyRoot: 0, keyScale: "major" });
    expect(result).toHaveLength(16);
    const first = result[0];
    for (const pc of result) {
      expect(pc).toBe(first);
    }
  });

  it("N=4, A=1, B=1, k=1: output length is 4", () => {
    const result = samplePolarMelody({ A: 1, B: 1, k: 1, N: 4, keyRoot: 0, keyScale: "major" });
    expect(result).toHaveLength(4);
  });

  it("k=1, N=8, C major: all output values are in C major", () => {
    const result = samplePolarMelody({ A: 1, B: 1, k: 1, N: 8, keyRoot: 0, keyScale: "major" });
    expect(result).toHaveLength(8);
    for (const pc of result) {
      expect(C_MAJOR.has(pc)).toBe(true);
    }
  });

  it("D major (keyRoot=2): all output values are in D major", () => {
    const dMajorNotes = new Set(getScaleNotes(2, "major"));
    const result = samplePolarMelody({ A: 1, B: 1, k: 4, N: 16, keyRoot: 2, keyScale: "major" });
    expect(result).toHaveLength(16);
    for (const pc of result) {
      expect(dMajorNotes.has(pc)).toBe(true);
    }
  });

  it("N=32: returns exactly 32 pitch classes", () => {
    const result = samplePolarMelody({ A: 1, B: 1, k: 4, N: 32, keyRoot: 0, keyScale: "major" });
    expect(result).toHaveLength(32);
  });

  it("all output values are valid pitch classes (0–11)", () => {
    const result = samplePolarMelody({ A: 2, B: 1.5, k: 6, N: 16, keyRoot: 5, keyScale: "naturalMinor" });
    for (const pc of result) {
      expect(pc).toBeGreaterThanOrEqual(0);
      expect(pc).toBeLessThanOrEqual(11);
    }
  });
});
