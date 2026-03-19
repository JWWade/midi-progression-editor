import { describe, it, expect } from "vitest";
import {
  getHarmonyOpacity,
  DIATONIC_OPACITY,
  CHROMATIC_OPACITY,
  CHORD_TONE_CHROMATIC_OPACITY,
} from "../harmonyOpacity";

// C major diatonic set: C D E F G A B → indices 0 2 4 5 7 9 11
const C_MAJOR_DIATONIC = new Set([0, 2, 4, 5, 7, 9, 11]);
// Empty diatonic set — every note is chromatic
const EMPTY_DIATONIC = new Set<number>();
// Full chromatic set — every note is diatonic
const FULL_DIATONIC = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

describe("exported opacity constants", () => {
  it("DIATONIC_OPACITY is 1", () => {
    expect(DIATONIC_OPACITY).toBe(1);
  });

  it("CHROMATIC_OPACITY is 0.3", () => {
    expect(CHROMATIC_OPACITY).toBe(0.3);
  });

  it("CHORD_TONE_CHROMATIC_OPACITY is 0.7", () => {
    expect(CHORD_TONE_CHROMATIC_OPACITY).toBe(0.7);
  });
});

describe("getHarmonyOpacity — diatonic chord tone (highest opacity)", () => {
  it("returns DIATONIC_OPACITY (1) for a diatonic chord tone (C in C major)", () => {
    expect(getHarmonyOpacity(0, C_MAJOR_DIATONIC, true)).toBe(DIATONIC_OPACITY);
  });

  it("returns DIATONIC_OPACITY (1) for every diatonic chord tone in C major", () => {
    const chordTones = [0, 4, 7]; // C major triad
    for (const note of chordTones) {
      expect(getHarmonyOpacity(note, C_MAJOR_DIATONIC, true)).toBe(DIATONIC_OPACITY);
    }
  });

  it("returns DIATONIC_OPACITY when all notes are diatonic chord tones", () => {
    for (let i = 0; i < 12; i++) {
      expect(getHarmonyOpacity(i, FULL_DIATONIC, true)).toBe(DIATONIC_OPACITY);
    }
  });
});

describe("getHarmonyOpacity — diatonic non-chord tone", () => {
  it("returns DIATONIC_OPACITY for a diatonic note that is not a chord tone", () => {
    // D (2) is diatonic in C major but not in C major triad [0,4,7]
    expect(getHarmonyOpacity(2, C_MAJOR_DIATONIC, false)).toBe(DIATONIC_OPACITY);
  });

  it("returns DIATONIC_OPACITY for all diatonic non-chord tones", () => {
    const nonChordDiatonic = [2, 5, 9, 11]; // D, F, A, B — diatonic but not C-E-G
    for (const note of nonChordDiatonic) {
      expect(getHarmonyOpacity(note, C_MAJOR_DIATONIC, false)).toBe(DIATONIC_OPACITY);
    }
  });
});

describe("getHarmonyOpacity — chromatic non-chord tone", () => {
  it("returns CHROMATIC_OPACITY (0.3) for a chromatic non-chord tone", () => {
    // C# (1) is chromatic in C major and not a chord tone
    expect(getHarmonyOpacity(1, C_MAJOR_DIATONIC, false)).toBe(CHROMATIC_OPACITY);
  });

  it("returns CHROMATIC_OPACITY for all chromatic non-chord tones", () => {
    const chromaticNotes = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, Bb
    for (const note of chromaticNotes) {
      expect(getHarmonyOpacity(note, C_MAJOR_DIATONIC, false)).toBe(CHROMATIC_OPACITY);
    }
  });

  it("returns CHROMATIC_OPACITY when diatonic set is empty and note is not a chord tone", () => {
    expect(getHarmonyOpacity(0, EMPTY_DIATONIC, false)).toBe(CHROMATIC_OPACITY);
  });
});

describe("getHarmonyOpacity — chromatic chord tone", () => {
  it("returns CHORD_TONE_CHROMATIC_OPACITY (0.7) for a chromatic chord tone", () => {
    // C# (1) is chromatic but is a chord tone here
    expect(getHarmonyOpacity(1, C_MAJOR_DIATONIC, true)).toBe(CHORD_TONE_CHROMATIC_OPACITY);
  });

  it("returns CHORD_TONE_CHROMATIC_OPACITY for multiple chromatic chord tones", () => {
    const chromaticChordTones = [1, 3, 6]; // chromatic in C major but treated as chord tones
    for (const note of chromaticChordTones) {
      expect(getHarmonyOpacity(note, C_MAJOR_DIATONIC, true)).toBe(CHORD_TONE_CHROMATIC_OPACITY);
    }
  });

  it("returns CHORD_TONE_CHROMATIC_OPACITY when diatonic set is empty and note is a chord tone", () => {
    expect(getHarmonyOpacity(0, EMPTY_DIATONIC, true)).toBe(CHORD_TONE_CHROMATIC_OPACITY);
  });
});

describe("getHarmonyOpacity — ordering checks", () => {
  it("chord tone opacity is always ≥ chromatic non-chord-tone opacity", () => {
    // Both diatonic-chord-tone (1) and chromatic-chord-tone (0.7) are ≥ 0.3
    const diatonicChordTone = getHarmonyOpacity(0, C_MAJOR_DIATONIC, true);
    const chromaticChordTone = getHarmonyOpacity(1, C_MAJOR_DIATONIC, true);
    const chromaticNonChord = getHarmonyOpacity(1, C_MAJOR_DIATONIC, false);
    expect(diatonicChordTone).toBeGreaterThanOrEqual(chromaticNonChord);
    expect(chromaticChordTone).toBeGreaterThanOrEqual(chromaticNonChord);
  });

  it("CHORD_TONE_CHROMATIC_OPACITY is between CHROMATIC_OPACITY and DIATONIC_OPACITY", () => {
    expect(CHORD_TONE_CHROMATIC_OPACITY).toBeGreaterThan(CHROMATIC_OPACITY);
    expect(CHORD_TONE_CHROMATIC_OPACITY).toBeLessThan(DIATONIC_OPACITY);
  });
});
