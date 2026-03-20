import { describe, it, expect } from "vitest";
import { NOTE_VALUE_OPTIONS, getNoteValueOption } from "./noteValues";

describe("NOTE_VALUE_OPTIONS", () => {
  it("has exactly three options", () => {
    expect(NOTE_VALUE_OPTIONS).toHaveLength(3);
  });

  it("contains beat values 1, 2, and 4 in ascending order", () => {
    expect(NOTE_VALUE_OPTIONS.map((o) => o.beats)).toEqual([1, 2, 4]);
  });

  it("labels options Quarter, Half, Whole", () => {
    expect(NOTE_VALUE_OPTIONS.map((o) => o.label)).toEqual(["Quarter", "Half", "Whole"]);
  });

  it("provides descriptive ariaLabel strings for each option", () => {
    expect(NOTE_VALUE_OPTIONS[0].ariaLabel).toContain("Quarter");
    expect(NOTE_VALUE_OPTIONS[1].ariaLabel).toContain("Half");
    expect(NOTE_VALUE_OPTIONS[2].ariaLabel).toContain("Whole");
  });
});

describe("getNoteValueOption", () => {
  it("returns the matching option for beat value 1 (Quarter)", () => {
    const opt = getNoteValueOption(1);
    expect(opt).toBeDefined();
    expect(opt?.label).toBe("Quarter");
  });

  it("returns the matching option for beat value 2 (Half)", () => {
    const opt = getNoteValueOption(2);
    expect(opt).toBeDefined();
    expect(opt?.label).toBe("Half");
  });

  it("returns the matching option for beat value 4 (Whole)", () => {
    const opt = getNoteValueOption(4);
    expect(opt).toBeDefined();
    expect(opt?.label).toBe("Whole");
  });

  it("returns undefined for an unknown beat count", () => {
    expect(getNoteValueOption(3)).toBeUndefined();
    expect(getNoteValueOption(0)).toBeUndefined();
    expect(getNoteValueOption(8)).toBeUndefined();
  });
});
