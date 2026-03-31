import { describe, it, expect } from "vitest";
import {
  resolveAxisCentre,
  reflectPitchClass,
  reflectPitchClasses,
  applyNegativeHarmony,
  applyNegativeHarmonyToChord,
} from "../reflectPitchClasses";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";
import type { Axis } from "../../types";
import type { Chord } from "@/features/current-chord/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Tonic–dominant axis for a given key root. */
const tdAxis = (root: number): Axis => ({ type: "tonic-dominant", tonicRoot: root });

// ── resolveAxisCentre ─────────────────────────────────────────────────────────

describe("resolveAxisCentre", () => {
  it("returns root + 3.5 for tonic-dominant axis", () => {
    expect(resolveAxisCentre(tdAxis(0))).toBe(3.5);  // C major
    expect(resolveAxisCentre(tdAxis(7))).toBe(10.5); // G major
    expect(resolveAxisCentre(tdAxis(9))).toBe(12.5); // A major
  });

  it("returns the explicit centre for custom axis", () => {
    const axis: Axis = { type: "custom", centre: 5.5 };
    expect(resolveAxisCentre(axis)).toBe(5.5);
  });
});

// ── reflectPitchClass ─────────────────────────────────────────────────────────

describe("reflectPitchClass", () => {
  it("maps C(0) to G(7) across the C-major axis (centre=3.5)", () => {
    expect(reflectPitchClass(0, 3.5)).toBe(7);
    expect(reflectPitchClass(7, 3.5)).toBe(0);
  });

  it("maps D(2) to F(5) across the C-major axis", () => {
    expect(reflectPitchClass(2, 3.5)).toBe(5);
    expect(reflectPitchClass(5, 3.5)).toBe(2);
  });

  it("maps E(4) to Eb(3) across the C-major axis", () => {
    expect(reflectPitchClass(4, 3.5)).toBe(3);
    expect(reflectPitchClass(3, 3.5)).toBe(4);
  });

  it("maps A(9) to Bb(10) across the C-major axis", () => {
    expect(reflectPitchClass(9, 3.5)).toBe(10);
    expect(reflectPitchClass(10, 3.5)).toBe(9);
  });

  it("maps B(11) to Ab(8) across the C-major axis", () => {
    expect(reflectPitchClass(11, 3.5)).toBe(8);
    expect(reflectPitchClass(8, 3.5)).toBe(11);
  });

  it("is an involution: reflecting twice returns the original pitch class", () => {
    const centre = 3.5;
    for (let p = 0; p < 12; p++) {
      expect(reflectPitchClass(reflectPitchClass(p, centre), centre)).toBe(p);
    }
  });

  it("always returns a value in [0, 11]", () => {
    const centre = 3.5;
    for (let p = 0; p < 12; p++) {
      const r = reflectPitchClass(p, centre);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(11);
      expect(Number.isInteger(r)).toBe(true);
    }
  });
});

// ── reflectPitchClasses ───────────────────────────────────────────────────────

describe("reflectPitchClasses", () => {
  it("C major [0,4,7] reflects to C minor [0,3,7] in C major", () => {
    // C->G, E->Eb, G->C  ->  {0,3,7}
    expect(reflectPitchClasses([0, 4, 7], tdAxis(0))).toEqual([0, 3, 7]);
  });

  it("C minor [0,3,7] reflects to C major [0,4,7] in C major", () => {
    expect(reflectPitchClasses([0, 3, 7], tdAxis(0))).toEqual([0, 4, 7]);
  });

  it("G major [7,11,2] reflects to F minor [0,5,8] in C major", () => {
    // G->C, B->Ab, D->F  ->  {0,5,8}  =  Fm
    expect(reflectPitchClasses([7, 11, 2], tdAxis(0))).toEqual([0, 5, 8]);
  });

  it("F major [5,9,0] reflects to G minor [2,7,10] in C major", () => {
    // F->D, A->Bb, C->G  ->  {2,7,10}  =  Gm
    expect(reflectPitchClasses([5, 9, 0], tdAxis(0))).toEqual([2, 7, 10]);
  });

  it("G7 [7,11,2,5] reflects to Dhalfdim7 [0,2,5,8] in C major", () => {
    // G->C, B->Ab, D->F, F->D  ->  {0,2,5,8}  =  Dhalfdim7
    expect(reflectPitchClasses([7, 11, 2, 5], tdAxis(0))).toEqual([0, 2, 5, 8]);
  });

  it("Dm7 [2,5,9,0] reflects to G min7 [2,5,7,10] in C major", () => {
    // D->F, F->D, A->Bb, C->G  ->  {2,5,7,10}  =  Gm7
    expect(reflectPitchClasses([2, 5, 9, 0], tdAxis(0))).toEqual([2, 5, 7, 10]);
  });

  it("returns a sorted, deduplicated array", () => {
    const result = reflectPitchClasses([0, 4, 7], tdAxis(0));
    const sorted = [...result].sort((a, b) => a - b);
    expect(result).toEqual(sorted);
    expect(new Set(result).size).toBe(result.length);
  });

  it("is an involution: reflecting twice returns the original set", () => {
    const axis = tdAxis(0);
    const original = [0, 4, 7];
    expect(reflectPitchClasses(reflectPitchClasses(original, axis), axis)).toEqual(original);
  });

  it("works for custom axis: reflecting [0,4,7] around centre=0", () => {
    const axis: Axis = { type: "custom", centre: 0 };
    // p' = (0 - p + 12) mod 12: 0->0, 4->8, 7->5  ->  {0,5,8}
    expect(reflectPitchClasses([0, 4, 7], axis)).toEqual([0, 5, 8]);
  });
});

