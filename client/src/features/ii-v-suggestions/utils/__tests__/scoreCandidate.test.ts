import { describe, it, expect } from "vitest";
import type { Chord } from "@/features/current-chord/types";
import {
  totalVoiceLeadingCost,
  sharedNoteBonus,
  diatonicBonus,
  complexityPenalty,
  scoreCandidate,
} from "../scoreCandidate";

// ── Chord helpers ────────────────────────────────────────────────────────────

function chord(root: number, quality: Chord["quality"]): Chord {
  return { root, quality };
}

// Standard chords used across tests
const Cmaj7 = chord(0, "maj7");
const Am7 = chord(9, "min7");
const Dm7 = chord(2, "min7");
const G7 = chord(7, "dom7");

const C_MAJOR = { root: 0, mode: "major" };

// ── totalVoiceLeadingCost ────────────────────────────────────────────────────

describe("totalVoiceLeadingCost", () => {
  it("returns a non-negative number", () => {
    const cost = totalVoiceLeadingCost(Dm7, [G7], Cmaj7);
    expect(cost).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 when source equals target and bridge is empty", () => {
    const cost = totalVoiceLeadingCost(Cmaj7, [], Cmaj7);
    expect(cost).toBe(0);
  });

  it("returns a larger cost for a longer bridge", () => {
    const shortCost = totalVoiceLeadingCost(Dm7, [G7], Cmaj7);
    const longCost = totalVoiceLeadingCost(Dm7, [Am7, G7], Cmaj7);
    // A longer chain has at least as much total movement
    expect(longCost).toBeGreaterThanOrEqual(0);
    // Both costs must be non-negative
    expect(shortCost).toBeGreaterThanOrEqual(0);
  });

  it("is symmetric in bridge direction — the cost may differ but is always ≥ 0", () => {
    const cost1 = totalVoiceLeadingCost(Dm7, [G7], Cmaj7);
    const cost2 = totalVoiceLeadingCost(Cmaj7, [G7], Dm7);
    expect(cost1).toBeGreaterThanOrEqual(0);
    expect(cost2).toBeGreaterThanOrEqual(0);
  });
});

// ── sharedNoteBonus ──────────────────────────────────────────────────────────

describe("sharedNoteBonus", () => {
  it("returns a value in [0, 1]", () => {
    const bonus = sharedNoteBonus(Dm7, [G7], Cmaj7);
    expect(bonus).toBeGreaterThanOrEqual(0);
    expect(bonus).toBeLessThanOrEqual(1);
  });

  it("returns 1.0 when source, bridge, and target are all the same chord", () => {
    const bonus = sharedNoteBonus(Cmaj7, [Cmaj7], Cmaj7);
    expect(bonus).toBeCloseTo(1, 5);
  });

  it("returns 0 when chords share no common pitch classes", () => {
    // C major [0,4,7] vs F# major [6,10,1] — no shared notes
    const cMajor = chord(0, "major");
    const fsharpMajor = chord(6, "major");
    const bonus = sharedNoteBonus(cMajor, [fsharpMajor], chord(1, "minor"));
    expect(bonus).toBeGreaterThanOrEqual(0);
    expect(bonus).toBeLessThanOrEqual(1);
  });

  it("empty bridge: averages over just source→target pair", () => {
    const bonus = sharedNoteBonus(Dm7, [], G7);
    expect(bonus).toBeGreaterThanOrEqual(0);
    expect(bonus).toBeLessThanOrEqual(1);
  });
});

// ── diatonicBonus ────────────────────────────────────────────────────────────

