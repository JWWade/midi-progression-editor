import { describe, expect, it } from "vitest";
import { getFontSizeForInterval, getIntervalLabelMetrics } from "../utils/intervalLabelMetrics";

describe("IntervalLabel metrics", () => {
  it("allocates more width and smaller type for longer interval names", () => {
    const shortMetrics = getIntervalLabelMetrics("m3");
    const longMetrics = getIntervalLabelMetrics("A4/d5");

    expect(longMetrics.rectWidth).toBeGreaterThan(shortMetrics.rectWidth);
    expect(longMetrics.fontSize).toBeLessThan(shortMetrics.fontSize);
    expect(longMetrics.textLength).toBe(longMetrics.rectWidth - 10);
  });

  it("clamps to configured minimum and maximum widths", () => {
    const shortMetrics = getIntervalLabelMetrics("P4");
    const longMetrics = getIntervalLabelMetrics("VeryLongInterval");

    expect(shortMetrics.rectWidth).toBe(26);
    expect(longMetrics.rectWidth).toBe(44);
  });

  it("returns expected font breakpoints", () => {
    expect(getFontSizeForInterval("M2")).toBe(11);
    expect(getFontSizeForInterval("A4/d5")).toBe(10);
    expect(getFontSizeForInterval("Octave")).toBe(9);
  });
});
