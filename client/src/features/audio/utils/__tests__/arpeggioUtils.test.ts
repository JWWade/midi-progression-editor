import { describe, it, expect } from "vitest";
import {
  applyArpeggioDirection,
  applyRepeats,
  generateArpeggioSequence,
  getSubdivisionBeats,
  computeArpeggioStartOffsets,
} from "../arpeggioUtils";
import type { ArpeggioPattern } from "../../types/arpeggioPattern";

// ── Fixtures ────────────────────────────────────────────────────────────────

const CMaj = [
  { index: 0 },  // C
  { index: 4 },  // E
  { index: 7 },  // G
];

const CMaj7 = [
  { index: 0 },  // C
  { index: 4 },  // E
  { index: 7 },  // G
  { index: 11 }, // B
];

// ── applyArpeggioDirection ───────────────────────────────────────────────────

describe("applyArpeggioDirection", () => {
  it("'up' returns notes sorted ascending by index", () => {
    const unsorted = [{ index: 7 }, { index: 0 }, { index: 4 }];
    expect(applyArpeggioDirection(unsorted, "up")).toEqual([
      { index: 0 },
      { index: 4 },
      { index: 7 },
    ]);
  });

  it("'down' returns notes sorted descending", () => {
    expect(applyArpeggioDirection(CMaj, "down")).toEqual([
      { index: 7 },
      { index: 4 },
      { index: 0 },
    ]);
  });

  it("'up-down' ascends then descends, excluding first and last from descent", () => {
    // CMaj: 0, 4, 7 → up: 0 4 7, then reverse without first/last: 4
    expect(applyArpeggioDirection(CMaj, "up-down")).toEqual([
      { index: 0 },
      { index: 4 },
      { index: 7 },
      { index: 4 },
    ]);
  });

  it("'up-down' with 4 notes includes inner notes on descent", () => {
    // 0 4 7 11 → 0 4 7 11 7 4
    expect(applyArpeggioDirection(CMaj7, "up-down")).toEqual([
      { index: 0 },
      { index: 4 },
      { index: 7 },
      { index: 11 },
      { index: 7 },
      { index: 4 },
    ]);
  });

  it("'up-down' with a single note returns that single note", () => {
    expect(applyArpeggioDirection([{ index: 5 }], "up-down")).toEqual([{ index: 5 }]);
  });

  it("'random' returns all notes (shuffled) without duplicates", () => {
    const result = applyArpeggioDirection(CMaj, "random");
    expect(result).toHaveLength(3);
    expect(new Set(result.map((n) => n.index)).size).toBe(3);
    expect(result.map((n) => n.index).sort((a, b) => a - b)).toEqual([0, 4, 7]);
  });

  it("preserves extra properties on note objects", () => {
    const rich = [
      { index: 7, name: "G", role: "fifth" as const },
      { index: 0, name: "C", role: "root" as const },
    ];
    const result = applyArpeggioDirection(rich, "up");
    expect(result[0]).toEqual({ index: 0, name: "C", role: "root" });
    expect(result[1]).toEqual({ index: 7, name: "G", role: "fifth" });
  });
});

// ── applyRepeats ─────────────────────────────────────────────────────────────

describe("applyRepeats", () => {
  it("repeats 1 returns the original sequence", () => {
    expect(applyRepeats([1, 2, 3], 1)).toEqual([1, 2, 3]);
  });

  it("repeats 2 concatenates the sequence twice", () => {
    expect(applyRepeats([1, 2], 2)).toEqual([1, 2, 1, 2]);
  });

  it("repeats 0 is clamped to 1", () => {
    expect(applyRepeats([42], 0)).toEqual([42]);
  });

  it("repeats 4 produces 4× the input length", () => {
    expect(applyRepeats([1, 2, 3], 4)).toHaveLength(12);
  });
});

// ── getSubdivisionBeats ───────────────────────────────────────────────────────

