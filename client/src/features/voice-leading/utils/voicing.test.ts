import { describe, it, expect } from "vitest";
import { closeVoiceChord, minimalMotionVoicing } from "./voicing";

describe("closeVoiceChord", () => {
  it("voices a basic major triad at default octave 4", () => {
    expect(closeVoiceChord([0, 4, 7])).toEqual([60, 64, 67]);
  });

  it("voices a major seventh chord at default octave 4", () => {
    expect(closeVoiceChord([0, 4, 7, 11])).toEqual([60, 64, 67, 71]);
  });

  it("voices a major triad at octave 3", () => {
    expect(closeVoiceChord([0, 4, 7], 3)).toEqual([48, 52, 55]);
  });

  it("wraps past the octave boundary when pitch classes ascend beyond it", () => {
    // G4=67, B4=71, D5=74
    expect(closeVoiceChord([7, 11, 2])).toEqual([67, 71, 74]);
  });

  it("returns a single-element array for a single pitch class", () => {
    expect(closeVoiceChord([0])).toEqual([60]);
  });

  it("returns an empty array for empty input", () => {
    expect(closeVoiceChord([])).toEqual([]);
  });
});

describe("minimalMotionVoicing", () => {
  it("minimizes motion from C major to F major — each voice moves ≤ 6 semitones", () => {
    const result = minimalMotionVoicing([60, 64, 67], [5, 9, 0]);
    result.forEach((note, i) => {
      expect(Math.abs(note - [60, 64, 67][i])).toBeLessThanOrEqual(6);
    });
  });

  it("total movement to G major is ≤ naive same-octave placement", () => {
    const prev = [60, 64, 67];
    const nextPcs = [7, 11, 2];
    const result = minimalMotionVoicing(prev, nextPcs);
    const naivePlacement = closeVoiceChord(nextPcs); // [67, 71, 74]
    const totalMotion = result.reduce(
      (sum, note, i) => sum + Math.abs(note - prev[i]),
      0,
    );
    const naiveMotion = naivePlacement.reduce(
      (sum, note, i) => sum + Math.abs(note - prev[i]),
      0,
    );
    expect(totalMotion).toBeLessThanOrEqual(naiveMotion);
  });

  it("returns the same chord when the pitch classes are unchanged", () => {
    expect(minimalMotionVoicing([60, 64, 67], [0, 4, 7])).toEqual([60, 64, 67]);
  });

  it("truncates to 3 voices when moving from a seventh chord to a triad", () => {
    const result = minimalMotionVoicing([60, 64, 67, 71], [0, 4, 7]);
    expect(result).toHaveLength(3);
  });

  it("produces all 4 voices when expanding from a triad to a seventh chord", () => {
    const result = minimalMotionVoicing([60, 64, 67], [0, 4, 7, 11]);
    expect(result).toHaveLength(4);
  });

  it("includes the correct pitch class for the 4th note when expanding triad → seventh", () => {
    // C major triad → C maj7: the 7th (B, pc=11) must appear in the output
    const result = minimalMotionVoicing([60, 64, 67], [0, 4, 7, 11]);
    const pitchClasses = result.map((n) => n % 12);
    expect(pitchClasses).toContain(11); // B
  });
});
