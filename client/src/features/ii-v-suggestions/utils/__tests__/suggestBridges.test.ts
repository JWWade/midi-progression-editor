import { describe, it, expect } from "vitest";
import type { Chord } from "@/features/current-chord/types";
import type { ScaleContext } from "@/shared/types/ScaleContext";
import { buildDiatonicIIV } from "../buildBridge";
import { suggestBridges } from "../suggestBridges";

// ---------------------------------------------------------------------------
// buildDiatonicIIV
// ---------------------------------------------------------------------------

describe("buildDiatonicIIV", () => {
  it("returns correct ii and V for Cmaj7 (root=0)", () => {
    const target: Chord = { root: 0, quality: "maj7" };
    const result = buildDiatonicIIV(target);
    expect(result.iiRoot).toBe(2);
    expect(result.VRoot).toBe(7);
    expect(result.iiQuality).toBe("min7");
    expect(result.VQuality).toBe("dom7");
  });

  it("returns halfdim7 ii for Dm7 (root=2, minor target)", () => {
    const target: Chord = { root: 2, quality: "min7" };
    const result = buildDiatonicIIV(target);
    expect(result.iiRoot).toBe(4);
    expect(result.VRoot).toBe(9);
    expect(result.iiQuality).toBe("halfdim7");
    expect(result.VQuality).toBe("dom7");
  });

  it("returns halfdim7 ii for D minor (quality 'minor')", () => {
    const target: Chord = { root: 2, quality: "minor" };
    const result = buildDiatonicIIV(target);
    expect(result.iiQuality).toBe("halfdim7");
  });

  it("returns min7 ii for a major target", () => {
    const target: Chord = { root: 7, quality: "major" };
    const result = buildDiatonicIIV(target);
    expect(result.iiQuality).toBe("min7");
  });

  it("wraps correctly for root 11 (B)", () => {
    const target: Chord = { root: 11, quality: "major" };
    const result = buildDiatonicIIV(target);
    // iiRoot = (11 + 2) % 12 = 1
    expect(result.iiRoot).toBe(1);
    // VRoot = (11 + 7) % 12 = 6
    expect(result.VRoot).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// suggestBridges
// ---------------------------------------------------------------------------

describe("suggestBridges", () => {
  it("returns [] when source and target are identical", () => {
    const chord: Chord = { root: 0, quality: "major" };
    expect(suggestBridges(chord, chord)).toEqual([]);
  });

  it("returns [] for identical root and quality even with different objects", () => {
    const source: Chord = { root: 5, quality: "min7" };
    const target: Chord = { root: 5, quality: "min7" };
    expect(suggestBridges(source, target)).toEqual([]);
  });

  it("returns at most topN suggestions (default 3)", () => {
    const source: Chord = { root: 2, quality: "min7" }; // Dm7
    const target: Chord = { root: 7, quality: "dom7" }; // G7
    const result = suggestBridges(source, target);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("respects a custom topN value", () => {
    const source: Chord = { root: 0, quality: "major" };
    const target: Chord = { root: 5, quality: "major" };
    const result = suggestBridges(source, target, null, 2, 1);
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it("never returns a bridge where first === source and last === target", () => {
    const source: Chord = { root: 2, quality: "min7" };
    const target: Chord = { root: 7, quality: "dom7" };
    const result = suggestBridges(source, target, null, 4);
    for (const suggestion of result) {
      const { bridge } = suggestion;
      if (bridge.length > 0) {
        const first = bridge[0];
        const last = bridge[bridge.length - 1];
        const isTrivial =
          first.root === source.root &&
          first.quality === source.quality &&
          last.root === target.root &&
          last.quality === target.quality;
        expect(isTrivial).toBe(false);
      }
    }
  });

  it("Dm7 and G7 in C major: top bridge suggestion is diatonic-ii-v with Am7 and D7", () => {
    // Dm7 (root=2) → G7 (root=7), C major scale
    const source: Chord = { root: 2, quality: "min7" };
    const target: Chord = { root: 7, quality: "dom7" };
    const scale: ScaleContext = { root: 0, mode: "major" };

    const result = suggestBridges(source, target, scale, 2, 3);
    expect(result.length).toBeGreaterThan(0);

    const top = result[0];
    expect(top.type).toBe("diatonic-ii-v");
    // ii of G7 is Am7 (root=9), V of G7 is D7 (root=2)
    expect(top.bridge).toHaveLength(2);
    expect(top.bridge[0].root).toBe(9); // Am7
    expect(top.bridge[0].quality).toBe("min7");
    expect(top.bridge[1].root).toBe(2); // D7
    expect(top.bridge[1].quality).toBe("dom7");
  });

  it("G7 → Cmaj: diatonic-ii-v candidate has bridge [Dm7 (root=2), G7 (root=7)]", () => {
    const source: Chord = { root: 7, quality: "dom7" }; // G7
    const target: Chord = { root: 0, quality: "major" }; // C
    const scale: ScaleContext = { root: 0, mode: "major" };

    const result = suggestBridges(source, target, scale, 2, 5);

    const diatonicCandidate = result.find((s) => s.type === "diatonic-ii-v");
    expect(diatonicCandidate).toBeDefined();
    expect(diatonicCandidate!.bridge).toHaveLength(2);
    expect(diatonicCandidate!.bridge[0].root).toBe(2); // Dm7
    expect(diatonicCandidate!.bridge[0].quality).toBe("min7");
    expect(diatonicCandidate!.bridge[1].root).toBe(7); // G7
    expect(diatonicCandidate!.bridge[1].quality).toBe("dom7");
  });

  it("produces suggestions sorted descending by score", () => {
    const source: Chord = { root: 0, quality: "maj7" };
    const target: Chord = { root: 5, quality: "maj7" };
    const result = suggestBridges(source, target, null, 2, 5);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
    }
  });

  it("scores are normalised in [0, 1]", () => {
    const source: Chord = { root: 0, quality: "major" };
    const target: Chord = { root: 7, quality: "dom7" };
    const result = suggestBridges(source, target);
    for (const s of result) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(1);
    }
  });

  it("deduplicates bridges with identical root+quality sequences", () => {
    const source: Chord = { root: 0, quality: "major" };
    const target: Chord = { root: 7, quality: "dom7" };
    const result = suggestBridges(source, target, null, 4, 20);
    const keys = result.map((s) =>
      s.bridge.map((c) => `${c.root}:${c.quality}`).join("|"),
    );
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("each suggestion has label and explanation strings", () => {
    const source: Chord = { root: 0, quality: "major" };
    const target: Chord = { root: 5, quality: "major" };
    const result = suggestBridges(source, target);
    for (const s of result) {
      expect(typeof s.label).toBe("string");
      expect(s.label.length).toBeGreaterThan(0);
      expect(typeof s.explanation).toBe("string");
      expect(s.explanation.length).toBeGreaterThan(0);
    }
  });

  it("respects maxBridgeLength=1: all bridges have length 1", () => {
    const source: Chord = { root: 0, quality: "major" };
    const target: Chord = { root: 5, quality: "major" };
    const result = suggestBridges(source, target, null, 1, 5);
    for (const s of result) {
      expect(s.bridge).toHaveLength(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Transposition invariance property test
// ---------------------------------------------------------------------------

describe("suggestBridges — transposition invariance", () => {
  it("transposing both chords by +5 semitones preserves relative ranking order", () => {
    const source: Chord = { root: 2, quality: "min7" }; // Dm7
    const target: Chord = { root: 7, quality: "dom7" }; // G7

    const sourceT: Chord = { root: (source.root + 5) % 12, quality: source.quality };
    const targetT: Chord = { root: (target.root + 5) % 12, quality: target.quality };

    const original = suggestBridges(source, target, null, 4, 5);
    const transposed = suggestBridges(sourceT, targetT, null, 4, 5);

    // Both should return the same number of suggestions
    expect(transposed.length).toBe(original.length);

    // The ranking order (by type) should be preserved
    const originalTypes = original.map((s) => s.type);
    const transposedTypes = transposed.map((s) => s.type);
    expect(transposedTypes).toEqual(originalTypes);
  });
});
