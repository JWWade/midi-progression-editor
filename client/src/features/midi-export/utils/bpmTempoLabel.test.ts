import { describe, it, expect } from "vitest";
import { getBpmTempoLabel } from "./bpmTempoLabel";

describe("getBpmTempoLabel", () => {
  it("returns Largo for the minimum value (40)", () => {
    expect(getBpmTempoLabel(40)).toBe("Largo");
  });

  it("returns Largo for values in the 40–59 range", () => {
    expect(getBpmTempoLabel(50)).toBe("Largo");
    expect(getBpmTempoLabel(59)).toBe("Largo");
  });

  it("returns Adagio for values in the 60–75 range", () => {
    expect(getBpmTempoLabel(60)).toBe("Adagio");
    expect(getBpmTempoLabel(75)).toBe("Adagio");
  });

  it("returns Andante for values in the 76–107 range", () => {
    expect(getBpmTempoLabel(76)).toBe("Andante");
    expect(getBpmTempoLabel(100)).toBe("Andante");
    expect(getBpmTempoLabel(107)).toBe("Andante");
  });

  it("returns Moderato for values in the 108–119 range", () => {
    expect(getBpmTempoLabel(108)).toBe("Moderato");
    expect(getBpmTempoLabel(119)).toBe("Moderato");
  });

  it("returns Allegro for values in the 120–155 range", () => {
    expect(getBpmTempoLabel(120)).toBe("Allegro");
    expect(getBpmTempoLabel(140)).toBe("Allegro");
    expect(getBpmTempoLabel(155)).toBe("Allegro");
  });

  it("returns Vivace for values in the 156–175 range", () => {
    expect(getBpmTempoLabel(156)).toBe("Vivace");
    expect(getBpmTempoLabel(175)).toBe("Vivace");
  });

  it("returns Presto for values in the 176–199 range", () => {
    expect(getBpmTempoLabel(176)).toBe("Presto");
    expect(getBpmTempoLabel(199)).toBe("Presto");
  });

  it("returns Prestissimo for values in the 200–240 range", () => {
    expect(getBpmTempoLabel(200)).toBe("Prestissimo");
    expect(getBpmTempoLabel(240)).toBe("Prestissimo");
  });

  it("returns Prestissimo for the maximum value (240)", () => {
    expect(getBpmTempoLabel(240)).toBe("Prestissimo");
  });
});
