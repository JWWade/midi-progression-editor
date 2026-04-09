/**
 * @file scaleDescriptors.test.ts
 *
 * Validates that SCALE_DESCRIPTORS covers all ScaleType values and that each
 * descriptor has well-formed data.
 */
import { describe, it, expect } from "vitest";
import { SCALE_INTERVALS, SCALE_DESCRIPTORS } from "../../types/scales";
import type { ScaleTension, ScaleBrightness } from "../../types/scales";

const VALID_TENSIONS: ScaleTension[] = ["stable", "moderate", "floating", "unresolved", "high"];
const VALID_BRIGHTNESSES: ScaleBrightness[] = ["dark", "neutral", "warm", "bright", "ethereal"];

describe("SCALE_DESCRIPTORS", () => {
  it("covers exactly the same keys as SCALE_INTERVALS", () => {
    expect(Object.keys(SCALE_DESCRIPTORS).sort()).toEqual(
      Object.keys(SCALE_INTERVALS).sort(),
    );
  });

  it("every descriptor has a non-empty mood array", () => {
    for (const [mode, desc] of Object.entries(SCALE_DESCRIPTORS)) {
      expect(desc.mood.length, `${mode}.mood is empty`).toBeGreaterThan(0);
    }
  });

  it("every descriptor has a non-empty color array", () => {
    for (const [mode, desc] of Object.entries(SCALE_DESCRIPTORS)) {
      expect(desc.color.length, `${mode}.color is empty`).toBeGreaterThan(0);
    }
  });

  it("every descriptor has a non-empty culturalContext array", () => {
    for (const [mode, desc] of Object.entries(SCALE_DESCRIPTORS)) {
      expect(
        desc.culturalContext.length,
        `${mode}.culturalContext is empty`,
      ).toBeGreaterThan(0);
    }
  });

  it("every summary is a non-empty string", () => {
    for (const [mode, desc] of Object.entries(SCALE_DESCRIPTORS)) {
      expect(typeof desc.summary, `${mode}.summary is not a string`).toBe("string");
      expect(desc.summary.trim().length, `${mode}.summary is blank`).toBeGreaterThan(0);
    }
  });

  it("every tension value is a valid ScaleTension member", () => {
    for (const [mode, desc] of Object.entries(SCALE_DESCRIPTORS)) {
      expect(
        VALID_TENSIONS,
        `${mode}.tension "${desc.tension}" is not a valid ScaleTension`,
      ).toContain(desc.tension);
    }
  });

  it("every brightness value is a valid ScaleBrightness member", () => {
    for (const [mode, desc] of Object.entries(SCALE_DESCRIPTORS)) {
      expect(
        VALID_BRIGHTNESSES,
        `${mode}.brightness "${desc.brightness}" is not a valid ScaleBrightness`,
      ).toContain(desc.brightness);
    }
  });
});
