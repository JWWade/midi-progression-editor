import { describe, it, expect } from "vitest";
import {
  getNoteStyle,
  chordToneGradientId,
  chordPolygonGradientId,
  CHORD_TONE_FILLS,
} from "../noteStyles";
import type { ChordType } from "@/features/chord/types";

const ALL_CHORD_TYPES: ChordType[] = [
  "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7", "quartal",
];

describe("chordToneGradientId", () => {
  it("returns the expected id for a triad quality", () => {
    expect(chordToneGradientId("major")).toBe("chord-tone-major-triad");
    expect(chordToneGradientId("minor")).toBe("chord-tone-minor-triad");
  });

  it("includes the complexity tier in the id", () => {
    expect(chordToneGradientId("dom7", "seventh")).toBe("chord-tone-dom7-seventh");
    expect(chordToneGradientId("maj7", "extended")).toBe("chord-tone-maj7-extended");
  });

  it("defaults complexity to 'triad' when omitted", () => {
    expect(chordToneGradientId("aug")).toBe("chord-tone-aug-triad");
  });
});

describe("chordPolygonGradientId", () => {
  it("returns the expected id for a given quality and complexity", () => {
    expect(chordPolygonGradientId("major", "triad")).toBe("chord-polygon-major-triad");
    expect(chordPolygonGradientId("dom7", "seventh")).toBe("chord-polygon-dom7-seventh");
  });

  it("includes both quality and complexity in the id", () => {
    expect(chordPolygonGradientId("min7", "extended")).toBe("chord-polygon-min7-extended");
  });
});

describe("CHORD_TONE_FILLS", () => {
  it("contains an entry for every ChordType", () => {
    for (const t of ALL_CHORD_TYPES) {
      expect(CHORD_TONE_FILLS[t]).toBeDefined();
    }
  });

  it("all entries are non-empty strings", () => {
    for (const t of ALL_CHORD_TYPES) {
      expect(typeof CHORD_TONE_FILLS[t]).toBe("string");
      expect(CHORD_TONE_FILLS[t].length).toBeGreaterThan(0);
    }
  });
});

describe("getNoteStyle", () => {
  const diatonic = new Set([0, 2, 4, 5, 7, 9, 11]); // C major

  it("returns gradient fill and white text for a chord tone", () => {
    const style = getNoteStyle(0, [0, 4, 7], "major", diatonic);
    expect(style.fill).toBe("url(#chord-tone-major-triad)");
    expect(style.textFill).toBe("#fff");
    expect(style.opacity).toBe(1); // C is diatonic → full opacity
  });

  it("returns gradient fill for every chord type when note is a chord tone", () => {
    for (const quality of ALL_CHORD_TYPES) {
      const style = getNoteStyle(0, [0], quality, new Set([0]));
      expect(style.fill).toMatch(/^url\(#chord-tone-/);
      expect(style.textFill).toBe("#fff");
    }
  });

  it("returns the diatonic fill (#4F46E5) for a diatonic non-chord-tone", () => {
    // note 2 (D) is diatonic in C major but not in C major triad [0,4,7]
    const style = getNoteStyle(2, [0, 4, 7], "major", diatonic);
    expect(style.fill).toBe("#4F46E5");
    expect(style.textFill).toBe("#fff");
    expect(style.opacity).toBe(1);
  });

  it("returns a grey fill for a chromatic (non-diatonic, non-chord) note in light theme", () => {
    // note 1 (C#) is chromatic in C major
    const style = getNoteStyle(1, [0, 4, 7], "major", diatonic);
    // In node/test environment isDarkTheme() returns false → light theme
    expect(style.fill).toBe("#D1D5DB");
    expect(style.opacity).toBe(0.3);
  });

  it("uses reduced opacity for a chromatic chord tone", () => {
    // note 1 (C#) is chromatic but it's in the chord
    const style = getNoteStyle(1, [0, 1, 4], "major", diatonic);
    expect(style.fill).toMatch(/^url\(#chord-tone-/);
    expect(style.opacity).toBe(0.7); // CHORD_TONE_CHROMATIC_OPACITY
  });

  it("includes complexity tier in gradient id when specified", () => {
    const style = getNoteStyle(0, [0, 4, 7, 11], "maj7", diatonic, "seventh");
    expect(style.fill).toBe("url(#chord-tone-maj7-seventh)");
  });

  it("handles empty chord index array (no chord tones)", () => {
    // No chord tone — note 0 is diatonic
    const style = getNoteStyle(0, [], "major", diatonic);
    expect(style.fill).toBe("#4F46E5");
    // note 1 is chromatic
    const chromStyle = getNoteStyle(1, [], "major", diatonic);
    expect(chromStyle.fill).toBe("#D1D5DB");
  });

  it("handles empty diatonic set (no diatonic notes)", () => {
    const style = getNoteStyle(0, [0, 4, 7], "major", new Set());
    // note is a chord tone, so gradient fill is used
    expect(style.fill).toMatch(/^url\(#chord-tone-/);
  });
});
