import { describe, it, expect } from "vitest";
import { getToneRole, noteIndexToFrequency } from "../toneRoles";
import type { ChordType } from "@/features/chord/types";

// ── getToneRole ──────────────────────────────────────────────────────────────

describe("getToneRole", () => {
  it("returns 'Root' for interval 0 on all chord types", () => {
    const chordTypes: ChordType[] = [
      "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7",
    ];
    for (const quality of chordTypes) {
      expect(getToneRole(0, quality)).toBe("Root");
    }
  });

  it("returns 'Major Third' for interval 4 on major chord", () => {
    expect(getToneRole(4, "major")).toBe("Major Third");
  });

  it("returns 'Minor Third' for interval 3 on minor chord", () => {
    expect(getToneRole(3, "minor")).toBe("Minor Third");
  });

  it("returns 'Minor Third' for interval 3 on dim chord", () => {
    expect(getToneRole(3, "dim")).toBe("Minor Third");
  });

  it("returns 'Major Third' for interval 4 on aug chord", () => {
    expect(getToneRole(4, "aug")).toBe("Major Third");
  });

  it("returns 'Augmented Fifth' for interval 8 on aug chord", () => {
    expect(getToneRole(8, "aug")).toBe("Augmented Fifth");
  });

  it("returns 'Diminished Fifth' for interval 6 on dim chord", () => {
    expect(getToneRole(6, "dim")).toBe("Diminished Fifth");
  });

  it("returns 'Perfect Fifth' for interval 7 on major chord", () => {
    expect(getToneRole(7, "major")).toBe("Perfect Fifth");
  });

  it("returns 'Perfect Fifth' for interval 7 on maj7 chord", () => {
    expect(getToneRole(7, "maj7")).toBe("Perfect Fifth");
  });

  it("returns 'Major Seventh' for interval 11 on maj7 chord", () => {
    expect(getToneRole(11, "maj7")).toBe("Major Seventh");
  });

  it("returns 'Minor Seventh' for interval 10 on min7 chord", () => {
    expect(getToneRole(10, "min7")).toBe("Minor Seventh");
  });

  it("returns 'Minor Seventh' for interval 10 on dom7 chord", () => {
    expect(getToneRole(10, "dom7")).toBe("Minor Seventh");
  });

  it("returns 'Diminished Fifth' for interval 6 on halfdim7 chord", () => {
    expect(getToneRole(6, "halfdim7")).toBe("Diminished Fifth");
  });

  it("returns 'Minor Seventh' for interval 10 on halfdim7 chord", () => {
    expect(getToneRole(10, "halfdim7")).toBe("Minor Seventh");
  });

  it("returns a '+N semitones' fallback for an unrecognised interval", () => {
    expect(getToneRole(2, "major")).toBe("+2 semitones");
  });

  it("returns a fallback string for interval 9 on a triad type", () => {
    expect(getToneRole(9, "minor")).toBe("+9 semitones");
  });
});

// ── noteIndexToFrequency ─────────────────────────────────────────────────────

describe("noteIndexToFrequency", () => {
  it("A4 (note index 9, octave 4) equals exactly 440 Hz", () => {
    // A4 is MIDI note 69: index 9, octave 4 → (9 + 5*12) = 9 + 60 = 69
    expect(noteIndexToFrequency(9, 4)).toBeCloseTo(440, 4);
  });

  it("C4 (middle C, note index 0, octave 4) is approximately 261.63 Hz", () => {
    // MIDI 60 → 440 * 2^((60-69)/12)
    expect(noteIndexToFrequency(0, 4)).toBeCloseTo(261.626, 2);
  });

  it("A5 (note index 9, octave 5) is one octave above A4 = 880 Hz", () => {
    expect(noteIndexToFrequency(9, 5)).toBeCloseTo(880, 4);
  });

  it("A3 (note index 9, octave 3) is one octave below A4 = 220 Hz", () => {
    expect(noteIndexToFrequency(9, 3)).toBeCloseTo(220, 4);
  });

  it("frequency doubles each octave (octave invariant)", () => {
    for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
      const low = noteIndexToFrequency(noteIndex, 3);
      const high = noteIndexToFrequency(noteIndex, 4);
      expect(high / low).toBeCloseTo(2, 5);
    }
  });

  it("each semitone up multiplies frequency by 2^(1/12)", () => {
    const c4 = noteIndexToFrequency(0, 4);
    const csharp4 = noteIndexToFrequency(1, 4);
    expect(csharp4 / c4).toBeCloseTo(Math.pow(2, 1 / 12), 5);
  });

  it("defaults to octave 4 when no octave is specified", () => {
    expect(noteIndexToFrequency(9)).toBeCloseTo(440, 4);
  });

  it("all frequencies are positive for octaves 2–6", () => {
    for (let octave = 2; octave <= 6; octave++) {
      for (let note = 0; note < 12; note++) {
        expect(noteIndexToFrequency(note, octave)).toBeGreaterThan(0);
      }
    }
  });
});