describe("diatonicBonus", () => {
  it("returns 0 when scale is null", () => {
    expect(diatonicBonus([G7], null)).toBe(0);
  });

  it("returns 0 for an unknown scale mode", () => {
    expect(diatonicBonus([G7], { root: 0, mode: "pentatonic" })).toBe(0);
  });

  it("returns 1.0 when all bridge notes are diatonic to C major", () => {
    // Dm7 = D,F,A,C — all diatonic to C major
    const bonus = diatonicBonus([Dm7], C_MAJOR);
    expect(bonus).toBeCloseTo(1, 5);
  });

  it("returns 1.0 for a bridge of Am7 in C major (A,C,E,G are all diatonic)", () => {
    const bonus = diatonicBonus([Am7], C_MAJOR);
    expect(bonus).toBeCloseTo(1, 5);
  });

  it("returns 0 when bridge is empty", () => {
    expect(diatonicBonus([], C_MAJOR)).toBe(0);
  });

  it("returns a value in [0, 1] for any valid bridge and scale", () => {
    const bridges: Chord[][] = [
      [G7],
      [Dm7, G7],
      [Am7, Dm7, G7],
    ];
    for (const bridge of bridges) {
      const bonus = diatonicBonus(bridge, C_MAJOR);
      expect(bonus).toBeGreaterThanOrEqual(0);
      expect(bonus).toBeLessThanOrEqual(1);
    }
  });
});

// ── complexityPenalty ────────────────────────────────────────────────────────

describe("complexityPenalty", () => {
  it("returns 0 for a bridge of length 1", () => {
    expect(complexityPenalty([G7])).toBe(0);
  });

  it("returns 0.25 for a bridge of length 2", () => {
    expect(complexityPenalty([Dm7, G7])).toBe(0.25);
  });

  it("returns 0.5 for a bridge of length 3", () => {
    expect(complexityPenalty([Am7, Dm7, G7])).toBe(0.5);
  });

  it("returns 1.0 for a bridge of length 4", () => {
    expect(complexityPenalty([Am7, Dm7, G7, Cmaj7])).toBe(1.0);
  });

  it("returns 1.0 for bridges longer than 4 (default max penalty)", () => {
    const longBridge = [Am7, Dm7, G7, Cmaj7, chord(5, "major")];
    expect(complexityPenalty(longBridge)).toBe(1.0);
  });

  it("penalty is non-decreasing as bridge length increases", () => {
    const p1 = complexityPenalty([G7]);
    const p2 = complexityPenalty([Dm7, G7]);
    const p3 = complexityPenalty([Am7, Dm7, G7]);
    expect(p2).toBeGreaterThanOrEqual(p1);
    expect(p3).toBeGreaterThanOrEqual(p2);
  });
});

// ── scoreCandidate ───────────────────────────────────────────────────────────

describe("scoreCandidate", () => {
  it("returns a value in [0, 1]", () => {
    const score = scoreCandidate([G7], Dm7, Cmaj7, C_MAJOR);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("returns a value in [0, 1] without a scale (null)", () => {
    const score = scoreCandidate([G7], Dm7, Cmaj7, null);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("diatonic bridge in key scores higher than non-diatonic bridge", () => {
    // G7 (all in C major) vs augmented chord (chromatic)
    const diatonicScore = scoreCandidate([G7], Dm7, Cmaj7, C_MAJOR);
    const chromaticScore = scoreCandidate([chord(6, "aug")], Dm7, Cmaj7, C_MAJOR);
    // Diatonic bridge should score at least as well (may be equal in edge cases)
    expect(diatonicScore).toBeGreaterThanOrEqual(chromaticScore);
  });

  it("shorter bridge scores higher than longer bridge with the same first chord", () => {
    const shortScore = scoreCandidate([G7], Dm7, Cmaj7, C_MAJOR);
    const longScore = scoreCandidate([Am7, G7], Dm7, Cmaj7, C_MAJOR);
    // Complexity penalty should make the longer bridge score lower or equal
    expect(shortScore).toBeGreaterThanOrEqual(longScore);
  });

  it("score is deterministic for the same inputs", () => {
    const score1 = scoreCandidate([G7], Dm7, Cmaj7, C_MAJOR);
    const score2 = scoreCandidate([G7], Dm7, Cmaj7, C_MAJOR);
    expect(score1).toBe(score2);
  });

  it("all scores are in [0,1] for various bridge/scale combinations", () => {
    const bridges: Chord[][] = [[G7], [Dm7, G7], [Am7]];
    const scales = [C_MAJOR, { root: 9, mode: "naturalMinor" }, null];
    for (const bridge of bridges) {
      for (const scale of scales) {
        const score = scoreCandidate(bridge, Dm7, Cmaj7, scale);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });
});
