import { describe, it, expect } from "vitest";
import { getChordName } from "@/features/chord/data/chordNames";
import {
  formatChordSymbol,
  formatChordName,
  formatPrimitiveChordName,
  CHORD_QUALITY_LABELS,
  resolveChordIdentity,
} from "@/features/current-chord/utils/chordName";
import type { ChordType } from "@/features/chord/types";
import type { Chord } from "@/features/current-chord/types";

const ALL_8_CHORD_TYPES: ChordType[] = [
  "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7",
];

describe("getChordName", () => {
  it("returns 'C' for C major (root=0, type='major')", () => {
    expect(getChordName(0, "major")).toBe("C");
  });

  it("returns 'Cm' for C minor (root=0, type='minor')", () => {
    expect(getChordName(0, "minor")).toBe("Cm");
  });

  it("returns 'Cdim' for C diminished (root=0, type='dim')", () => {
    expect(getChordName(0, "dim")).toBe("Cdim");
  });

  it("returns 'Caug' for C augmented (root=0, type='aug')", () => {
    expect(getChordName(0, "aug")).toBe("Caug");
  });

  it("returns 'Cmaj7' for C maj7 (root=0, type='maj7')", () => {
    expect(getChordName(0, "maj7")).toBe("Cmaj7");
  });

  it("returns 'Cm7' for C min7 (root=0, type='min7')", () => {
    expect(getChordName(0, "min7")).toBe("Cm7");
  });

  it("returns 'C7' for C dominant 7 (root=0, type='dom7')", () => {
    expect(getChordName(0, "dom7")).toBe("C7");
  });

  it("returns 'Cø7' for C half-dim 7 (root=0, type='halfdim7')", () => {
    expect(getChordName(0, "halfdim7")).toBe("Cø7");
  });

  it("uses the root note name when transposed (G major → 'G')", () => {
    expect(getChordName(7, "major")).toBe("G");
  });

  it("uses sharp pitch class by default (C# = root 1)", () => {
    expect(getChordName(1, "major")).toBe("C#");
  });

  it("accepts a flat pitch-classes array and uses flat notation", () => {
    const flatPitchClasses = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    expect(getChordName(1, "major", flatPitchClasses)).toBe("Db");
    expect(getChordName(3, "minor", flatPitchClasses)).toBe("Ebm");
  });

  it("returns non-empty strings for all 8 core chord types at root=0", () => {
    for (const type of ALL_8_CHORD_TYPES) {
      const name = getChordName(0, type);
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

describe("CHORD_QUALITY_LABELS", () => {
  it("contains a label for every one of the 8 core chord types", () => {
    for (const type of ALL_8_CHORD_TYPES) {
      expect(CHORD_QUALITY_LABELS[type]).toBeDefined();
      expect(typeof CHORD_QUALITY_LABELS[type]).toBe("string");
    }
  });

  it("major label is 'Major'", () => {
    expect(CHORD_QUALITY_LABELS["major"]).toBe("Major");
  });

  it("halfdim7 label is 'Half-dim 7'", () => {
    expect(CHORD_QUALITY_LABELS["halfdim7"]).toBe("Half-dim 7");
  });
});

describe("formatChordName", () => {
  it("returns 'C Major' for C major chord", () => {
    const chord: Chord = { root: 0, quality: "major" };
    expect(formatChordName(chord)).toBe("C Major");
  });

  it("returns 'D Minor' for D minor chord (root=2)", () => {
    const chord: Chord = { root: 2, quality: "minor" };
    expect(formatChordName(chord)).toBe("D Minor");
  });

  it("appends extensions in parentheses when present", () => {
    const chord: Chord = { root: 0, quality: "dom7", extensions: ["9", "13"] };
    expect(formatChordName(chord)).toBe("C Dominant 7 (9, 13)");
  });

  it("omits extension notation when extensions is empty", () => {
    const chord: Chord = { root: 0, quality: "major", extensions: [] };
    expect(formatChordName(chord)).toBe("C Major");
  });

  it("accepts a flat pitch-classes array", () => {
    const flatPitchClasses = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    const chord: Chord = { root: 3, quality: "minor" };
    expect(formatChordName(chord, flatPitchClasses)).toBe("Eb Minor");
  });

  it("formats a rerooted custom E-G-C chord as E Minor", () => {
    const chord: Chord = { root: 4, quality: "major", customNotes: [4, 7, 0] };
    expect(formatChordName(chord)).toBe("E Minor");
  });
});

describe("resolveChordIdentity", () => {
  it("keeps named chord identity unchanged", () => {
    const chord: Chord = { root: 0, quality: "major" };
    expect(resolveChordIdentity(chord)).toEqual({ root: 0, quality: "major" });
  });

  it("anchors custom chord inference to the selected root", () => {
    const eMinorLike: Chord = { root: 4, quality: "major", customNotes: [4, 7, 0] };
    expect(resolveChordIdentity(eMinorLike)).toEqual({ root: 4, quality: "minor" });
  });

  it("resolves exact quartal chord as quartal", () => {
    // G-C-F = G quartal (exact intervals: 0, 5, 10)
    const gQuartal: Chord = { root: 7, quality: "major", customNotes: [7, 0, 5] };
    expect(resolveChordIdentity(gQuartal)).toEqual({ root: 7, quality: "quartal" });
  });

  it("does not label non-exact custom sets as quartal", () => {
    const ambiguousFourNoteSet: Chord = {
      root: 0,
      quality: "quartal",
      customNotes: [0, 10, 1, 5],
    };

    const resolved = resolveChordIdentity(ambiguousFourNoteSet);
    expect(resolved.root).toBe(0);
    expect(resolved.quality).not.toBe("quartal");
  });

  it("resolves noisy out-of-range custom notes to the same identity as normalized notes", () => {
    const normalized: Chord = { root: 0, quality: "major", customNotes: [0, 4, 7] };
    const noisy: Chord = { root: 0, quality: "major", customNotes: [12, -8, 4, 19, 7, 0] };

    expect(resolveChordIdentity(noisy)).toEqual(resolveChordIdentity(normalized));
  });
});

describe("formatChordSymbol", () => {
  it("formats named chords as compact symbols", () => {
    const chord: Chord = { root: 0, quality: "major" };
    expect(formatChordSymbol(chord)).toBe("C");
  });

  it("formats rerooted custom chords as compact inferred symbols", () => {
    const eMinorLike: Chord = { root: 4, quality: "major", customNotes: [4, 7, 0] };
    // G-C-F = G quartal (exact match)
    const gQuartal: Chord = { root: 7, quality: "major", customNotes: [7, 0, 5] };

    expect(formatChordSymbol(eMinorLike)).toBe("Em");
    expect(formatChordSymbol(gQuartal)).toBe("Gq");
  });
});

describe("formatPrimitiveChordName", () => {
  it("falls back to formatChordName when no primitiveShape is set", () => {
    const chord: Chord = { root: 0, quality: "major" };
    expect(formatPrimitiveChordName(chord)).toBe("C Major");
  });

  it("returns '<root> sus4' for suspended-triangle shape", () => {
    const chord: Chord = { root: 0, quality: "major", primitiveShape: "suspended-triangle" };
    expect(formatPrimitiveChordName(chord)).toBe("C sus4");
  });

  it("returns '<root> Diminished' for square shape", () => {
    const chord: Chord = { root: 7, quality: "dim", primitiveShape: "square" };
    expect(formatPrimitiveChordName(chord)).toBe("G Diminished");
  });

  it("returns '<root> Equilateral Triangle' for equilateral-triangle shape", () => {
    const chord: Chord = { root: 0, quality: "aug", primitiveShape: "equilateral-triangle" };
    expect(formatPrimitiveChordName(chord)).toBe("C Equilateral Triangle");
  });
});
