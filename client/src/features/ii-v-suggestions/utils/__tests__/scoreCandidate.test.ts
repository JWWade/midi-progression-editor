import { describe, it, expect } from "vitest";
import {
  totalVoiceLeadingCost,
  sharedNoteBonus,
  diatonicBonus,
  complexityPenalty,
  scoreCandidate,
} from "../scoreCandidate";
import type { Chord } from "@/features/current-chord/types";

// ── Chord fixtures ──────────────────────────────────────────────────────────

const Cmaj7: Chord = { root: 0, quality: "maj7" };
const Dm7: Chord = { root: 2, quality: "min7" };
const G7: Chord = { root: 7, quality: "dom7" };
const Am7: Chord = { root: 9, quality: "min7" };
const Fmaj: Chord = { root: 5, quality: "major" };

const C_MAJOR_SCALE = { root: 0, mode: "major" };

// ── totalVoiceLeadingCost ───────────────────────────────────────────────────

describe("totalVoiceLeadingCost", () => {
  it("returns 0 for a direct same-chord transition (no bridge)", () => {
    expect(totalVoiceLeadingCost(Cmaj7, [], Cmaj7)).toBe(0);
  });

  it("returns a non-negative cost for any valid transition", () => {
    const cost = totalVoiceLeadingCost(Cmaj7, [Dm7], G7);
    expect(cost).toBeGreaterThanOrEqual(0);
  });

  it("returns a higher cost for a longer bridge than a shorter one (same endpoints)", () => {
    const shortBridge = [G7];
    const longBridge = [Dm7, G7];
    const costShort = totalVoiceLeadingCost(Am7, shortBridge, Cmaj7);
    const costLong = totalVoiceLeadingCost(Am7, longBridge, Cmaj7);
    // More transitions in a longer bridge generally mean more total motion
    expect(costLong).toBeGreaterThanOrEqual(costShort);
  });

  it("returns 0 when bridge chord pitch classes are empty (custom empty chord)", () => {
    const emptyChord: Chord = { root: 0, quality: "major", customNotes: [] };
    const cost = totalVoiceLeadingCost(emptyChord, [], Cmaj7);
    expect(cost).toBe(0);
  });
});

// ── sharedNoteBonus ─────────────────────────────────────────────────────────

describe("sharedNoteBonus", () => {
  it("returns a value in [0, 1] for a typical progression", () => {
    const bonus = sharedNoteBonus(Am7, [Dm7, G7], Cmaj7);
    expect(bonus).toBeGreaterThanOrEqual(0);
    expect(bonus).toBeLessThanOrEqual(1);
  });

  it("returns 1 when source, bridge, and target are all the same chord", () => {
    // All adjacent pairs are identical → proportion = 1 for each pair
    const bonus = sharedNoteBonus(Cmaj7, [Cmaj7], Cmaj7);
    expect(bonus).toBe(1);
  });

  it("returns 0 when bridge and both endpoints share no pitch classes with their neighbours", () => {
    // C major [0,4,7] vs F# major [6,10,1] — no shared notes in either adjacent pair
    // Chain: [Cma, FsMaj, Cma] — both pairs (Cma↔FsMaj) have 0 shared notes
    const Cma: Chord = { root: 0, quality: "major" };
    const FsMaj: Chord = { root: 6, quality: "major" };
    const bonus = sharedNoteBonus(Cma, [FsMaj], Cma);
    expect(bonus).toBe(0);
  });

  it("returns a value in [0, 1] with empty bridge", () => {
    const bonus = sharedNoteBonus(Dm7, [], G7);
    expect(bonus).toBeGreaterThanOrEqual(0);
    expect(bonus).toBeLessThanOrEqual(1);
  });
});

// ── diatonicBonus ───────────────────────────────────────────────────────────

