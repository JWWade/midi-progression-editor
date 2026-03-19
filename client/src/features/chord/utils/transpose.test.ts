import { describe, it, expect } from "vitest";
import { mirrorChordAboutRoot } from "./transpose";

describe("mirrorChordAboutRoot", () => {
  it("reflects C major [0,4,7] about root C(0) → [0,8,5]", () => {
    // C→C, E→Ab, G→F
    expect(mirrorChordAboutRoot([0, 4, 7], 0)).toEqual([0, 8, 5]);
  });

  it("reflects C minor [0,3,7] about root C(0) → [0,9,5]", () => {
    // C→C, Eb→A, G→F  (F major in 2nd inversion)
    expect(mirrorChordAboutRoot([0, 3, 7], 0)).toEqual([0, 9, 5]);
  });

  it("reflects G major [7,11,2] about root G(7) → [7,3,0]", () => {
    // G→G, B→Eb, D→C  (mirrors G major about G)
    expect(mirrorChordAboutRoot([7, 11, 2], 7)).toEqual([7, 3, 0]);
  });

  it("mirrors a dom7 chord [0,4,7,10] about root C(0) → [0,8,5,2]", () => {
    // C→C, E→Ab, G→F, Bb→D
    expect(mirrorChordAboutRoot([0, 4, 7, 10], 0)).toEqual([0, 8, 5, 2]);
  });

  it("root note always maps to itself", () => {
    const roots = [0, 3, 7, 11];
    for (const root of roots) {
      const result = mirrorChordAboutRoot([root], root);
      expect(result).toEqual([root]);
    }
  });

  it("applying mirror twice returns the original notes", () => {
    const notes = [0, 4, 7];
    const root = 0;
    expect(mirrorChordAboutRoot(mirrorChordAboutRoot(notes, root), root)).toEqual(notes);
  });

  it("all results are in the range 0–11", () => {
    const result = mirrorChordAboutRoot([0, 3, 6, 9], 0);
    for (const note of result) {
      expect(note).toBeGreaterThanOrEqual(0);
      expect(note).toBeLessThanOrEqual(11);
    }
  });

  it("handles notes at chromatic boundary (e.g., root 11)", () => {
    // B(11) major: [11, 3, 6] (B, D#, F#)
    // mirror about B(11): [11, (22-3)%12, (22-6)%12] = [11, 7, 4] (B, G, E)
    expect(mirrorChordAboutRoot([11, 3, 6], 11)).toEqual([11, 7, 4]);
  });
});
