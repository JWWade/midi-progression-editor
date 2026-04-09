import { describe, expect, it } from "vitest";
import {
  findBestChordIdentity,
  findBestQualityForRoot,
  findChordCandidates,
} from "../chordIdentity";

// ---------------------------------------------------------------------------
// Weighted tone scoring — complete voicings must score exactly 1.0
// ---------------------------------------------------------------------------

describe("weighted scorer — complete voicings score 1.0", () => {
  it("Cmaj7 [0,4,7,11] — all tones present", () => {
    const result = findBestChordIdentity([0, 4, 7, 11]);
    expect(result.root).toBe(0);
    expect(result.quality).toBe("maj7");
    expect(result.matchScore).toBeCloseTo(1, 5);
  });

  it("Cm7 [0,3,7,10] — all tones present", () => {
    const result = findBestChordIdentity([0, 3, 7, 10]);
    expect(result.root).toBe(0);
    expect(result.quality).toBe("min7");
    expect(result.matchScore).toBeCloseTo(1, 5);
  });

  it("C major [0,4,7] — all tones present", () => {
    const result = findBestChordIdentity([0, 4, 7]);
    expect(result.root).toBe(0);
    expect(result.quality).toBe("major");
    expect(result.matchScore).toBeCloseTo(1, 5);
  });
});

// ---------------------------------------------------------------------------
// Weighted scorer — incomplete voicings: best-fit identity with score < 1
// ---------------------------------------------------------------------------

describe("weighted scorer — incomplete voicings get correct identity but score < 1", () => {
  it("Cmaj7 no fifth [0,4,11] — top match is maj7 with matchScore < 1", () => {
    const result = findBestChordIdentity([0, 4, 11]);
    expect(result.root).toBe(0);
    expect(result.quality).toBe("maj7");
    expect(result.matchScore).toBeGreaterThan(0);
    expect(result.matchScore).toBeLessThan(1);
  });

  it("Cmaj7 no fifth [0,4,11] — score is approx 0.88 (third+seventh / totalWeight)", () => {
    // totalWeight = root(1.0) + third(1.0) + fifth(0.4) + seventh(0.9) = 3.3
    // matchedWeight = root(1.0) + third(1.0) + seventh(0.9) = 2.9
    // score = 2.9 / 3.3 ≈ 0.879
    const result = findBestQualityForRoot([0, 4, 11], 0);
    expect(result.quality).toBe("maj7");
    expect(result.matchScore).toBeCloseTo(2.9 / 3.3, 4);
  });

  it("Cm7 no fifth [0,3,10] — top match is min7 with matchScore < 1", () => {
    const result = findBestChordIdentity([0, 3, 10]);
    expect(result.root).toBe(0);
    expect(result.quality).toBe("min7");
    expect(result.matchScore).toBeGreaterThan(0);
    expect(result.matchScore).toBeLessThan(1);
  });

  it("Cm7 no fifth [0,3,10] — score is approx 0.88 (root+third+seventh / totalWeight)", () => {
    // totalWeight = 1.0 + 1.0 + 0.4 + 0.9 = 3.3
    // matchedWeight = root(1.0) + third(1.0) + seventh(0.9) = 2.9
    // score = 2.9 / 3.3 ≈ 0.879
    const result = findBestQualityForRoot([0, 3, 10], 0);
    expect(result.quality).toBe("min7");
    expect(result.matchScore).toBeCloseTo(2.9 / 3.3, 4);
  });
});

// ---------------------------------------------------------------------------
// findChordCandidates — shape, ordering, and option handling
// ---------------------------------------------------------------------------

