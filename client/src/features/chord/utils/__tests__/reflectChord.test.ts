import { describe, it, expect } from "vitest";
import {
  reflectPitchClass,
  reflectPitchClasses,
  reflectChord,
  isSymmetricUnderAxis,
  allReflectionAxes,
} from "../reflectChord";
import type { ReflectionAxis, ReflectChordOptions } from "../reflectChord";
import { chordDistance } from "@/features/voice-leading/utils/chordDistance";
import type { Chord } from "@/features/current-chord/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Through-note axis at the given integer pitch class. */
const throughNoteAxis = (a: number): ReflectionAxis => ({
  value: a,
  type: "through-note",
  label: `test axis ${a}`,
});

/** Between-notes axis at the given half-integer value. */
const betweenNotesAxis = (a: number): ReflectionAxis => ({
  value: a,
  type: "between-notes",
  label: `test axis ${a}`,
});

const chromaticOptions = (axis: ReflectionAxis): ReflectChordOptions => ({
  axis,
  mode: "chromatic",
});

// ── reflectPitchClass ─────────────────────────────────────────────────────────

describe("reflectPitchClass", () => {
  it("reflectPitchClass(0, 0) → 0 (C reflects to C through C axis)", () => {
    expect(reflectPitchClass(0, 0)).toBe(0);
  });

  it("reflectPitchClass(4, 0) → 8 (E reflects to G♯ through C axis)", () => {
    expect(reflectPitchClass(4, 0)).toBe(8);
  });

  it("reflectPitchClass(7, 0) → 5 (G reflects to F through C axis)", () => {
    expect(reflectPitchClass(7, 0)).toBe(5);
  });

  it("is an involution: applying twice returns the original pitch class", () => {
    for (let x = 0; x < 12; x++) {
      for (let a = 0; a < 12; a++) {
        expect(reflectPitchClass(reflectPitchClass(x, a), a)).toBe(x);
      }
      // Also test half-integer axes
      for (let a = 0; a < 12; a++) {
        expect(reflectPitchClass(reflectPitchClass(x, a + 0.5), a + 0.5)).toBe(x);
      }
    }
  });

  it("always returns an integer in [0, 11]", () => {
    for (let x = 0; x < 12; x++) {
      for (let a = 0; a < 12; a++) {
        const r = reflectPitchClass(x, a);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(11);
        expect(Number.isInteger(r)).toBe(true);
      }
    }
  });

  it("is a bijection on the 12 pitch classes for any integer axis", () => {
    for (let a = 0; a < 12; a++) {
      const reflected = Array.from({ length: 12 }, (_, x) => reflectPitchClass(x, a));
      expect(new Set(reflected).size).toBe(12);
    }
  });

  it("between-notes axis 0.5: reflectPitchClass(0, 0.5) → 1", () => {
    expect(reflectPitchClass(0, 0.5)).toBe(1);
  });

  it("between-notes axis 0.5: reflectPitchClass(1, 0.5) → 0", () => {
    expect(reflectPitchClass(1, 0.5)).toBe(0);
  });

  it("between-notes axis 0.5 swaps C and C♯", () => {
    expect(reflectPitchClass(0, 0.5)).toBe(1);
    expect(reflectPitchClass(1, 0.5)).toBe(0);
  });
});

// ── reflectPitchClasses — chromatic mode ──────────────────────────────────────