describe("getSubdivisionBeats", () => {
  it("quarter → 1 beat", () => expect(getSubdivisionBeats("quarter")).toBe(1));
  it("eighth → 0.5 beats", () => expect(getSubdivisionBeats("eighth")).toBe(0.5));
  it("sixteenth → 0.25 beats", () => expect(getSubdivisionBeats("sixteenth")).toBe(0.25));
  it("triplet → 1/3 beats", () =>
    expect(getSubdivisionBeats("triplet")).toBeCloseTo(1 / 3));
});

// ── computeArpeggioStartOffsets ───────────────────────────────────────────────

describe("computeArpeggioStartOffsets", () => {
  const SPB = 0.5; // 120 BPM → 0.5 s/beat

  it("straight (swing=0) offsets are evenly spaced", () => {
    const offsets = computeArpeggioStartOffsets(4, SPB, "eighth", 0);
    // eighth at 0.5 s/beat = 0.25 s per note → 0, 0.25, 0.5, 0.75
    expect(offsets).toHaveLength(4);
    expect(offsets[0]).toBeCloseTo(0);
    expect(offsets[1]).toBeCloseTo(0.25);
    expect(offsets[2]).toBeCloseTo(0.5);
    expect(offsets[3]).toBeCloseTo(0.75);
  });

  it("swing=100 pushes odd notes forward within pairs", () => {
    const offsets = computeArpeggioStartOffsets(4, SPB, "eighth", 100);
    // swingFactor=1.5, baseSec=0.25
    // note 0 (even): pair 0 start = 0
    // note 1 (odd): pair 0 start + 1.5*0.25 = 0.375
    // note 2 (even): pair 1 start = 0.5
    // note 3 (odd): pair 1 start + 0.375 = 0.875
    expect(offsets[0]).toBeCloseTo(0);
    expect(offsets[1]).toBeCloseTo(0.375);
    expect(offsets[2]).toBeCloseTo(0.5);
    expect(offsets[3]).toBeCloseTo(0.875);
  });

  it("swing is clamped to 0–100", () => {
    const offsets0 = computeArpeggioStartOffsets(2, SPB, "eighth", -50);
    const offsets100 = computeArpeggioStartOffsets(2, SPB, "eighth", 150);
    const offsetsMin = computeArpeggioStartOffsets(2, SPB, "eighth", 0);
    const offsetsMax = computeArpeggioStartOffsets(2, SPB, "eighth", 100);
    expect(offsets0).toEqual(offsetsMin);
    expect(offsets100).toEqual(offsetsMax);
  });

  it("returns a single zero offset for count=1", () => {
    expect(computeArpeggioStartOffsets(1, SPB, "quarter", 0)).toEqual([0]);
  });
});

// ── generateArpeggioSequence ─────────────────────────────────────────────────

describe("generateArpeggioSequence", () => {
  const upOnce: ArpeggioPattern = {
    direction: "up",
    subdivision: "eighth",
    swingPercent: 0,
    repeats: 1,
  };

  it("up/1 repeat produces ascending sequence", () => {
    const seq = generateArpeggioSequence(CMaj, upOnce);
    expect(seq.map((n) => n.index)).toEqual([0, 4, 7]);
  });

  it("down/2 repeats produces descending × 2", () => {
    const pattern: ArpeggioPattern = { ...upOnce, direction: "down", repeats: 2 };
    expect(generateArpeggioSequence(CMaj, pattern).map((n) => n.index)).toEqual([
      7, 4, 0,
      7, 4, 0,
    ]);
  });

  it("up-down/1 produces ascending-then-descending inner notes", () => {
    const pattern: ArpeggioPattern = { ...upOnce, direction: "up-down" };
    expect(generateArpeggioSequence(CMaj, pattern).map((n) => n.index)).toEqual([
      0, 4, 7, 4,
    ]);
  });

  it("handles an empty note array", () => {
    expect(generateArpeggioSequence([], upOnce)).toEqual([]);
  });
});
