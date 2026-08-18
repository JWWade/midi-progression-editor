import { describe, expect, it } from "vitest";
import { getDiatonicIndices } from "@/features/scale/utils/scaleUtils";
import { getChordName } from "@/features/chord/data/chordNames";
import {
  selectRandomDiatonicStartupChord,
  WESTERN_CHORD_TYPES,
} from "../selectRandomDiatonicStartupChord";

function expectedScaleForQuality(quality: string): string {
  switch (quality) {
    case "major":
    case "maj7":
    case "maj6":
    case "sus2":
    case "aug":
      return "major";
    case "dom7":
    case "dom7sus4":
      return "mixolydian";
    case "minor":
    case "min7":
    case "min6":
      return "naturalMinor";
    case "minmaj7":
      return "melodicMinor";
    case "dim":
    case "halfdim7":
      return "phrygian";
    default:
      return "major";
  }
}

function fromSequence(values: number[]): () => number {
  let i = 0;
  return () => {
    const value = values[i] ?? 0;
    i += 1;
    return value;
  };
}

describe("selectRandomDiatonicStartupChord", () => {
  it("returns a chord root that is diatonic to the selected key and scale", () => {
    const selection = selectRandomDiatonicStartupChord();
    const diatonic = getDiatonicIndices(selection.keyRoot, selection.keyScale);
    expect(diatonic.has(selection.chord.root)).toBe(true);
  });

  it("sets key root to the startup chord root", () => {
    const selection = selectRandomDiatonicStartupChord();
    expect(selection.keyRoot).toBe(selection.chord.root);
  });

  it("returns only western-style chord qualities (quartal excluded)", () => {
    const selection = selectRandomDiatonicStartupChord();
    expect(WESTERN_CHORD_TYPES).toContain(selection.chord.quality);
    expect(selection.chord.quality).not.toBe("quartal");
  });

  it("builds chordName from the selected chord payload", () => {
    const selection = selectRandomDiatonicStartupChord();
    expect(selection.chordName).toBe(
      getChordName(selection.chord.root, selection.chord.quality),
    );
  });

  it("keeps key context aligned to the startup chord for multiple rng seeds", () => {
    // Verify the key root mirrors the selected chord root and mode selection
    // remains diatonic for that chord root.
    for (let seed = 0; seed < 12; seed += 1) {
      const rng = fromSequence([seed / 12, 0]);
      const selection = selectRandomDiatonicStartupChord(rng);
      const diatonic = getDiatonicIndices(selection.keyRoot, selection.keyScale);

      expect(selection.keyRoot).toBe(selection.chord.root);
      expect(diatonic.has(selection.chord.root)).toBe(true);
    }
  });

  it("maps startup key mode from chord quality", () => {
    for (const quality of WESTERN_CHORD_TYPES) {
      const qualityIndex = WESTERN_CHORD_TYPES.indexOf(quality);
      const selection = selectRandomDiatonicStartupChord(
        fromSequence([0, qualityIndex / WESTERN_CHORD_TYPES.length]),
      );

      expect(selection.keyScale).toBe(expectedScaleForQuality(quality));
    }
  });
});
