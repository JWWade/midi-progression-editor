import { describe, it, expect } from "vitest";
import { getBpmTempoLabel, getTempoMarkingMin, getTempoMarkingMax, getRandomBpmInRange } from "./bpmTempoLabel";

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

describe("getTempoMarkingMin", () => {
  it("returns 40 for Largo", () => {
    expect(getTempoMarkingMin("Largo")).toBe(40);
  });

  it("returns 60 for Adagio", () => {
    expect(getTempoMarkingMin("Adagio")).toBe(60);
  });

  it("returns 76 for Andante", () => {
    expect(getTempoMarkingMin("Andante")).toBe(76);
  });

  it("returns 108 for Moderato", () => {
    expect(getTempoMarkingMin("Moderato")).toBe(108);
  });

  it("returns 120 for Allegro", () => {
    expect(getTempoMarkingMin("Allegro")).toBe(120);
  });

  it("returns 156 for Vivace", () => {
    expect(getTempoMarkingMin("Vivace")).toBe(156);
  });

  it("returns 176 for Presto", () => {
    expect(getTempoMarkingMin("Presto")).toBe(176);
  });

  it("returns 200 for Prestissimo", () => {
    expect(getTempoMarkingMin("Prestissimo")).toBe(200);
  });

  it("is case-insensitive", () => {
    expect(getTempoMarkingMin("largo")).toBe(40);
    expect(getTempoMarkingMin("ALLEGRO")).toBe(120);
  });

  it("throws for an unknown label", () => {
    expect(() => getTempoMarkingMin("Fortissimo")).toThrow();
  });
});

describe("getTempoMarkingMax", () => {
  it("returns Infinity for Prestissimo (fastest marking)", () => {
    expect(getTempoMarkingMax("Prestissimo")).toBe(Infinity);
  });

  it("returns 200 for Presto (exclusive upper bound = next marking's min)", () => {
    expect(getTempoMarkingMax("Presto")).toBe(200);
  });

  it("returns 176 for Vivace", () => {
    expect(getTempoMarkingMax("Vivace")).toBe(176);
  });

  it("returns 156 for Allegro", () => {
    expect(getTempoMarkingMax("Allegro")).toBe(156);
  });

  it("returns 120 for Moderato", () => {
    expect(getTempoMarkingMax("Moderato")).toBe(120);
  });

  it("returns 108 for Andante", () => {
    expect(getTempoMarkingMax("Andante")).toBe(108);
  });

  it("returns 76 for Adagio", () => {
    expect(getTempoMarkingMax("Adagio")).toBe(76);
  });

  it("returns 60 for Largo", () => {
    expect(getTempoMarkingMax("Largo")).toBe(60);
  });

  it("throws for an unknown label", () => {
    expect(() => getTempoMarkingMax("Fortissimo")).toThrow();
  });
});

describe("getRandomBpmInRange", () => {
  it("returns an integer within the Adagio range [60, 75]", () => {
    for (let i = 0; i < 20; i++) {
      const bpm = getRandomBpmInRange("Adagio", "Adagio");
      expect(Number.isInteger(bpm)).toBe(true);
      expect(bpm).toBeGreaterThanOrEqual(60);
      expect(bpm).toBeLessThanOrEqual(75);
    }
  });

  it("returns an integer within the Allegro–Presto range [120, 199]", () => {
    for (let i = 0; i < 20; i++) {
      const bpm = getRandomBpmInRange("Allegro", "Presto");
      expect(Number.isInteger(bpm)).toBe(true);
      expect(bpm).toBeGreaterThanOrEqual(120);
      expect(bpm).toBeLessThanOrEqual(199);
    }
  });

  it("returns exactly the single value when min and max collapse to one BPM", () => {
    // Largo: 40–59. getTempoMarkingMin("Largo")=40, getTempoMarkingMax("Largo")=60 → inclusive upper=59
    for (let i = 0; i < 10; i++) {
      const bpm = getRandomBpmInRange("Largo", "Largo");
      expect(bpm).toBeGreaterThanOrEqual(40);
      expect(bpm).toBeLessThanOrEqual(59);
    }
  });

  it("throws when minLabel is faster than maxLabel (invalid range)", () => {
    expect(() => getRandomBpmInRange("Presto", "Adagio")).toThrow();
  });

  it("throws for an unknown label", () => {
    expect(() => getRandomBpmInRange("Fortissimo", "Allegro")).toThrow();
  });
});