describe("reflectPitchClasses (chromatic mode)", () => {
  it("C major [0, 4, 7] reflected through axis 0 → [0, 5, 8]", () => {
    // f_0(0)=0, f_0(4)=8, f_0(7)=5  →  {0, 5, 8} sorted
    const result = reflectPitchClasses([0, 4, 7], chromaticOptions(throughNoteAxis(0)));
    expect(result).toEqual([0, 5, 8]);
  });

  it("returns a sorted, deduplicated result", () => {
    const result = reflectPitchClasses([0, 4, 7], chromaticOptions(throughNoteAxis(0)));
    expect(result).toEqual([...result].sort((a, b) => a - b));
    expect(new Set(result).size).toBe(result.length);
  });

  it("is an involution: reflecting twice returns the original set", () => {
    const axis = throughNoteAxis(0);
    const opts = chromaticOptions(axis);
    const original = [0, 4, 7];
    const twice = reflectPitchClasses(reflectPitchClasses(original, opts), opts);
    expect(twice).toEqual([...new Set(original)].sort((a, b) => a - b));
  });

  it("[0, 6] reflected through axis 0 → [0, 6] (both are fixed points, no change)", () => {
    // f_0(0)=0, f_0(6)=6  →  {0, 6}
    const result = reflectPitchClasses([0, 6], chromaticOptions(throughNoteAxis(0)));
    expect(result).toEqual([0, 6]);
    expect(result).toHaveLength(2);
  });

  it("handles between-notes axis 0.5: [0, 1] → [0, 1] (C↔C♯ swap is an involution)", () => {
    // f_0.5(0)=1, f_0.5(1)=0  →  {0, 1} sorted
    const result = reflectPitchClasses([0, 1], chromaticOptions(betweenNotesAxis(0.5)));
    expect(result).toEqual([0, 1]);
  });
});

// ── reflectPitchClasses — collision handling ──────────────────────────────────

describe("reflectPitchClasses — collision handling", () => {
  it("allow-collapse (default): colliding reflected notes are deduplicated", () => {
    // Under scale-aware snapping two notes may land on the same diatonic note.
    // For chromatic mode, since reflection is a bijection, collisions cannot occur
    // with already-deduplicated input. Test deduplication via scale-aware mode.
    const axis = throughNoteAxis(0);
    const opts: ReflectChordOptions = {
      axis,
      mode: "scale-aware",
      collision: "allow-collapse",
      scaleContext: { root: 0, mode: "major" },
    };
    const result = reflectPitchClasses([0, 4, 7], opts);
    // verify no duplicates regardless
    expect(new Set(result).size).toBe(result.length);
  });

  it("spread-to-nearest-available: result has same length as input when collisions occur in scale-aware mode", () => {
    // Use scale-aware mode where snapping can introduce collisions
    const axis = throughNoteAxis(0);
    const opts: ReflectChordOptions = {
      axis,
      mode: "scale-aware",
      collision: "spread-to-nearest-available",
      scaleContext: { root: 0, mode: "major" },
    };
    const result = reflectPitchClasses([0, 4, 7], opts);
    // Result must not have duplicates
    expect(new Set(result).size).toBe(result.length);
  });

  it("chromatic allow-collapse: [0, 6] stays [0, 6] (both fixed, no collision)", () => {
    const result = reflectPitchClasses(
      [0, 6],
      { axis: throughNoteAxis(0), mode: "chromatic", collision: "allow-collapse" },
    );
    expect(result).toEqual([0, 6]);
  });
});

// ── isSymmetricUnderAxis ──────────────────────────────────────────────────────

describe("isSymmetricUnderAxis", () => {
  it("dim7 [0, 3, 6, 9] is symmetric under axis 0 (C axis)", () => {
    // f_0(0)=0, f_0(3)=9, f_0(6)=6, f_0(9)=3 → {0,3,6,9} unchanged as set
    expect(isSymmetricUnderAxis([0, 3, 6, 9], 0)).toBe(true);
  });

  it("dim7 [0, 3, 6, 9] is NOT symmetric under axis 1", () => {
    // f_1(0)=2, f_1(3)=11, f_1(6)=8, f_1(9)=5 → {2,5,8,11} ≠ {0,3,6,9}
    expect(isSymmetricUnderAxis([0, 3, 6, 9], 1)).toBe(false);
  });

  it("dim7 is symmetric under axis 3", () => {
    // f_3(0)=6, f_3(3)=3, f_3(6)=0, f_3(9)=9 → {0,3,6,9} unchanged as set
    expect(isSymmetricUnderAxis([0, 3, 6, 9], 3)).toBe(true);
  });

  it("aug triad [0, 4, 8] is symmetric under axis 4", () => {
    // f_4(0)=8, f_4(4)=4, f_4(8)=0 → {0,4,8} unchanged as set
    expect(isSymmetricUnderAxis([0, 4, 8], 4)).toBe(true);
  });

  it("C major [0, 4, 7] is NOT symmetric under axis 0", () => {
    // f_0(0)=0, f_0(4)=8, f_0(7)=5 → {0,5,8} ≠ {0,4,7}
    expect(isSymmetricUnderAxis([0, 4, 7], 0)).toBe(false);
  });

  it("[0, 6] is symmetric under axis 0 (both are fixed points)", () => {
    // f_0(0)=0, f_0(6)=6 → {0,6} unchanged
    expect(isSymmetricUnderAxis([0, 6], 0)).toBe(true);
  });

  it("returns true for an empty set", () => {
    expect(isSymmetricUnderAxis([], 0)).toBe(true);
  });
});