describe("diatonicBonus", () => {
  it("returns 0 when scale is null", () => {
    expect(diatonicBonus([Dm7, G7], null)).toBe(0);
  });

  it("returns 0 for an unknown mode string", () => {
    expect(diatonicBonus([Dm7, G7], { root: 0, mode: "pentatonic" })).toBe(0);
  });

  it("returns a value in [0, 1] for a known scale", () => {
    const bonus = diatonicBonus([Dm7, G7], C_MAJOR_SCALE);
    expect(bonus).toBeGreaterThanOrEqual(0);
    expect(bonus).toBeLessThanOrEqual(1);
  });

  it("returns 1 when all bridge chord tones are diatonic to C major", () => {
    // Dm7 (D,F,A,C) and G7 (G,B,D,F) are fully diatonic to C major
    const bonus = diatonicBonus([Dm7, G7], C_MAJOR_SCALE);
    expect(bonus).toBe(1);
  });

  it("returns 0 for an empty bridge", () => {
    // No chord tones → totalCount = 0 → returns 0
    expect(diatonicBonus([], C_MAJOR_SCALE)).toBe(0);
  });

  it("is lower when bridge contains chromatic chords", () => {
    // Db major [1,5,8] has mostly chromatic notes against C major
    const DbMaj: Chord = { root: 1, quality: "major" };
    const chromaticBonus = diatonicBonus([DbMaj], C_MAJOR_SCALE);
    const diatonicBonusVal = diatonicBonus([Fmaj], C_MAJOR_SCALE);
    expect(chromaticBonus).toBeLessThan(diatonicBonusVal);
  });
});

// ── complexityPenalty ───────────────────────────────────────────────────────

describe("complexityPenalty", () => {
  it("returns 0 for a 1-chord bridge", () => {
    expect(complexityPenalty([G7])).toBe(0);
  });

  it("returns 0.25 for a 2-chord bridge", () => {
    expect(complexityPenalty([Dm7, G7])).toBe(0.25);
  });

  it("returns 0.5 for a 3-chord bridge", () => {
    expect(complexityPenalty([Am7, Dm7, G7])).toBe(0.5);
  });

  it("returns 1.0 for a 4-chord bridge", () => {
    expect(complexityPenalty([Am7, Dm7, G7, Fmaj])).toBe(1.0);
  });

  it("penalty increases (or stays equal) as bridge length increases", () => {
    const p1 = complexityPenalty([G7]);
    const p2 = complexityPenalty([Dm7, G7]);
    const p3 = complexityPenalty([Am7, Dm7, G7]);
    expect(p2).toBeGreaterThan(p1);
    expect(p3).toBeGreaterThan(p2);
  });
});

// ── scoreCandidate ──────────────────────────────────────────────────────────

describe("scoreCandidate", () => {
  it("returns a value in [0, 1] for a typical ii-V bridge in C major", () => {
    const score = scoreCandidate([Dm7, G7], Am7, Cmaj7, C_MAJOR_SCALE);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("returns a value in [0, 1] when scale is null", () => {
    const score = scoreCandidate([Dm7, G7], Am7, Cmaj7, null);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("returns a value in [0, 1] for all 8 chord types as source and target", () => {
    const qualities: Chord["quality"][] = [
      "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7",
    ];
    for (const srcQuality of qualities) {
      for (const tgtQuality of qualities) {
        const src: Chord = { root: 0, quality: srcQuality };
        const tgt: Chord = { root: 5, quality: tgtQuality };
        const score = scoreCandidate([G7], src, tgt, null);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });

  it("score with diatonic scale is >= score without scale (diatonic bonus never hurts)", () => {
    // diatonicBonus contributes +0.2 weight to the raw score; scale=null gives 0 diatonic bonus.
    // Therefore scoreCandidate(..., scale) >= scoreCandidate(..., null) always holds.
    const withScale = scoreCandidate([Dm7, G7], Am7, Cmaj7, C_MAJOR_SCALE);
    const withoutScale = scoreCandidate([Dm7, G7], Am7, Cmaj7, null);
    expect(withScale).toBeGreaterThanOrEqual(withoutScale);
  });

  it("never returns a negative score regardless of bridge/scale combination", () => {
    // Use a distant chromatic chord as bridge — heavy VL cost should clamp to 0
    const DbMaj: Chord = { root: 1, quality: "major" };
    const score = scoreCandidate([DbMaj], Cmaj7, G7, C_MAJOR_SCALE);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
