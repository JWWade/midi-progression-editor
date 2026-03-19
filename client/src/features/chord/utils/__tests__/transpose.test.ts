import { describe, it, expect } from "vitest";
import {
  transposeChord,
  DIM_INTERVALS,
  AUG_INTERVALS,
  MAJOR_INTERVALS,
  MINOR_INTERVALS,
  CHORD_INTERVALS,
} from "../transpose";
import type { ChordType } from "@/features/chord/types";

const ALL_8_CHORD_TYPES: ChordType[] = [
  "major", "minor", "dim", "aug", "maj7", "min7", "dom7", "halfdim7",
];

describe("DIM_INTERVALS and AUG_INTERVALS constants", () => {
  it("DIM_INTERVALS is [0, 3, 6]", () => {
    expect(Array.from(DIM_INTERVALS)).toEqual([0, 3, 6]);
  });

  it("AUG_INTERVALS is [0, 4, 8]", () => {
    expect(Array.from(AUG_INTERVALS)).toEqual([0, 4, 8]);
  });

  it("MAJOR_INTERVALS is [0, 4, 7]", () => {
    expect(Array.from(MAJOR_INTERVALS)).toEqual([0, 4, 7]);
  });

  it("MINOR_INTERVALS is [0, 3, 7]", () => {
    expect(Array.from(MINOR_INTERVALS)).toEqual([0, 3, 7]);
  });
});

describe("transposeChord", () => {
  it("returns C major notes for root=0 with major intervals", () => {
    const notes = transposeChord(MAJOR_INTERVALS, 0);
    expect(notes.map((n) => n.index)).toEqual([0, 4, 7]);
    expect(notes[0].name).toBe("C");
    expect(notes[1].name).toBe("E");
    expect(notes[2].name).toBe("G");
  });

  it("returns G major notes for root=7 with major intervals", () => {
    const notes = transposeChord(MAJOR_INTERVALS, 7);
    expect(notes.map((n) => n.index)).toEqual([7, 11, 2]);
    expect(notes[0].name).toBe("G");
    expect(notes[1].name).toBe("B");
    expect(notes[2].name).toBe("D");
  });

  it("wraps indices above 11 back into the 0–11 range", () => {
    // B major: root=11, intervals [0,4,7] → [11, 15%12=3, 18%12=6]
    const notes = transposeChord(MAJOR_INTERVALS, 11);
    expect(notes.map((n) => n.index)).toEqual([11, 3, 6]);
  });

  it("assigns roles root/third/fifth correctly for a triad", () => {
    const notes = transposeChord(MAJOR_INTERVALS, 0);
    expect(notes[0].role).toBe("root");
    expect(notes[1].role).toBe("third");
    expect(notes[2].role).toBe("fifth");
  });

  it("assigns roles root/third/fifth/seventh for a seventh chord", () => {
    const notes = transposeChord(CHORD_INTERVALS.maj7, 0);
    expect(notes[0].role).toBe("root");
    expect(notes[1].role).toBe("third");
    expect(notes[2].role).toBe("fifth");
    expect(notes[3].role).toBe("seventh");
  });

  it("returns 3 notes for all triad types", () => {
    const triadTypes: ChordType[] = ["major", "minor", "dim", "aug"];
    for (const type of triadTypes) {
      const notes = transposeChord(CHORD_INTERVALS[type], 0);
      expect(notes).toHaveLength(3);
    }
  });

  it("returns 4 notes for all seventh chord types", () => {
    const seventhTypes: ChordType[] = ["maj7", "min7", "dom7", "halfdim7"];
    for (const type of seventhTypes) {
      const notes = transposeChord(CHORD_INTERVALS[type], 0);
      expect(notes).toHaveLength(4);
    }
  });

  it("accepts a custom pitchClasses array and uses it for note names", () => {
    const flatPitchClasses = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    const notes = transposeChord(MAJOR_INTERVALS, 7, flatPitchClasses);
    // G major: G, B, D
    expect(notes[0].name).toBe("G");
    expect(notes[1].name).toBe("B");
    expect(notes[2].name).toBe("D");
  });

  it("produces consistent indices for all 12 root positions", () => {
    for (let root = 0; root < 12; root++) {
      const notes = transposeChord(MAJOR_INTERVALS, root);
      for (const note of notes) {
        expect(note.index).toBeGreaterThanOrEqual(0);
        expect(note.index).toBeLessThanOrEqual(11);
      }
    }
  });
});

describe("CHORD_INTERVALS", () => {
  it("contains an entry for every one of the 8 core chord types", () => {
    for (const type of ALL_8_CHORD_TYPES) {
      expect(CHORD_INTERVALS[type]).toBeDefined();
      expect(CHORD_INTERVALS[type].length).toBeGreaterThan(0);
    }
  });

  it("all intervals start with 0 (root position)", () => {
    for (const type of ALL_8_CHORD_TYPES) {
      expect(CHORD_INTERVALS[type][0]).toBe(0);
    }
  });
});
