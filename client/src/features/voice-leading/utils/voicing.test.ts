import { describe, it, expect } from "vitest";
import { closeVoiceChord, minimalMotionVoicing, openVoiceChord } from "./voicing";

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

  describe("motionBias tie-break", () => {
    // Tie case: from F#4 (MIDI 66), C4=60 and C5=72 are both 6 semitones away.
    // Math.round((66 - 0) / 12) = 6, so base = 72.
    // The lower candidate (60) ties with base (72).
    // down → 60, neutral/up → 72 (base is kept without bias).
    it("down bias resolves tie to the lower MIDI note", () => {
      expect(minimalMotionVoicing([66], [0], 'down')).toEqual([60]);
    });

    it("up bias resolves tie to the higher MIDI note (base)", () => {
      expect(minimalMotionVoicing([66], [0], 'up')).toEqual([72]);
    });

    it("neutral bias keeps base candidate on tie (no directional preference)", () => {
      expect(minimalMotionVoicing([66], [0], 'neutral')).toEqual([72]);
    });

    it("down and up produce different results in the tie case", () => {
      const down = minimalMotionVoicing([66], [0], 'down');
      const up = minimalMotionVoicing([66], [0], 'up');
      expect(down[0]).toBeLessThan(up[0]!);
    });
  });
});

describe("openVoiceChord", () => {
  it("spreads a C major triad to open voicing at default octave 4", () => {
    // close: [60, 64, 67] → spread odd idx: [60, 76, 67] → sort: [60, 67, 76]
    expect(openVoiceChord([0, 4, 7])).toEqual([60, 67, 76]);
  });

  it("spreads a C major seventh chord to open voicing at default octave 4", () => {
    // close: [60, 64, 67, 71] → spread odd idx: [60, 76, 67, 83] → sort: [60, 67, 76, 83]
    expect(openVoiceChord([0, 4, 7, 11])).toEqual([60, 67, 76, 83]);
  });

  it("spreads a triad starting at octave 3", () => {
    // close at oct 3: [48, 52, 55] → spread: [48, 64, 55] → sort: [48, 55, 64]
    expect(openVoiceChord([0, 4, 7], 3)).toEqual([48, 55, 64]);
  });

  it("handles a triad that wraps across the octave boundary", () => {
    // G major: close [67, 71, 74] → spread [67, 83, 74] → sort [67, 74, 83]
    expect(openVoiceChord([7, 11, 2])).toEqual([67, 74, 83]);
  });

  it("returns a single-element array for a single pitch class (no spread needed)", () => {
    expect(openVoiceChord([0])).toEqual([60]);
  });

  it("returns an empty array for empty input", () => {
    expect(openVoiceChord([])).toEqual([]);
  });

  it("produces notes spread more than a fifth apart (open voicing property)", () => {
    const result = openVoiceChord([0, 4, 7]);
    const intervals = result.slice(1).map((n, i) => n - result[i]!);
    // All intervals in an open voicing should be at least a minor third (3 st).
    intervals.forEach((interval) => {
      expect(interval).toBeGreaterThanOrEqual(3);
    });
  });

  it("contains the same pitch classes as close voicing", () => {
    const pitchClassesOpen = openVoiceChord([0, 4, 7, 11]).map((n) => n % 12).sort((a, b) => a - b);
    const pitchClassesClose = [0, 4, 7, 11]; // already sorted
    expect(pitchClassesOpen).toEqual(pitchClassesClose);
  });
});
