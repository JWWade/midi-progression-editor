import { describe, it, expect } from "vitest";
import {
  rotateChordNotes,
  rotateNamedChordRoot,
  dedupePitchClasses,
  getPrimitiveNoteIndices,
  getChordTriad,
  getChordNoteIndices,
} from "../transpose";
import type { ChordType } from "@/features/chord/types";
import type { PrimitiveShape } from "@/features/current-chord/types";

// ── getChordNoteIndices ──────────────────────────────────────────────────────

describe("getChordNoteIndices", () => {
  it("returns [0, 4, 7] for C major", () => {
    expect(getChordNoteIndices(0, "major")).toEqual([0, 4, 7]);
  });

  it("returns [7, 11, 2] for G major (root=7)", () => {
    expect(getChordNoteIndices(7, "major")).toEqual([7, 11, 2]);
  });

  it("returns [0, 4, 7, 10] for C dom7", () => {
    expect(getChordNoteIndices(0, "dom7")).toEqual([0, 4, 7, 10]);
  });

  it("all indices are in range 0–11 for all chord types and all roots", () => {
    const types: ChordType[] = ["major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7"];
    for (let root = 0; root < 12; root++) {
      for (const type of types) {
        const indices = getChordNoteIndices(root, type);
        for (const idx of indices) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(11);
        }
      }
    }
  });
});

// ── rotateChordNotes ─────────────────────────────────────────────────────────

describe("rotateChordNotes", () => {
  it("rotates C major [0, 4, 7] up by 1 semitone to [1, 5, 8]", () => {
    expect(rotateChordNotes([0, 4, 7], 1)).toEqual([1, 5, 8]);
  });

  it("rotates by 12 semitones (full octave) returns original values", () => {
    expect(rotateChordNotes([0, 4, 7], 12)).toEqual([0, 4, 7]);
  });

  it("wraps values at the 0–11 boundary (C major + 5 semitones → F major)", () => {
    // [0, 4, 7] + 5 = [5, 9, 0]
    expect(rotateChordNotes([0, 4, 7], 5)).toEqual([5, 9, 0]);
  });

  it("handles negative rotation (down 2 semitones)", () => {
    // [4, 7, 11] - 2 = [2, 5, 9]
    expect(rotateChordNotes([4, 7, 11], -2)).toEqual([2, 5, 9]);
  });

  it("all result values are in range 0–11 for any semitone offset", () => {
    for (let semitones = -24; semitones <= 24; semitones++) {
      const result = rotateChordNotes([0, 4, 7], semitones);
      for (const note of result) {
        expect(note).toBeGreaterThanOrEqual(0);
        expect(note).toBeLessThanOrEqual(11);
      }
    }
  });

  it("returns an empty array for empty input", () => {
    expect(rotateChordNotes([], 5)).toEqual([]);
  });
});

// ── rotateNamedChordRoot ─────────────────────────────────────────────────────

describe("rotateNamedChordRoot", () => {
  it("rotates root C (0) up by 5 to F (5)", () => {
    expect(rotateNamedChordRoot(0, 5)).toBe(5);
  });

  it("wraps root B (11) up by 2 to D (1)", () => {
    expect(rotateNamedChordRoot(11, 2)).toBe(1);
  });

  it("returns the same root for rotation by 12", () => {
    for (let root = 0; root < 12; root++) {
      expect(rotateNamedChordRoot(root, 12)).toBe(root);
    }
  });

  it("handles negative rotation (down 2 semitones from D=2 → C=0)", () => {
    expect(rotateNamedChordRoot(2, -2)).toBe(0);
  });

  it("always returns a value in range 0–11 for any rotation", () => {
    for (let root = 0; root < 12; root++) {
      for (let semitones = -24; semitones <= 24; semitones++) {
        const result = rotateNamedChordRoot(root, semitones);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(11);
      }
    }
  });
});

// ── dedupePitchClasses ───────────────────────────────────────────────────────

