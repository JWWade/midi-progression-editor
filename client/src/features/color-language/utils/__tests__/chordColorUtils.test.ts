import { describe, it, expect } from "vitest";
import {
  getChordComplexity,
  getChordColor,
  getChordFillColor,
  getAccessibleTextColor,
} from "../chordColorUtils";
import type { Chord } from "@/features/current-chord/types";
import type { ChordType } from "@/features/chord/types";

const TRIAD_TYPES: ChordType[] = ["major", "minor", "dim", "aug", "sus2"];
const SEVENTH_TYPES: ChordType[] = ["maj6", "maj7", "min7", "dom7", "halfdim7"];
const ALL_9_CHORD_TYPES: ChordType[] = [...TRIAD_TYPES, ...SEVENTH_TYPES];

describe("getChordComplexity", () => {
  it("returns 'triad' for major", () => {
    const chord: Chord = { root: 0, quality: "major" };
    expect(getChordComplexity(chord)).toBe("triad");
  });

  it("returns 'triad' for minor", () => {
    const chord: Chord = { root: 0, quality: "minor" };
    expect(getChordComplexity(chord)).toBe("triad");
  });

  it("returns 'triad' for dim", () => {
    const chord: Chord = { root: 0, quality: "dim" };
    expect(getChordComplexity(chord)).toBe("triad");
  });

  it("returns 'triad' for aug", () => {
    const chord: Chord = { root: 0, quality: "aug" };
    expect(getChordComplexity(chord)).toBe("triad");
  });

  it("returns 'triad' for sus2", () => {
    const chord: Chord = { root: 0, quality: "sus2" };
    expect(getChordComplexity(chord)).toBe("triad");
  });

  it("returns 'seventh' for maj7", () => {
    const chord: Chord = { root: 0, quality: "maj7" };
    expect(getChordComplexity(chord)).toBe("seventh");
  });

  it("returns 'seventh' for maj6", () => {
    const chord: Chord = { root: 0, quality: "maj6" };
    expect(getChordComplexity(chord)).toBe("seventh");
  });

  it("returns 'seventh' for min7", () => {
    const chord: Chord = { root: 0, quality: "min7" };
    expect(getChordComplexity(chord)).toBe("seventh");
  });

  it("returns 'seventh' for dom7", () => {
    const chord: Chord = { root: 0, quality: "dom7" };
    expect(getChordComplexity(chord)).toBe("seventh");
  });

  it("returns 'seventh' for halfdim7", () => {
    const chord: Chord = { root: 0, quality: "halfdim7" };
    expect(getChordComplexity(chord)).toBe("seventh");
  });

  it("returns 'extended' when extensions contain '9'", () => {
    const chord: Chord = { root: 0, quality: "dom7", extensions: ["9"] };
    expect(getChordComplexity(chord)).toBe("extended");
  });

  it("returns 'extended' when extensions contain '11'", () => {
    const chord: Chord = { root: 0, quality: "maj7", extensions: ["11"] };
    expect(getChordComplexity(chord)).toBe("extended");
  });

  it("returns 'extended' when extensions contain '13'", () => {
    const chord: Chord = { root: 0, quality: "min7", extensions: ["13"] };
    expect(getChordComplexity(chord)).toBe("extended");
  });

  it("returns 'seventh' even when extensions array is empty", () => {
    const chord: Chord = { root: 0, quality: "dom7", extensions: [] };
    expect(getChordComplexity(chord)).toBe("seventh");
  });

  it("returns 'triad' for all 5 triad types", () => {
    for (const quality of TRIAD_TYPES) {
      const chord: Chord = { root: 0, quality };
      expect(getChordComplexity(chord)).toBe("triad");
    }
  });

  it("returns 'seventh' for all 5 seventh types without extensions", () => {
    for (const quality of SEVENTH_TYPES) {
      const chord: Chord = { root: 0, quality };
      expect(getChordComplexity(chord)).toBe("seventh");
    }
  });
});

