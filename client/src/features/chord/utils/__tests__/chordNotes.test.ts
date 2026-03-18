import { describe, it, expect } from "vitest";
import { getChordNoteIndices } from "../transpose";
import type { ChordType } from "@/features/chord/types";

const ALL_8_CHORD_TYPES: ChordType[] = [
  "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7",
];

describe("getChordNoteIndices", () => {
  it("returns [0, 4, 7] for C major (root=0, quality='major')", () => {
    expect(getChordNoteIndices(0, "major")).toEqual([0, 4, 7]);
  });

  it("returns [0, 3, 7] for C minor (root=0, quality='minor')", () => {
    expect(getChordNoteIndices(0, "minor")).toEqual([0, 3, 7]);
  });

  it("returns [0, 3, 6] for C diminished (root=0, quality='dim')", () => {
    expect(getChordNoteIndices(0, "dim")).toEqual([0, 3, 6]);
  });

  it("returns [0, 4, 8] for C augmented (root=0, quality='aug')", () => {
    expect(getChordNoteIndices(0, "aug")).toEqual([0, 4, 8]);
  });

  it("returns [0, 4, 7, 11] for C maj7 (root=0, quality='maj7')", () => {
    expect(getChordNoteIndices(0, "maj7")).toEqual([0, 4, 7, 11]);
  });

  it("returns [0, 3, 7, 10] for C min7 (root=0, quality='min7')", () => {
    expect(getChordNoteIndices(0, "min7")).toEqual([0, 3, 7, 10]);
  });

  it("returns [0, 4, 7, 10] for C dom7 (root=0, quality='dom7')", () => {
    expect(getChordNoteIndices(0, "dom7")).toEqual([0, 4, 7, 10]);
  });

  it("returns [0, 3, 6, 10] for C half-dim7 (root=0, quality='halfdim7')", () => {
    expect(getChordNoteIndices(0, "halfdim7")).toEqual([0, 3, 6, 10]);
  });

  it("transposes correctly: G major (root=7) → [7, 11, 2]", () => {
    expect(getChordNoteIndices(7, "major")).toEqual([7, 11, 2]);
  });

  it("transposes correctly: D minor (root=2) → [2, 5, 9]", () => {
    expect(getChordNoteIndices(2, "minor")).toEqual([2, 5, 9]);
  });

  it("wraps indices at the octave boundary: B major (root=11) → [11, 3, 6]", () => {
    expect(getChordNoteIndices(11, "major")).toEqual([11, 3, 6]);
  });

  it("all indices are in the range 0–11 for all 12 roots and all 8 core types", () => {
    for (let root = 0; root < 12; root++) {
      for (const type of ALL_8_CHORD_TYPES) {
        const indices = getChordNoteIndices(root, type);
        for (const idx of indices) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(11);
        }
      }
    }
  });

  it("returns 3 notes for all triad types at root=0", () => {
    const triadTypes: ChordType[] = ["major", "minor", "dim", "aug"];
    for (const type of triadTypes) {
      expect(getChordNoteIndices(0, type)).toHaveLength(3);
    }
  });

  it("returns 4 notes for all seventh types at root=0", () => {
    const seventhTypes: ChordType[] = ["maj7", "min7", "dom7", "halfdim7"];
    for (const type of seventhTypes) {
      expect(getChordNoteIndices(0, type)).toHaveLength(4);
    }
  });
});
