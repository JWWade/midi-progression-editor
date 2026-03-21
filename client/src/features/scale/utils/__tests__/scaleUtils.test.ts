import { describe, it, expect } from "vitest";
import { getScaleNotes, getDiatonicIndices } from "../scaleUtils";
import { SCALE_INTERVALS } from "@/features/scale/types/scales";
import type { ScaleType } from "@/features/scale/types/scales";

const ALL_SCALE_TYPES = Object.keys(SCALE_INTERVALS) as ScaleType[];

// ── getScaleNotes ────────────────────────────────────────────────────────────

describe("getScaleNotes", () => {
  it("returns C major scale from root 0: [0,2,4,5,7,9,11]", () => {
    expect(getScaleNotes(0, "major")).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it("returns C natural minor scale from root 0: [0,2,3,5,7,8,10]", () => {
    expect(getScaleNotes(0, "naturalMinor")).toEqual([0, 2, 3, 5, 7, 8, 10]);
  });

  it("returns C harmonic minor scale from root 0: [0,2,3,5,7,8,11]", () => {
    expect(getScaleNotes(0, "harmonicMinor")).toEqual([0, 2, 3, 5, 7, 8, 11]);
  });

  it("returns C melodic minor scale from root 0: [0,2,3,5,7,9,11]", () => {
    expect(getScaleNotes(0, "melodicMinor")).toEqual([0, 2, 3, 5, 7, 9, 11]);
  });

  it("returns C dorian scale from root 0: [0,2,3,5,7,9,10]", () => {
    expect(getScaleNotes(0, "dorian")).toEqual([0, 2, 3, 5, 7, 9, 10]);
  });

  it("returns C phrygian scale from root 0: [0,1,3,5,7,8,10]", () => {
    expect(getScaleNotes(0, "phrygian")).toEqual([0, 1, 3, 5, 7, 8, 10]);
  });

  it("returns C lydian scale from root 0: [0,2,4,6,7,9,11]", () => {
    expect(getScaleNotes(0, "lydian")).toEqual([0, 2, 4, 6, 7, 9, 11]);
  });

  it("returns C mixolydian scale from root 0: [0,2,4,5,7,9,10]", () => {
    expect(getScaleNotes(0, "mixolydian")).toEqual([0, 2, 4, 5, 7, 9, 10]);
  });

  it("transposes correctly: G major (root=7) starts on G", () => {
    const notes = getScaleNotes(7, "major");
    expect(notes[0]).toBe(7);
  });

  it("wraps all notes into 0–11 range for any root", () => {
    for (const scaleType of ALL_SCALE_TYPES) {
      for (let root = 0; root < 12; root++) {
        const notes = getScaleNotes(root, scaleType);
        for (const note of notes) {
          expect(note).toBeGreaterThanOrEqual(0);
          expect(note).toBeLessThanOrEqual(11);
        }
      }
    }
  });

  it("always returns 7 distinct notes for all scale types at all roots", () => {
    for (const scaleType of ALL_SCALE_TYPES) {
      for (let root = 0; root < 12; root++) {
        const notes = getScaleNotes(root, scaleType);
        expect(notes).toHaveLength(7);
        expect(new Set(notes).size).toBe(7);
      }
    }
  });

  it("always includes the root note in the returned set", () => {
    for (const scaleType of ALL_SCALE_TYPES) {
      for (let root = 0; root < 12; root++) {
        const notes = getScaleNotes(root, scaleType);
        expect(notes).toContain(root);
      }
    }
  });

  it("F major (root=5) contains F, G, A, Bb, C, D, E = [5,7,9,10,0,2,4]", () => {
    expect(getScaleNotes(5, "major")).toEqual([5, 7, 9, 10, 0, 2, 4]);
  });

  it("A natural minor (root=9) contains [9,11,0,2,4,5,7]", () => {
    expect(getScaleNotes(9, "naturalMinor")).toEqual([9, 11, 0, 2, 4, 5, 7]);
  });
});

// ── getDiatonicIndices ───────────────────────────────────────────────────────

describe("getDiatonicIndices", () => {
  it("returns a Set (not an array)", () => {
    expect(getDiatonicIndices(0, "major")).toBeInstanceOf(Set);
  });

  it("Set contains the same elements as getScaleNotes", () => {
    for (const scaleType of ALL_SCALE_TYPES) {
      for (let root = 0; root < 12; root++) {
        const noteArray = getScaleNotes(root, scaleType);
        const noteSet = getDiatonicIndices(root, scaleType);
        expect(noteSet.size).toBe(noteArray.length);
        for (const note of noteArray) {
          expect(noteSet.has(note)).toBe(true);
        }
      }
    }
  });

  it("C major Set contains all expected pitch classes", () => {
    const set = getDiatonicIndices(0, "major");
    for (const pc of [0, 2, 4, 5, 7, 9, 11]) {
      expect(set.has(pc)).toBe(true);
    }
  });
});
