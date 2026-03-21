import { describe, it, expect } from "vitest";
import { isCustomChord, getChordNotes } from "../chordTypeGuards";
import type { Chord } from "@/features/current-chord/types";

// ── isCustomChord ────────────────────────────────────────────────────────────

describe("isCustomChord", () => {
  it("returns false for a standard named chord (no customNotes)", () => {
    const chord: Chord = { root: 0, quality: "major" };
    expect(isCustomChord(chord)).toBe(false);
  });

  it("returns true when customNotes is an array", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [0, 4, 7] };
    expect(isCustomChord(chord)).toBe(true);
  });

  it("returns true when customNotes is an empty array", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [] };
    expect(isCustomChord(chord)).toBe(true);
  });

  it("returns false when customNotes is undefined", () => {
    const chord: Chord = { root: 5, quality: "min7", customNotes: undefined };
    expect(isCustomChord(chord)).toBe(false);
  });

  it("returns true for a custom chord with various note sets", () => {
    const chord: Chord = { root: 3, quality: "dim", customNotes: [3, 5, 9, 11] };
    expect(isCustomChord(chord)).toBe(true);
  });

  it("works for all standard chord qualities without customNotes", () => {
    const qualities = [
      "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7",
    ] as const;
    for (const quality of qualities) {
      expect(isCustomChord({ root: 0, quality })).toBe(false);
    }
  });
});

// ── getChordNotes ────────────────────────────────────────────────────────────

describe("getChordNotes", () => {
  it("returns [0, 4, 7] for C major (root=0, quality='major')", () => {
    const chord: Chord = { root: 0, quality: "major" };
    expect(getChordNotes(chord)).toEqual([0, 4, 7]);
  });

  it("returns [0, 3, 7] for C minor (root=0, quality='minor')", () => {
    const chord: Chord = { root: 0, quality: "minor" };
    expect(getChordNotes(chord)).toEqual([0, 3, 7]);
  });

  it("returns customNotes directly for a custom chord", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [0, 3, 5, 9] };
    expect(getChordNotes(chord)).toEqual([0, 3, 5, 9]);
  });

  it("returns an empty array when customNotes is empty", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [] };
    expect(getChordNotes(chord)).toEqual([]);
  });

  it("ignores root/quality when customNotes is present", () => {
    // Chord says C major but customNotes are completely different
    const chord: Chord = { root: 0, quality: "major", customNotes: [1, 6, 10] };
    expect(getChordNotes(chord)).toEqual([1, 6, 10]);
  });

  it("returns 4 notes for all seventh chord types", () => {
    const seventhTypes = ["maj7", "min7", "dom7", "halfdim7"] as const;
    for (const quality of seventhTypes) {
      const chord: Chord = { root: 0, quality };
      expect(getChordNotes(chord)).toHaveLength(4);
    }
  });

  it("returns 3 notes for all triad types", () => {
    const triadTypes = ["major", "minor", "dim", "aug"] as const;
    for (const quality of triadTypes) {
      const chord: Chord = { root: 0, quality };
      expect(getChordNotes(chord)).toHaveLength(3);
    }
  });

  it("all returned note indices are in range 0–11 for named chords", () => {
    for (let root = 0; root < 12; root++) {
      const chord: Chord = { root, quality: "major" };
      for (const note of getChordNotes(chord)) {
        expect(note).toBeGreaterThanOrEqual(0);
        expect(note).toBeLessThanOrEqual(11);
      }
    }
  });
});
