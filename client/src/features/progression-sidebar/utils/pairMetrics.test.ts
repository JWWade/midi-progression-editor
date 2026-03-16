/**
 * Unit tests for pair metrics computation utilities.
 */

import { describe, it, expect } from "vitest";
import type { Chord } from "@/features/current-chord/types";
import { getChordPitchClasses, computeSharedNotes, computeProgressionPairMetrics } from "./pairMetrics";

describe("pairMetrics utilities", () => {
  describe("getChordPitchClasses", () => {
    it("returns pitch classes for a named major chord", () => {
      const chord: Chord = { root: 0, quality: "major" }; // C major: C, E, G
      const pitches = getChordPitchClasses(chord);
      expect(pitches).toEqual(new Set([0, 4, 7])); // C, E, G
    });

    it("returns pitch classes for a named minor chord", () => {
      const chord: Chord = { root: 2, quality: "minor" }; // D minor: D, F, A
      const pitches = getChordPitchClasses(chord);
      expect(pitches).toEqual(new Set([2, 5, 9])); // D, F, A
    });

    it("returns pitch classes for a 7th chord", () => {
      const chord: Chord = { root: 7, quality: "dom7" }; // G7: G, B, D, F
      const pitches = getChordPitchClasses(chord);
      expect(pitches).toEqual(new Set([7, 11, 2, 5])); // G, B, D, F
    });

    it("returns pitch classes for a custom chord", () => {
      const chord: Chord = { root: 0, quality: "major", customNotes: [0, 4, 7] };
      const pitches = getChordPitchClasses(chord);
      expect(pitches).toEqual(new Set([0, 4, 7]));
    });

    it("handles pitch classes that wrap around the octave", () => {
      const chord: Chord = { root: 11, quality: "major" }; // B major: B, D#, F#
      const pitches = getChordPitchClasses(chord);
      expect(pitches).toEqual(new Set([11, 3, 6])); // B, D#, F# (11, 11+4=15%12=3, 11+7=18%12=6)
    });
  });

  describe("computeSharedNotes", () => {
    it("computes shared notes between D minor and G7 (Dm: 2,5,9 vs G7: 7,11,2,5)", () => {
      const dm: Chord = { root: 2, quality: "minor" }; // D, F, A
      const g7: Chord = { root: 7, quality: "dom7" }; // G, B, D, F
      const metric = computeSharedNotes(dm, g7);

      expect(metric.sharedCount).toBe(2); // D and F are shared
      expect(metric.sizeA).toBe(3); // D minor has 3 notes
      expect(metric.sizeB).toBe(4); // G7 has 4 notes
      expect(metric.proportion).toBeCloseTo(2 / 3, 5); // 2 shared / min(3,4) = 2/3
      expect(metric.hide).toBe(false);
    });

    it("computes shared notes between G7 and C (G7: 7,11,2,5 vs C: 0,4,7)", () => {
      const g7: Chord = { root: 7, quality: "dom7" }; // G, B, D, F
      const c: Chord = { root: 0, quality: "major" }; // C, E, G
      const metric = computeSharedNotes(g7, c);

      expect(metric.sharedCount).toBe(1); // G is shared
      expect(metric.sizeA).toBe(4); // G7 has 4 notes
      expect(metric.sizeB).toBe(3); // C has 3 notes
      expect(metric.proportion).toBeCloseTo(1 / 3, 5); // 1 shared / min(4,3) = 1/3
      expect(metric.hide).toBe(false);
    });

    it("returns hide=true when both chords have identical pitch classes", () => {
      const cm1: Chord = { root: 0, quality: "major" }; // C, E, G
      const cm2: Chord = { root: 0, quality: "major" }; // C, E, G
      const metric = computeSharedNotes(cm1, cm2);

      expect(metric.sharedCount).toBe(3);
      expect(metric.sizeA).toBe(3);
      expect(metric.sizeB).toBe(3);
      expect(metric.proportion).toBe(1);
      expect(metric.hide).toBe(true);
    });

    it("returns hide=false when sizeA !== sizeB even with all notes shared", () => {
      // C major (3 notes) vs C major 7 (4 notes) — not an identical pair because sizes differ
      const cm: Chord = { root: 0, quality: "major" }; // C, E, G
      const cm7: Chord = { root: 0, quality: "maj7" }; // C, E, G, B
      const metric = computeSharedNotes(cm, cm7);

      expect(metric.sharedCount).toBe(3); // C, E, G shared
      expect(metric.sizeA).toBe(3);
      expect(metric.sizeB).toBe(4);
      expect(metric.proportion).toBe(1); // 3 / min(3,4) = 3/3
      expect(metric.hide).toBe(false); // Different sizes, so not hidden
    });

    it("handles no shared notes", () => {
      const c: Chord = { root: 0, quality: "major" }; // C, E, G
      const fs: Chord = { root: 6, quality: "major" }; // F#, A#, C#
      const metric = computeSharedNotes(c, fs);

      expect(metric.sharedCount).toBe(0);
      expect(metric.proportion).toBe(0);
      expect(metric.hide).toBe(false);
    });

    it("handles single-note vs multi-note chords", () => {
      const singleNote: Chord = { root: 0, quality: "major", customNotes: [0] };
      const triad: Chord = { root: 0, quality: "major" }; // C, E, G
      const metric = computeSharedNotes(singleNote, triad);

      expect(metric.sharedCount).toBe(1); // C is shared
      expect(metric.sizeA).toBe(1);
      expect(metric.sizeB).toBe(3);
      expect(metric.proportion).toBe(1); // 1 / min(1,3) = 1/1
      expect(metric.hide).toBe(false);
    });
  });

  describe("computeProgressionPairMetrics", () => {
    it("returns empty array for empty progression", () => {
      const metrics = computeProgressionPairMetrics([]);
      expect(metrics).toEqual([]);
    });

    it("returns empty array for single-chord progression", () => {
      const metrics = computeProgressionPairMetrics([{ root: 0, quality: "major" }]);
      expect(metrics).toEqual([]);
    });

    it("returns one metric for two-chord progression", () => {
      const chords: Chord[] = [
        { root: 2, quality: "minor" }, // D minor
        { root: 7, quality: "dom7" }, // G7
      ];
      const metrics = computeProgressionPairMetrics(chords);

      expect(metrics).toHaveLength(1);
      expect(metrics[0].index).toBe(0);
      expect(metrics[0].sharedCount).toBe(2);
      expect(metrics[0].proportion).toBeCloseTo(2 / 3, 5);
    });

    it("returns correct metrics for Dm → G7 → C progression", () => {
      const chords: Chord[] = [
        { root: 2, quality: "minor" }, // D minor
        { root: 7, quality: "dom7" }, // G7
        { root: 0, quality: "major" }, // C
      ];
      const metrics = computeProgressionPairMetrics(chords);

      expect(metrics).toHaveLength(2);

      // Pair 0: Dm → G7
      expect(metrics[0].index).toBe(0);
      expect(metrics[0].sharedCount).toBe(2);
      expect(metrics[0].sizeA).toBe(3);
      expect(metrics[0].sizeB).toBe(4);
      expect(metrics[0].proportion).toBeCloseTo(2 / 3, 5);

      // Pair 1: G7 → C
      expect(metrics[1].index).toBe(1);
      expect(metrics[1].sharedCount).toBe(1);
      expect(metrics[1].sizeA).toBe(4);
      expect(metrics[1].sizeB).toBe(3);
      expect(metrics[1].proportion).toBeCloseTo(1 / 3, 5);
    });

    it("hides metrics for identical successive chords", () => {
      const chords: Chord[] = [
        { root: 0, quality: "major" }, // C
        { root: 0, quality: "major" }, // C (identical)
        { root: 7, quality: "dom7" }, // G7
      ];
      const metrics = computeProgressionPairMetrics(chords);

      expect(metrics).toHaveLength(2);
      expect(metrics[0].hide).toBe(true); // C → C is hidden
      expect(metrics[1].hide).toBe(false); // C → G7 is shown
    });

    it("sets correct index values for all pairs", () => {
      const chords: Chord[] = [
        { root: 0, quality: "major" },
        { root: 2, quality: "minor" },
        { root: 5, quality: "minor" },
        { root: 7, quality: "dom7" },
      ];
      const metrics = computeProgressionPairMetrics(chords);

      expect(metrics).toHaveLength(3);
      expect(metrics[0].index).toBe(0);
      expect(metrics[1].index).toBe(1);
      expect(metrics[2].index).toBe(2);
    });
  });
});