describe("dedupePitchClasses", () => {
  it("removes duplicate pitch classes while preserving first-seen order", () => {
    expect(dedupePitchClasses([0, 4, 7, 0, 4])).toEqual([0, 4, 7]);
  });

  it("returns the same array when there are no duplicates", () => {
    expect(dedupePitchClasses([0, 4, 7])).toEqual([0, 4, 7]);
  });

  it("returns an empty array for empty input", () => {
    expect(dedupePitchClasses([])).toEqual([]);
  });

  it("preserves insertion order (first occurrence wins)", () => {
    // [7, 0, 4, 0, 7] → first-seen order: 7, 0, 4
    expect(dedupePitchClasses([7, 0, 4, 0, 7])).toEqual([7, 0, 4]);
  });

  it("handles a fully redundant array (all same note)", () => {
    expect(dedupePitchClasses([5, 5, 5, 5])).toEqual([5]);
  });
});

// ── getPrimitiveNoteIndices ──────────────────────────────────────────────────

describe("getPrimitiveNoteIndices", () => {
  const shapes: PrimitiveShape[] = [
    "equilateral-triangle",
    "suspended-triangle",
    "rectangle",
    "square",
  ];

  it("returns [0, 4, 8] for equilateral-triangle at root 0 (augmented triad)", () => {
    expect(getPrimitiveNoteIndices(0, "equilateral-triangle")).toEqual([0, 4, 8]);
  });

  it("returns [0, 5, 7] for suspended-triangle at root 0 (quartal sus)", () => {
    expect(getPrimitiveNoteIndices(0, "suspended-triangle")).toEqual([0, 5, 7]);
  });

  it("returns [0, 4, 6, 10] for rectangle at root 0", () => {
    expect(getPrimitiveNoteIndices(0, "rectangle")).toEqual([0, 4, 6, 10]);
  });

  it("returns [0, 3, 6, 9] for square at root 0 (fully diminished)", () => {
    expect(getPrimitiveNoteIndices(0, "square")).toEqual([0, 3, 6, 9]);
  });

  it("always includes the root note in the result", () => {
    for (let root = 0; root < 12; root++) {
      for (const shape of shapes) {
        const notes = getPrimitiveNoteIndices(root, shape);
        expect(notes[0]).toBe(root % 12);
      }
    }
  });

  it("all indices are in range 0–11 for all shapes and all roots", () => {
    for (let root = 0; root < 12; root++) {
      for (const shape of shapes) {
        const notes = getPrimitiveNoteIndices(root, shape);
        for (const note of notes) {
          expect(note).toBeGreaterThanOrEqual(0);
          expect(note).toBeLessThanOrEqual(11);
        }
      }
    }
  });

  it("equilateral-triangle wraps correctly for root B (11): [11, 3, 7]", () => {
    // [11, 11+4=15%12=3, 11+8=19%12=7]
    expect(getPrimitiveNoteIndices(11, "equilateral-triangle")).toEqual([11, 3, 7]);
  });
});

// ── getChordTriad ────────────────────────────────────────────────────────────

describe("getChordTriad", () => {
  it("returns [0, 4, 7] for maj7 (major triad base)", () => {
    expect(Array.from(getChordTriad("maj7")!)).toEqual([0, 4, 7]);
  });

  it("returns [0, 3, 7] for min7 (minor triad base)", () => {
    expect(Array.from(getChordTriad("min7")!)).toEqual([0, 3, 7]);
  });

  it("returns [0, 4, 7] for dom7 (major triad base)", () => {
    expect(Array.from(getChordTriad("dom7")!)).toEqual([0, 4, 7]);
  });

  it("returns [0, 3, 6] for halfdim7 (diminished triad base)", () => {
    expect(Array.from(getChordTriad("halfdim7")!)).toEqual([0, 3, 6]);
  });

  it("returns undefined for non-seventh chord types (major, minor, dim, aug)", () => {
    expect(getChordTriad("major")).toBeUndefined();
    expect(getChordTriad("minor")).toBeUndefined();
    expect(getChordTriad("dim")).toBeUndefined();
    expect(getChordTriad("aug")).toBeUndefined();
  });
});