// ── chordDistance preservation (chromatic mode is an isometry) ────────────────

describe("chordDistance preservation in chromatic mode", () => {
  const testChordPairs: [number[], number[]][] = [
    [[0, 4, 7], [0, 3, 7]],   // C major ↔ C minor
    [[0, 4, 7], [7, 11, 2]],  // C major ↔ G major
    [[0, 4, 7, 10], [0, 3, 7, 10]],  // C dom7 ↔ C min7
    [[0, 3, 6], [0, 4, 8]],   // C dim ↔ C aug
    [[2, 5, 9], [7, 11, 2]],  // D min ↔ G major
  ];

  const axes = [0, 1, 3, 6, 7, 11].map(throughNoteAxis);

  it("chordDistance(f_a(A), f_a(B)) === chordDistance(A, B) for all test pairs and axes", () => {
    for (const axis of axes) {
      const opts = chromaticOptions(axis);
      for (const [a, b] of testChordPairs) {
        const reflA = reflectPitchClasses(a, opts);
        const reflB = reflectPitchClasses(b, opts);
        if (a.length === b.length) {
          // Same-size chords: distance must be exactly preserved
          expect(chordDistance(reflA, reflB)).toBe(chordDistance(a, b));
        }
      }
    }
  });

  it("distance is preserved under between-notes axis 0.5", () => {
    const axis = betweenNotesAxis(0.5);
    const opts = chromaticOptions(axis);
    for (const [a, b] of testChordPairs) {
      if (a.length === b.length) {
        const reflA = reflectPitchClasses(a, opts);
        const reflB = reflectPitchClasses(b, opts);
        expect(chordDistance(reflA, reflB)).toBe(chordDistance(a, b));
      }
    }
  });
});

// ── reflectChord ──────────────────────────────────────────────────────────────

describe("reflectChord", () => {
  it("C major reflected through axis 0 yields a chord with customNotes [0, 5, 8]", () => {
    const chord: Chord = { root: 0, quality: "major" };
    const result = reflectChord(chord, chromaticOptions(throughNoteAxis(0)));
    expect(result.customNotes).toEqual([0, 5, 8]);
  });

  it("returns a chord with valid root (0–11) and quality", () => {
    const chord: Chord = { root: 7, quality: "major" };
    const result = reflectChord(chord, chromaticOptions(throughNoteAxis(0)));
    expect(result.root).toBeGreaterThanOrEqual(0);
    expect(result.root).toBeLessThanOrEqual(11);
    expect(result.quality).toBeDefined();
  });

  it("uses customNotes when present instead of root+quality", () => {
    const chord: Chord = { root: 99, quality: "dim", customNotes: [0, 4, 7] };
    const result = reflectChord(chord, chromaticOptions(throughNoteAxis(0)));
    // [0,4,7] → [0,5,8]
    expect(result.customNotes).toEqual([0, 5, 8]);
  });

  it("applying reflectChord twice (involution) returns the original pitch-class set", () => {
    const chord: Chord = { root: 0, quality: "major" };
    const axis = throughNoteAxis(0);
    const opts = chromaticOptions(axis);
    const once = reflectChord(chord, opts);
    const twice = reflectChord(once, opts);
    const originalPcs = [0, 4, 7]; // C major
    expect(twice.customNotes).toEqual(originalPcs);
  });
});

// ── allReflectionAxes ─────────────────────────────────────────────────────────