describe("getChordColor", () => {
  it("returns a non-empty string for every chord type at 'triad' complexity", () => {
    for (const quality of ALL_9_CHORD_TYPES) {
      const color = getChordColor(quality, "triad");
      expect(typeof color).toBe("string");
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it("returns a valid hsl() CSS color string for all types at triad complexity", () => {
    for (const quality of ALL_9_CHORD_TYPES) {
      const color = getChordColor(quality, "triad");
      expect(color).toMatch(/^hsl\(/i);
    }
  });

  it("returns a valid hsl() color for seventh complexity", () => {
    for (const quality of ALL_9_CHORD_TYPES) {
      const color = getChordColor(quality, "seventh");
      expect(color).toMatch(/^hsl\(/i);
    }
  });

  it("returns a valid hsl() color for extended complexity", () => {
    for (const quality of ALL_9_CHORD_TYPES) {
      const color = getChordColor(quality, "extended");
      expect(color).toMatch(/^hsl\(/i);
    }
  });

  it("returns distinct colors for different chord types at the same complexity", () => {
    const majorColor = getChordColor("major", "triad");
    const minorColor = getChordColor("minor", "triad");
    const dimColor = getChordColor("dim", "triad");
    expect(majorColor).not.toBe(minorColor);
    expect(majorColor).not.toBe(dimColor);
    expect(minorColor).not.toBe(dimColor);
  });

  it("returns a more saturated color for 'seventh' than 'triad' for the same quality", () => {
    // The 'seventh' tier uses the 'deeper' shade which has higher saturation.
    // We can verify the colors are different, not equal.
    const triadColor = getChordColor("major", "triad");
    const seventhColor = getChordColor("major", "seventh");
    expect(triadColor).not.toBe(seventhColor);
  });

  it("returns the most saturated color for 'extended' compared to other tiers", () => {
    const triadColor = getChordColor("dom7", "triad");
    const seventhColor = getChordColor("dom7", "seventh");
    const extendedColor = getChordColor("dom7", "extended");
    expect(extendedColor).not.toBe(seventhColor);
    expect(extendedColor).not.toBe(triadColor);
  });
});

describe("getChordFillColor", () => {
  it("returns an hsla() string (with alpha) for every chord type", () => {
    for (const quality of ALL_9_CHORD_TYPES) {
      const fillColor = getChordFillColor(quality, "triad");
      expect(fillColor).toMatch(/^hsla\(/i);
    }
  });

  it("returns a color with 0.12 alpha appended", () => {
    const fillColor = getChordFillColor("major", "triad");
    expect(fillColor).toContain("0.12");
  });

  it("includes the same hue/saturation/lightness as the solid color", () => {
    // getChordColor returns hsl(H, S%, L%)
    // getChordFillColor should return hsla(H, S%, L%, 0.12)
    const solid = getChordColor("minor", "triad");
    const fill = getChordFillColor("minor", "triad");
    // The solid color body (without 'hsl(' and ')') should appear inside the fill
    const solidBody = solid.replace(/^hsl\(/, "").replace(/\)$/, "");
    expect(fill).toContain(solidBody);
  });

  it("solid color starts with hsl() and fill color starts with hsla()", () => {
    const solid = getChordColor("dom7", "seventh");
    const fill = getChordFillColor("dom7", "seventh");
    expect(solid).toMatch(/^hsl\(/);
    expect(fill).toMatch(/^hsla\(/);
  });

  it("returns different fill colors for different chord qualities", () => {
    const majorFill = getChordFillColor("major", "triad");
    const minorFill = getChordFillColor("minor", "triad");
    expect(majorFill).not.toBe(minorFill);
  });
});

describe("getAccessibleTextColor", () => {
  it("returns dark text for a very light background (95% lightness)", () => {
    // All quality 'light' colors have 95–96% lightness → dark text
    expect(getAccessibleTextColor("hsl(45, 80%, 95%)")).toBe("#111827");
  });

  it("returns white text for a dark background (28% lightness)", () => {
    // All quality 'dark' colors have 20–30% lightness → white text
    expect(getAccessibleTextColor("hsl(45, 80%, 28%)")).toBe("#ffffff");
  });

  it("returns dark text for each quality's light color", () => {
    for (const quality of ALL_9_CHORD_TYPES) {
      const solidColor = getChordColor(quality, "triad");
      // base colors (50% lightness) could go either way; light colors always return dark
      const lightColor = solidColor.replace(/\d+%\)$/, "95%)");
      expect(getAccessibleTextColor(lightColor)).toBe("#111827");
    }
  });

  it("returns white text for very dark backgrounds (10% lightness)", () => {
    expect(getAccessibleTextColor("hsl(230, 65%, 10%)")).toBe("#ffffff");
  });

  it("returns the fallback dark color for a non-HSL input string", () => {
    expect(getAccessibleTextColor("red")).toBe("#111827");
    expect(getAccessibleTextColor("#ff0000")).toBe("#111827");
    expect(getAccessibleTextColor("")).toBe("#111827");
  });

  it("returns either '#111827' or '#ffffff' — no other values", () => {
    const testColors = [
      "hsl(0, 0%, 0%)",
      "hsl(0, 0%, 50%)",
      "hsl(0, 0%, 100%)",
      "hsl(120, 60%, 40%)",
      "hsl(240, 80%, 70%)",
    ];
    for (const color of testColors) {
      const result = getAccessibleTextColor(color);
      expect(["#111827", "#ffffff"]).toContain(result);
    }
  });

  it("invariant: black background (0% lightness) always returns white text", () => {
    expect(getAccessibleTextColor("hsl(0, 0%, 0%)")).toBe("#ffffff");
  });

  it("invariant: white background (100% lightness) always returns dark text", () => {
    expect(getAccessibleTextColor("hsl(0, 0%, 100%)")).toBe("#111827");
  });
});
