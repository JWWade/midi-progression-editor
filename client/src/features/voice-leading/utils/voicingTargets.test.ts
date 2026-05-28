import { describe, expect, it } from "vitest";
import type { Chord } from "@/features/current-chord/types";
import { buildVoicingTargets, enforceVoicingTargets } from "./voicingTargets";

describe("buildVoicingTargets", () => {
  it("includes explicit 9th extension above the octave for named chords", () => {
    const chord: Chord = { root: 0, quality: "dom7", extensions: ["9"] };
    const targets = buildVoicingTargets(chord);

    expect(targets.pitchClasses).toEqual([0, 4, 7, 10, 2]);
    expect(targets.minSemitonesFromRoot).toEqual([0, 4, 7, 10, 14]);
  });

  it("infers custom 9th intent from selected notes when non-canonical tone is present", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [0, 4, 7, 2] };
    const targets = buildVoicingTargets(chord);

    expect(targets.pitchClasses).toEqual([0, 4, 7, 2]);
    expect(targets.minSemitonesFromRoot).toEqual([0, 4, 7, 14]);
  });
});

describe("enforceVoicingTargets", () => {
  it("lifts extension tone by octaves to satisfy minimum extension register", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [0, 4, 7, 2] };
    const targets = buildVoicingTargets(chord);

    // C-E-G-D where D is initially voiced as the 2nd (MIDI 62)
    const constrained = enforceVoicingTargets([60, 64, 67, 62], targets);

    expect(constrained).toEqual([60, 64, 67, 74]);
  });
});