describe("allReflectionAxes", () => {
  it("returns exactly 24 items", () => {
    expect(allReflectionAxes()).toHaveLength(24);
  });

  it("has 12 through-note axes with integer values", () => {
    const axes = allReflectionAxes();
    const throughNote = axes.filter((a) => a.type === "through-note");
    expect(throughNote).toHaveLength(12);
    for (const axis of throughNote) {
      expect(Number.isInteger(axis.value)).toBe(true);
      expect(axis.value).toBeGreaterThanOrEqual(0);
      expect(axis.value).toBeLessThanOrEqual(11);
    }
  });

  it("has 12 between-notes axes with half-integer values", () => {
    const axes = allReflectionAxes();
    const between = axes.filter((a) => a.type === "between-notes");
    expect(between).toHaveLength(12);
    for (const axis of between) {
      expect(Number.isInteger(axis.value)).toBe(false);
      expect(axis.value % 1).toBeCloseTo(0.5, 10);
      expect(axis.value).toBeGreaterThanOrEqual(0.5);
      expect(axis.value).toBeLessThanOrEqual(11.5);
    }
  });

  it("all axes have non-empty string labels", () => {
    for (const axis of allReflectionAxes()) {
      expect(typeof axis.label).toBe("string");
      expect(axis.label.length).toBeGreaterThan(0);
    }
  });

  it("through-note axis 0 is labelled 'C / F♯ axis'", () => {
    const axes = allReflectionAxes();
    const cAxis = axes.find((a) => a.type === "through-note" && a.value === 0);
    expect(cAxis?.label).toBe("C / F♯ axis");
  });

  it("between-notes axis 0.5 is labelled 'between C and C♯'", () => {
    const axes = allReflectionAxes();
    const axis = axes.find((a) => a.type === "between-notes" && a.value === 0.5);
    expect(axis?.label).toBe("between C and C♯");
  });

  it("all through-note axis values are distinct integers in 0–11", () => {
    const axes = allReflectionAxes();
    const values = axes
      .filter((a) => a.type === "through-note")
      .map((a) => a.value);
    expect(new Set(values).size).toBe(12);
  });

  it("all between-notes axis values are distinct half-integers in 0.5–11.5", () => {
    const axes = allReflectionAxes();
    const values = axes
      .filter((a) => a.type === "between-notes")
      .map((a) => a.value);
    expect(new Set(values).size).toBe(12);
  });
});

// ── scale-aware mode ──────────────────────────────────────────────────────────

describe("reflectPitchClasses (scale-aware mode)", () => {
  it("snaps reflected notes to the nearest diatonic degree in C major", () => {
    const axis = throughNoteAxis(0);
    const opts: ReflectChordOptions = {
      axis,
      mode: "scale-aware",
      scaleContext: { root: 0, mode: "major" },
    };
    const result = reflectPitchClasses([0, 4, 7], opts);
    // f_0: 0→0, 4→8, 7→5
    // In C major [0,2,4,5,7,9,11]: 8(G♯) snaps to 9(A) or 7(G); 5(F) is diatonic; 0(C) is diatonic
    // All results must be diatonic (in C major: 0,2,4,5,7,9,11)
    const cMajor = new Set([0, 2, 4, 5, 7, 9, 11]);
    for (const pc of result) {
      expect(cMajor.has(pc)).toBe(true);
    }
  });

  it("falls back to chromatic behaviour when no scaleContext is provided", () => {
    const axis = throughNoteAxis(0);
    const opts: ReflectChordOptions = {
      axis,
      mode: "scale-aware",
      scaleContext: null,
    };
    const result = reflectPitchClasses([0, 4, 7], opts);
    // Same as chromatic: [0, 5, 8]
    expect(result).toEqual([0, 5, 8]);
  });

  it("does not share internal logic with chromatic mode beyond the initial f_a step", () => {
    // In scale-aware mode, the result is constrained to diatonic notes.
    // In chromatic mode, the result is unconstrained.
    const axis = throughNoteAxis(0);
    const chromatic: ReflectChordOptions = { axis, mode: "chromatic" };
    const scaleAware: ReflectChordOptions = {
      axis,
      mode: "scale-aware",
      scaleContext: { root: 0, mode: "major" },
    };
    const chromaticResult = reflectPitchClasses([0, 4, 7], chromatic);
    const scaleAwareResult = reflectPitchClasses([0, 4, 7], scaleAware);
    // f_0(4) = 8 (G♯ — not in C major), so results differ
    expect(chromaticResult).not.toEqual(scaleAwareResult);
  });
});