describe("findChordCandidates", () => {
  it("returns an array sorted by score descending", () => {
    const candidates = findChordCandidates([0, 4, 11]);
    expect(candidates.length).toBeGreaterThan(0);
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].score).toBeGreaterThanOrEqual(candidates[i].score);
    }
  });

  it("[0,4,11] — top candidate is Cmaj7", () => {
    const candidates = findChordCandidates([0, 4, 11], { limit: 3 });
    expect(candidates[0].root).toBe(0);
    expect(candidates[0].quality).toBe("maj7");
  });

  it("[0,4,11] — top candidate score is approx 0.879", () => {
    const candidates = findChordCandidates([0, 4, 11], { limit: 3 });
    expect(candidates[0].score).toBeCloseTo(2.9 / 3.3, 4);
  });

  it("[0,4,11] vs Cmaj7 — missingRoles is [\"fifth\"]", () => {
    const candidates = findChordCandidates([0, 4, 11], { limit: 5 });
    const cmaj7 = candidates.find((c) => c.root === 0 && c.quality === "maj7");
    expect(cmaj7).toBeDefined();
    expect(cmaj7!.missingRoles).toEqual(["fifth"]);
  });

  it("[0,4,7,11] vs Cmaj7 — extraNotes is []", () => {
    const candidates = findChordCandidates([0, 4, 7, 11], { limit: 5 });
    const cmaj7 = candidates.find((c) => c.root === 0 && c.quality === "maj7");
    expect(cmaj7).toBeDefined();
    expect(cmaj7!.extraNotes).toEqual([]);
  });

  it("[0,4,7,11] vs Cmaj7 — missingRoles is []", () => {
    const candidates = findChordCandidates([0, 4, 7, 11], { limit: 5 });
    const cmaj7 = candidates.find((c) => c.root === 0 && c.quality === "maj7");
    expect(cmaj7).toBeDefined();
    expect(cmaj7!.missingRoles).toEqual([]);
  });

  it("respects the limit option", () => {
    const candidates = findChordCandidates([0, 4, 7], { limit: 3 });
    expect(candidates.length).toBeLessThanOrEqual(3);
  });

  it("respects the minScore option — filters out implausible candidates", () => {
    const candidates = findChordCandidates([0, 4, 7], { minScore: 0.95 });
    for (const c of candidates) {
      expect(c.score).toBeGreaterThanOrEqual(0.95);
    }
  });

  it("qualityPool option restricts the search to the given qualities", () => {
    const candidates = findChordCandidates([0, 4, 7, 11], {
      qualityPool: ["maj7", "min7"],
      limit: 10,
    });
    for (const c of candidates) {
      expect(["maj7", "min7"]).toContain(c.quality);
    }
  });

  it("[0,4,9] candidates include both Cmaj6 (root=0) and Am (root=9)", () => {
    // [C, E, A] is a complete Am chord (score 1.0) and an incomplete Cmaj6 (missing G, score ~0.879)
    const candidates = findChordCandidates([0, 4, 9], { limit: 10, minScore: 0.2 });
    const am = candidates.find((c) => c.root === 9 && c.quality === "minor");
    const cmaj6 = candidates.find((c) => c.root === 0 && c.quality === "maj6");
    expect(am).toBeDefined();
    expect(cmaj6).toBeDefined();
  });

  it("[0,4,9] — Am (root=9) scores higher than Cmaj6 (root=0) because Am is a complete match", () => {
    const candidates = findChordCandidates([0, 4, 9], { limit: 10, minScore: 0.2 });
    const am = candidates.find((c) => c.root === 9 && c.quality === "minor")!;
    const cmaj6 = candidates.find((c) => c.root === 0 && c.quality === "maj6")!;
    expect(am.score).toBeCloseTo(1.0, 5); // Am is a complete match
    expect(cmaj6.score).toBeLessThan(am.score);
  });

  it("[0,4,9] — Cmaj6 has missingRoles [\"fifth\"] since G is absent", () => {
    const candidates = findChordCandidates([0, 4, 9], { limit: 10, minScore: 0.2 });
    const cmaj6 = candidates.find((c) => c.root === 0 && c.quality === "maj6")!;
    expect(cmaj6.missingRoles).toEqual(["fifth"]);
  });

  it("[0,4,11] — Am(maj7) ranks lower than Cmaj7", () => {
    const candidates = findChordCandidates([0, 4, 11], { limit: 10, minScore: 0.2 });
    const cmaj7Idx = candidates.findIndex((c) => c.root === 0 && c.quality === "maj7");
    const aminmaj7Idx = candidates.findIndex((c) => c.root === 9 && c.quality === "minmaj7");
    if (aminmaj7Idx !== -1) {
      expect(cmaj7Idx).toBeLessThan(aminmaj7Idx);
    } else {
      // Am(maj7) may be filtered out by minScore — Cmaj7 still at top
      expect(cmaj7Idx).toBe(0);
    }
  });
});
