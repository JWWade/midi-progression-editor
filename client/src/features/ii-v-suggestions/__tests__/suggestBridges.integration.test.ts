/**
 * Integration tests for the suggestBridges engine.
 * Covers multi-chord progression inputs, edge cases, and test-vector correctness.
 */

import { describe, it, expect } from "vitest";
import type { Chord } from "@/features/current-chord/types";
import type { ScaleContext } from "@/shared/types/ScaleContext";
import { suggestBridges } from "@/features/ii-v-suggestions";
import { getChordPitchClasses } from "@/features/chord/utils";

// ── Chord fixtures ──────────────────────────────────────────────────────────

const Cmaj7: Chord = { root: 0, quality: "maj7" };
const Am7: Chord = { root: 9, quality: "min7" };

// ── Scale fixtures ──────────────────────────────────────────────────────────

const C_MAJOR: ScaleContext = { root: 0, mode: "major" };

// ── 1. Bridge within cap ────────────────────────────────────────────────────

describe("suggestBridges integration — bridge within cap", () => {
  it("Am7 → Cmaj7 in C major returns at least one 'ii-V' candidate with non-negative score", () => {
    const results = suggestBridges(Am7, Cmaj7, C_MAJOR, 2);
    const iiVCandidates = results.filter(
      (s) => s.type === "diatonic-ii-v" || s.type === "tritone-sub-ii-v" || s.type === "chromatic-ii-v",
    );
    expect(iiVCandidates.length).toBeGreaterThan(0);
    expect(iiVCandidates[0].score).toBeGreaterThanOrEqual(0);
  });

  it("returns a diatonic-ii-v candidate specifically", () => {
    const results = suggestBridges(Am7, Cmaj7, C_MAJOR, 2);
    const diatonic = results.find((s) => s.type === "diatonic-ii-v");
    expect(diatonic).toBeDefined();
  });
});

// ── 2. Bridge exceeding cap ─────────────────────────────────────────────────

describe("suggestBridges integration — bridge exceeding cap", () => {
  it("maxBridgeLength=0 returns an empty array", () => {
    const results = suggestBridges(Am7, Cmaj7, C_MAJOR, 0);
    expect(results).toEqual([]);
  });

  it("maxBridgeLength=0 returns empty for any source/target pair", () => {
    const source: Chord = { root: 2, quality: "min7" };
    const target: Chord = { root: 7, quality: "dom7" };
    expect(suggestBridges(source, target, null, 0)).toEqual([]);
  });
});

// ── 3. Non-7-note scale ─────────────────────────────────────────────────────

describe("suggestBridges integration — non-7-note scale", () => {
  it("unknown mode string returns results without throwing", () => {
    const pentatonicLike = { root: 0, mode: "pentatonic" } as unknown as ScaleContext;
    expect(() => suggestBridges(Am7, Cmaj7, pentatonicLike, 2)).not.toThrow();
  });

  it("unknown mode yields same results as scale=null (no diatonic bonus)", () => {
    const pentatonicLike = { root: 0, mode: "pentatonic" } as unknown as ScaleContext;
    const withUnknown = suggestBridges(Am7, Cmaj7, pentatonicLike, 2);
    const withNull = suggestBridges(Am7, Cmaj7, null, 2);
    expect(withUnknown.length).toBe(withNull.length);
    // Bridge structures should be identical (same candidates, same order)
    for (let i = 0; i < withUnknown.length; i++) {
      expect(withUnknown[i].type).toBe(withNull[i].type);
    }
  });
});

// ── 4. Single-chord progression ─────────────────────────────────────────────

describe("suggestBridges integration — single-chord progression", () => {
  it("source === target returns an empty array", () => {
    expect(suggestBridges(Cmaj7, Cmaj7, null, 2)).toEqual([]);
  });

  it("source === target (same root+quality) returns empty even with different object refs", () => {
    const a: Chord = { root: 9, quality: "min7" };
    const b: Chord = { root: 9, quality: "min7" };
    expect(suggestBridges(a, b, null, 2)).toEqual([]);
  });
});

// ── 5. Test vectors from spike §9.2 ─────────────────────────────────────────
//
// ii–V bridge from Am7 (root=9) → Cmaj7 (root=0):
//   bridge = [Dm7, G7]
//   Dm7 pitch classes = {2, 5, 9, 0} (D, F, A, C)
//   G7  pitch classes = {7, 11, 2, 5} (G, B, D, F)

describe("suggestBridges integration — test vectors (Am7 → Cmaj7)", () => {
  it("diatonic-ii-v bridge is [Dm7, G7] (roots 2 and 7)", () => {
    const results = suggestBridges(Am7, Cmaj7, C_MAJOR, 2);
    const diatonic = results.find((s) => s.type === "diatonic-ii-v");
    expect(diatonic).toBeDefined();
    expect(diatonic!.bridge).toHaveLength(2);
    expect(diatonic!.bridge[0].root).toBe(2);   // Dm7
    expect(diatonic!.bridge[0].quality).toBe("min7");
    expect(diatonic!.bridge[1].root).toBe(7);   // G7
    expect(diatonic!.bridge[1].quality).toBe("dom7");
  });

  it("Dm7 pitch classes include D(2), F(5), A(9), C(0)", () => {
    const dm7: Chord = { root: 2, quality: "min7" };
    const pcs = getChordPitchClasses(dm7);
    expect(pcs).toContain(2);  // D
    expect(pcs).toContain(5);  // F
    expect(pcs).toContain(9);  // A
    expect(pcs).toContain(0);  // C
  });

  it("G7 pitch classes are {7, 11, 2, 5} (G, B, D, F)", () => {
    const g7: Chord = { root: 7, quality: "dom7" };
    const pcs = getChordPitchClasses(g7);
    expect(pcs).toEqual([7, 11, 2, 5]);
  });

  it("bridge score is in range [0, 1]", () => {
    const results = suggestBridges(Am7, Cmaj7, C_MAJOR, 2);
    const diatonic = results.find((s) => s.type === "diatonic-ii-v");
    expect(diatonic).toBeDefined();
    expect(diatonic!.score).toBeGreaterThanOrEqual(0);
    expect(diatonic!.score).toBeLessThanOrEqual(1);
  });
});
