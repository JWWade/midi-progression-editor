import { describe, expect, it } from "vitest";
import { resolveChordIdentity, formatChordSymbol, formatChordName } from "../chordName";

describe("resolveChordIdentity", () => {
  it("detects D-A-C# as Dmaj7-family identity when root is D", () => {
    const resolved = resolveChordIdentity({
      root: 2,
      quality: "major",
      customNotes: [2, 9, 1],
    });

    expect(resolved.root).toBe(2);
    expect(resolved.quality).toBe("maj7");
  });

  it("keeps exact custom matches stable (example: quartal)", () => {
    const resolved = resolveChordIdentity({
      root: 7,
      quality: "quartal",
      customNotes: [7, 0, 5],
    });

    expect(resolved.root).toBe(7);
    expect(resolved.quality).toBe("quartal");
    expect(resolved.extensions).toBeUndefined();
  });

  it("treats root+M2+M3 as a tertian chord with a 9th extension", () => {
    // A#-C-D: keep the major-third context and treat the M2 as a 9th.
    const resolved = resolveChordIdentity({
      root: 10,
      quality: "major",
      customNotes: [10, 0, 2],
    });

    expect(resolved.root).toBe(10);
    expect(resolved.quality).toBe("major");
    expect(resolved.extensions).toEqual(["9"]);
  });

  it("recontextualizes D-E-F# as D with a 9th, not Dsus2", () => {
    const resolved = resolveChordIdentity({
      root: 2,
      quality: "major",
      customNotes: [2, 4, 6],
    });

    expect(resolved.root).toBe(2);
    expect(resolved.quality).toBe("major");
    expect(resolved.extensions).toEqual(["9"]);
  });

  it("prefers D(add11) over Gmaj7 when the ordered custom root is D", () => {
    const resolved = resolveChordIdentity({
      root: 7,
      quality: "maj7",
      customNotes: [2, 6, 7],
    });

    expect(resolved.root).toBe(2);
    expect(resolved.quality).toBe("major");
    expect(resolved.extensions).toEqual(["11"]);
  });

  it("detects b9 extension on chromatic cluster (F#-G-G#)", () => {
    // F# + G#(M2) = sus2 core; G(m2) = b9 extension
    const resolved = resolveChordIdentity({
      root: 6,
      quality: "major",
      customNotes: [6, 7, 8],
    });

    expect(resolved.root).toBe(6);
    expect(resolved.quality).toBe("sus2");
    expect(resolved.extensions).toEqual(["b9"]);
  });
});

describe("formatChordSymbol with extensions", () => {
  it("appends extension labels in parens for custom chords", () => {
    // F#-G-G# → F#sus2(b9)
    const symbol = formatChordSymbol({
      root: 6,
      quality: "major",
      customNotes: [6, 7, 8],
    });
    expect(symbol).toBe("F#sus2(b9)");
  });

  it("formats root+M2+M3 as add9 rather than sus2", () => {
    const symbol = formatChordSymbol({
      root: 2,
      quality: "major",
      customNotes: [2, 4, 6],
    });
    expect(symbol).toBe("D(9)");
  });

  it("formats D-F#-G as D(11) instead of Gmaj7", () => {
    const symbol = formatChordSymbol({
      root: 7,
      quality: "maj7",
      customNotes: [2, 6, 7],
    });
    expect(symbol).toBe("D(11)");
  });

  it("returns plain symbol for exact custom chord with no extensions", () => {
    // G-C-F = G quartal, exact match
    const symbol = formatChordSymbol({
      root: 7,
      quality: "major",
      customNotes: [7, 0, 5],
    });
    expect(symbol).toBe("Gq");
  });
});

describe("formatChordName with extensions", () => {
  it("appends (add ...) for custom chords with extensions", () => {
    const name = formatChordName({
      root: 6,
      quality: "major",
      customNotes: [6, 7, 8],
    });
    expect(name).toBe("F# Suspended 2 (add b9)");
  });

  it("formats D-E-F# as D Major with an added 9th", () => {
    const name = formatChordName({
      root: 2,
      quality: "major",
      customNotes: [2, 4, 6],
    });
    expect(name).toBe("D Major (add 9)");
  });

  it("formats D-F#-G as D Major with an added 11th", () => {
    const name = formatChordName({
      root: 7,
      quality: "maj7",
      customNotes: [2, 6, 7],
    });
    expect(name).toBe("D Major (add 11)");
  });
});