// ── applyNegativeHarmonyToChord ───────────────────────────────────────────────

describe("applyNegativeHarmonyToChord", () => {
  it("C major -> C minor in C major (exact match)", () => {
    const chord: Chord = { root: 0, quality: "major" };
    const result = applyNegativeHarmonyToChord(chord, tdAxis(0));
    expect(result.chord.root).toBe(0);
    expect(result.chord.quality).toBe("minor");
    expect(result.matchScore).toBeCloseTo(1, 5);
    expect(result.reflectedPitchClasses).toEqual([0, 3, 7]);
  });

  it("C minor -> C major in C major (involution)", () => {
    const chord: Chord = { root: 0, quality: "minor" };
    const result = applyNegativeHarmonyToChord(chord, tdAxis(0));
    expect(result.chord.root).toBe(0);
    expect(result.chord.quality).toBe("major");
    expect(result.matchScore).toBeCloseTo(1, 5);
  });

  it("G major -> F minor in C major (exact match)", () => {
    // G major [7,11,2] -> [0,5,8] = Fm
    const chord: Chord = { root: 7, quality: "major" };
    const result = applyNegativeHarmonyToChord(chord, tdAxis(0));
    expect(result.chord.root).toBe(5);
    expect(result.chord.quality).toBe("minor");
    expect(result.matchScore).toBeCloseTo(1, 5);
  });

  it("F major -> G minor in C major (exact match)", () => {
    // F major [5,9,0] -> [2,7,10] = Gm
    const chord: Chord = { root: 5, quality: "major" };
    const result = applyNegativeHarmonyToChord(chord, tdAxis(0));
    expect(result.chord.root).toBe(7);
    expect(result.chord.quality).toBe("minor");
    expect(result.matchScore).toBeCloseTo(1, 5);
  });

  it("uses customNotes when provided instead of root+quality", () => {
    // customNotes = C major [0,4,7]
    const chord: Chord = { root: 99, quality: "dim", customNotes: [0, 4, 7] };
    const result = applyNegativeHarmonyToChord(chord, tdAxis(0));
    expect(result.reflectedPitchClasses).toEqual([0, 3, 7]);
    expect(result.chord.quality).toBe("minor");
  });

  it("always returns matchScore in [0, 1]", () => {
    const chord: Chord = { root: 0, quality: "quartal" };
    const result = applyNegativeHarmonyToChord(chord, tdAxis(0));
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(1);
  });
});

// ── applyNegativeHarmony (progression) ───────────────────────────────────────

