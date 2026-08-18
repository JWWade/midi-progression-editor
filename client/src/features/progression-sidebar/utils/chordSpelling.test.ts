import { describe, expect, it } from "vitest";
import type { Chord } from "@/features/current-chord/types";
import { buildChordSpellingMap } from "./chordSpelling";

const SHARP_PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

describe("buildChordSpellingMap", () => {
  it("returns an empty map for non-tertian custom note counts", () => {
    const emptyCustomChord: Chord = {
      root: 0,
      quality: "major",
      customNotes: [],
    };

    expect(buildChordSpellingMap(emptyCustomChord, SHARP_PITCH_CLASSES)).toEqual({});
  });

  it("spells diminished-seventh style tones with a flat seventh letter", () => {
    const squareLikeDiminished: Chord = {
      root: 2,
      quality: "dim",
      customNotes: [2, 5, 8, 11],
      primitiveShape: "square",
    };

    const spelling = buildChordSpellingMap(squareLikeDiminished, SHARP_PITCH_CLASSES);
    expect(spelling[2]).toBe("D");
    expect(spelling[5]).toBe("F");
    expect(spelling[8]).toBe("Ab");
    expect(spelling[11]).toBe("Cb");
  });

  it("spells dominant-seventh tones as root-3-5-7 letters", () => {
    const dDominant7: Chord = {
      root: 2,
      quality: "dom7",
    };

    const spelling = buildChordSpellingMap(dDominant7, SHARP_PITCH_CLASSES);
    expect(spelling[2]).toBe("D");
    expect(spelling[6]).toBe("F#");
    expect(spelling[9]).toBe("A");
    expect(spelling[0]).toBe("C");
  });
});
