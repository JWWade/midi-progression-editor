import { describe, expect, it } from "vitest";
import { getDiatonicIndices } from "@/features/scale/utils/scaleUtils";
import { getChordName } from "@/features/chord/data/chordNames";
import {
  SCALE_TYPES,
  selectRandomDiatonicStartupChord,
  WESTERN_CHORD_TYPES,
} from "../selectRandomDiatonicStartupChord";

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

  it("supports every key root and scale mode without throwing", () => {
    for (let keyRoot = 0; keyRoot < 12; keyRoot += 1) {
      for (let scaleIndex = 0; scaleIndex < SCALE_TYPES.length; scaleIndex += 1) {
        const rng = fromSequence([
          (keyRoot + 0.1) / 12,
          (scaleIndex + 0.1) / SCALE_TYPES.length,
          0,
          0,
        ]);
        const selection = selectRandomDiatonicStartupChord(rng);
        const diatonic = getDiatonicIndices(selection.keyRoot, selection.keyScale);

        expect(selection.keyRoot).toBe(keyRoot);
        expect(selection.keyScale).toBe(SCALE_TYPES[scaleIndex]);
        expect(diatonic.has(selection.chord.root)).toBe(true);
      }
    }
  });
});
