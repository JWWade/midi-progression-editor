// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getCircleColor, getCircleColorForTheme } from "../circleColors";
import { ChordColors } from "@/features/color-language/constants/chordColors";
import type { ChordType } from "@/features/chord/types";

const ALL_CHORD_TYPES: ChordType[] = [
  "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7", "quartal",
];

describe("getCircleColor", () => {
  it("returns the quality's light color in light theme (no data-theme attribute)", () => {
    // isDarkTheme() returns false in test (node/jsdom without data-theme set)
    const result = getCircleColor(0, "major");
    expect(result).toBe(ChordColors.major.light);
  });

  it("returns a string for every chord type", () => {
    for (const quality of ALL_CHORD_TYPES) {
      const result = getCircleColor(0, quality);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("returns the quality-specific light color for all root notes (root is ignored)", () => {
    for (let root = 0; root < 12; root++) {
      const result = getCircleColor(root, "minor");
      expect(result).toBe(ChordColors.minor.light);
    }
  });

  it("returns distinct colors for different chord qualities", () => {
    const majorColor = getCircleColor(0, "major");
    const minorColor = getCircleColor(0, "minor");
    const dimColor = getCircleColor(0, "dim");
    expect(majorColor).not.toBe(minorColor);
    expect(majorColor).not.toBe(dimColor);
    expect(minorColor).not.toBe(dimColor);
  });
});

describe("getCircleColorForTheme", () => {
  it("returns the quality's light color for light theme", () => {
    const result = getCircleColorForTheme(0, "major", "light");
    expect(result).toBe(ChordColors.major.light);
  });

  it("returns the quality's light color for every non-dark quality", () => {
    for (const quality of ALL_CHORD_TYPES) {
      const result = getCircleColorForTheme(0, quality, "light");
      expect(result).toBe(ChordColors[quality].light);
    }
  });

  it("returns a dark HSLa string for dark theme on 'circle' surface", () => {
    const result = getCircleColorForTheme(0, "major", "dark", "circle");
    expect(result).toMatch(/^hsla\(/i);
  });

  it("returns a dark HSL string for dark theme on 'panel' surface", () => {
    const result = getCircleColorForTheme(0, "major", "dark", "panel");
    expect(result).toMatch(/^hsl\(/i);
  });

  it("dark theme 'circle' output is different from light theme output", () => {
    const light = getCircleColorForTheme(0, "dom7", "light");
    const dark = getCircleColorForTheme(0, "dom7", "dark", "circle");
    expect(light).not.toBe(dark);
  });

  it("returns distinct dark-theme circle colors for different chord qualities", () => {
    const majorDark = getCircleColorForTheme(0, "major", "dark");
    const minorDark = getCircleColorForTheme(0, "minor", "dark");
    expect(majorDark).not.toBe(minorDark);
  });

  it("root note does not affect the returned color", () => {
    const root0 = getCircleColorForTheme(0, "major", "light");
    const root5 = getCircleColorForTheme(5, "major", "light");
    expect(root0).toBe(root5);
  });
});

describe("getCircleColor — dark theme (document data-theme=dark)", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("returns an hsla() string for the default 'circle' surface in dark theme", () => {
    const result = getCircleColor(0, "major");
    expect(result).toMatch(/^hsla\(/i);
  });

  it("returns an hsl() string for 'panel' surface in dark theme", () => {
    const result = getCircleColor(0, "major", "panel");
    expect(result).toMatch(/^hsl\(/i);
  });

  it("dark-theme circle color is different from the quality's light color", () => {
    const lightColor = ChordColors.major.light;
    const darkResult = getCircleColor(0, "major", "circle");
    expect(darkResult).not.toBe(lightColor);
  });

  it("returns distinct dark-theme circle colors for different chord qualities", () => {
    const majorDark = getCircleColor(0, "major", "circle");
    const minorDark = getCircleColor(0, "minor", "circle");
    expect(majorDark).not.toBe(minorDark);
  });

  it("returns a non-empty string for all chord types and both surfaces in dark theme", () => {
    for (const quality of ALL_CHORD_TYPES) {
      const circle = getCircleColor(0, quality, "circle");
      const panel = getCircleColor(0, quality, "panel");
      expect(circle.length).toBeGreaterThan(0);
      expect(panel.length).toBeGreaterThan(0);
    }
  });
});