describe("applyNegativeHarmony", () => {
  it("returns one result per input chord", () => {
    const axis = tdAxis(0);
    const chords: Chord[] = [
      { root: 2, quality: "min7" },
      { root: 7, quality: "dom7" },
      { root: 0, quality: "major" },
    ];
    const results = applyNegativeHarmony(chords, axis);
    expect(results).toHaveLength(3);
  });

  it("ii-V-I in C major reflects to Gm7, Dhalfdim7, Cm (musical plausibility)", () => {
    // Dm7 = D,F,A,C  ->  D(2)->F(5), F(5)->D(2), A(9)->Bb(10), C(0)->G(7) -> {2,5,7,10} = Gm7
    // G7  = G,B,D,F  ->  G(7)->C(0), B(11)->Ab(8), D(2)->F(5), F(5)->D(2) -> {0,2,5,8} = Dhalfdim7
    // Cmaj = C,E,G   ->  C(0)->G(7), E(4)->Eb(3), G(7)->C(0) -> {0,3,7} = Cm
    const axis = tdAxis(0);
    const chords: Chord[] = [
      { root: 2, quality: "min7"  }, // Dm7
      { root: 7, quality: "dom7"  }, // G7
      { root: 0, quality: "major" }, // Cmaj
    ];
    const results = applyNegativeHarmony(chords, axis);

    // Dm7 -> Gm7
    expect(results[0].reflectedPitchClasses).toEqual([2, 5, 7, 10]);
    expect(results[0].chord.root).toBe(7);
    expect(results[0].chord.quality).toBe("min7");
    expect(results[0].matchScore).toBeCloseTo(1, 5);

    // G7 -> Dhalfdim7
    expect(results[1].reflectedPitchClasses).toEqual([0, 2, 5, 8]);
    expect(results[1].chord.root).toBe(2);
    expect(results[1].chord.quality).toBe("halfdim7");
    expect(results[1].matchScore).toBeCloseTo(1, 5);

    // Cmaj -> Cm
    expect(results[2].reflectedPitchClasses).toEqual([0, 3, 7]);
    expect(results[2].chord.root).toBe(0);
    expect(results[2].chord.quality).toBe("minor");
    expect(results[2].matchScore).toBeCloseTo(1, 5);
  });

  it("I-V-vi-IV in C major reflects to musically coherent chords", () => {
    const axis = tdAxis(0);
    const chords: Chord[] = [
      { root: 0,  quality: "major" }, // C
      { root: 7,  quality: "major" }, // G
      { root: 9,  quality: "minor" }, // Am
      { root: 5,  quality: "major" }, // F
    ];
    const results = applyNegativeHarmony(chords, axis);

    // All results should be valid chords with positive match scores
    for (const result of results) {
      expect(result.matchScore).toBeGreaterThan(0);
      expect(result.chord.root).toBeGreaterThanOrEqual(0);
      expect(result.chord.root).toBeLessThanOrEqual(11);
    }

    // C major -> C minor
    expect(results[0].chord.quality).toBe("minor");
    expect(results[0].chord.root).toBe(0);

    // G major -> F minor: G[7,11,2]->[0,5,8]=Fm
    expect(results[1].chord.root).toBe(5);
    expect(results[1].chord.quality).toBe("minor");

    // A minor -> Eb major: Am[9,0,4] -> A(9)->Bb(10), C(0)->G(7), E(4)->Eb(3) -> {3,7,10}=Ebmaj
    expect(results[2].reflectedPitchClasses).toEqual([3, 7, 10]);
    expect(results[2].chord.root).toBe(3);
    expect(results[2].chord.quality).toBe("major");

    // F major -> G minor: F[5,9,0]->[2,7,10]=Gm
    expect(results[3].chord.root).toBe(7);
    expect(results[3].chord.quality).toBe("minor");
  });

  it("returns an empty array for an empty progression", () => {
    expect(applyNegativeHarmony([], tdAxis(0))).toEqual([]);
  });

  it("axis-invariant: reflecting raw pitch classes twice yields the original set", () => {
    const axis = tdAxis(0);
    const chords: Chord[] = [
      { root: 0, quality: "major" },
      { root: 2, quality: "minor" },
      { root: 7, quality: "dom7"  },
      { root: 5, quality: "maj7"  },
    ];
    for (const chord of chords) {
      const originalPcs = [...new Set(getChordNoteIndices(chord.root, chord.quality))].sort(
        (a, b) => a - b,
      );
      const once = reflectPitchClasses(originalPcs, axis);
      const twice = reflectPitchClasses(once, axis);
      expect(twice).toEqual(originalPcs);
    }
  });
});

// ── Axis-invariant property: reflect is a bijection on all 12 pitch classes ───

describe("negative harmony bijection property", () => {
  it("reflectPitchClass is a bijection on the 12 pitch classes in C major", () => {
    const all12 = Array.from({ length: 12 }, (_, i) => i);
    const reflected = all12.map((p) => reflectPitchClass(p, 3.5));
    // All 12 outputs are distinct (bijection)
    expect(new Set(reflected).size).toBe(12);
    // All outputs are in [0, 11]
    for (const r of reflected) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(11);
    }
  });
});
