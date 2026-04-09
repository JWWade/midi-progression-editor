import { describe, it, expect } from "vitest";
import {
  transposeChord,
  DIM_INTERVALS,
  AUG_INTERVALS,
  MAJOR_INTERVALS,
  MINOR_INTERVALS,
  MIN6_INTERVALS,
  SUS2_INTERVALS,
  CHORD_INTERVALS,
  getChordTriad,
  getChordNoteIndices,
  rotateChordNotes,
  rotateNamedChordRoot,
  dedupePitchClasses,
  getPrimitiveNoteIndices,
} from "../transpose";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { ChordType } from "@/features/chord/types";

const ALL_9_CHORD_TYPES: ChordType[] = [
  "major", "minor", "dim", "aug", "maj6", "min6", "maj7", "min7", "dom7", "halfdim7",
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

  it("assigns roles root/third/fifth/sixth for maj6 when chordType is provided", () => {
    const notes = transposeChord(CHORD_INTERVALS.maj6, 0, undefined, "maj6");
    expect(notes[0].role).toBe("root");
    expect(notes[1].role).toBe("third");
    expect(notes[2].role).toBe("fifth");
    expect(notes[3].role).toBe("sixth");
  });

  it("assigns roles root/third/fifth/sixth for min6 when chordType is provided", () => {
    const notes = transposeChord(MIN6_INTERVALS, 9, PITCH_CLASSES, "min6");
    expect(notes[0].role).toBe("root");
    expect(notes[1].role).toBe("third");
    expect(notes[2].role).toBe("fifth");
    expect(notes[3].role).toBe("sixth");
  });

  it("assigns roles root/second/fifth for sus2 when chordType is provided", () => {
    const notes = transposeChord(SUS2_INTERVALS, 2, PITCH_CLASSES, "sus2");
    expect(notes[0].role).toBe("root");
    expect(notes[1].role).toBe("second");
    expect(notes[2].role).toBe("fifth");
  });

  it("sus2 from root D(2) produces note indices [2, 4, 9]", () => {
    const notes = transposeChord(SUS2_INTERVALS, 2, PITCH_CLASSES, "sus2");
    expect(notes.map((n) => n.index)).toEqual([2, 4, 9]);
  });

  it("returns 3 notes for all triad types", () => {
    const triadTypes: ChordType[] = ["major", "minor", "dim", "aug", "sus2"];
    for (const type of triadTypes) {
      const notes = transposeChord(CHORD_INTERVALS[type], 0);
      expect(notes).toHaveLength(3);
    }
  });

  it("returns 4 notes for all seventh chord types", () => {
    const seventhTypes: ChordType[] = ["maj6", "maj7", "min7", "dom7", "halfdim7"];
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
  it("contains an entry for every one of the 9 core chord types", () => {
    for (const type of ALL_9_CHORD_TYPES) {
      expect(CHORD_INTERVALS[type]).toBeDefined();
      expect(CHORD_INTERVALS[type].length).toBeGreaterThan(0);
    }
  });

  it("all intervals start with 0 (root position)", () => {
    for (const type of ALL_9_CHORD_TYPES) {
      expect(CHORD_INTERVALS[type][0]).toBe(0);
    }
  });
});

describe("getChordTriad", () => {
  it("returns [0,4,7] for maj7", () => {
    expect(getChordTriad("maj7")).toEqual([0, 4, 7]);
  });

  it("returns [0,3,7] for min7", () => {
    expect(getChordTriad("min7")).toEqual([0, 3, 7]);
  });

  it("returns [0,4,7] for dom7", () => {
    expect(getChordTriad("dom7")).toEqual([0, 4, 7]);
  });

  it("returns [0,3,6] for halfdim7", () => {
    expect(getChordTriad("halfdim7")).toEqual([0, 3, 6]);
  });

  it("returns undefined for triad types (major, minor, dim, aug)", () => {
    for (const type of ["major", "minor", "dim", "aug"] as ChordType[]) {
      expect(getChordTriad(type)).toBeUndefined();
    }
  });

  it("returns undefined for maj6 (has its own distinct 4-note structure)", () => {
    expect(getChordTriad("maj6")).toBeUndefined();
  });
});

describe("getChordNoteIndices", () => {
  it("returns [0,4,7] for C major (root=0)", () => {
    expect(getChordNoteIndices(0, "major")).toEqual([0, 4, 7]);
  });

  it("returns [7,11,2] for G major (root=7)", () => {
    expect(getChordNoteIndices(7, "major")).toEqual([7, 11, 2]);
  });

  it("returns [0,4,7,11] for C maj7 (root=0)", () => {
    expect(getChordNoteIndices(0, "maj7")).toEqual([0, 4, 7, 11]);
  });

  it("returns [0,4,7,9] for C maj6 (root=0)", () => {
    expect(getChordNoteIndices(0, "maj6")).toEqual([0, 4, 7, 9]);
  });

  it("returns [0,3,7,9] for C min6 (root=0)", () => {
    expect(getChordNoteIndices(0, "min6")).toEqual([0, 3, 7, 9]);
  });

  it("all returned indices are in range 0–11 for every chord type and root", () => {
    for (const type of ALL_9_CHORD_TYPES) {
      for (let root = 0; root < 12; root++) {
        for (const idx of getChordNoteIndices(root, type)) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(11);
        }
      }
    }
  });

  it("result length matches CHORD_INTERVALS length for that type", () => {
    for (const type of ALL_9_CHORD_TYPES) {
      const indices = getChordNoteIndices(0, type);
      expect(indices).toHaveLength(CHORD_INTERVALS[type].length);
    }
  });
});

describe("rotateChordNotes", () => {
  it("rotates C major [0,4,7] up 2 semitones → [2,6,9]", () => {
    expect(rotateChordNotes([0, 4, 7], 2)).toEqual([2, 6, 9]);
  });

  it("wraps values at the chromatic boundary — root B(11) + 2 → 1", () => {
    expect(rotateChordNotes([11], 2)).toEqual([1]);
  });

  it("handles negative semitones — [2,6,9] rotated by -2 → [0,4,7]", () => {
    expect(rotateChordNotes([2, 6, 9], -2)).toEqual([0, 4, 7]);
  });

  it("0 semitones returns the same indices", () => {
    expect(rotateChordNotes([0, 4, 7], 0)).toEqual([0, 4, 7]);
  });

  it("all results are in range 0–11 for any rotation", () => {
    for (let semitones = -12; semitones <= 12; semitones++) {
      for (const idx of rotateChordNotes([0, 3, 6, 9], semitones)) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(11);
      }
    }
  });

  it("rotating by 12 (full octave) returns the same chord", () => {
    expect(rotateChordNotes([0, 4, 7], 12)).toEqual([0, 4, 7]);
  });
});

describe("rotateNamedChordRoot", () => {
  it("rotates C(0) by 2 semitones → D(2)", () => {
    expect(rotateNamedChordRoot(0, 2)).toBe(2);
  });

  it("wraps B(11) by 2 semitones → C#(1)", () => {
    expect(rotateNamedChordRoot(11, 2)).toBe(1);
  });

  it("handles negative semitones: C(0) by -1 → B(11)", () => {
    expect(rotateNamedChordRoot(0, -1)).toBe(11);
  });

  it("rotation by 12 returns the same root", () => {
    for (let root = 0; root < 12; root++) {
      expect(rotateNamedChordRoot(root, 12)).toBe(root);
    }
  });

  it("result is always in range 0–11", () => {
    for (let root = 0; root < 12; root++) {
      for (let semitones = -24; semitones <= 24; semitones++) {
        const result = rotateNamedChordRoot(root, semitones);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(11);
      }
    }
  });
});

describe("dedupePitchClasses", () => {
  it("removes duplicate pitch classes", () => {
    expect(dedupePitchClasses([0, 4, 7, 4, 0])).toEqual([0, 4, 7]);
  });

  it("preserves first-seen order", () => {
    expect(dedupePitchClasses([7, 4, 0, 4, 7])).toEqual([7, 4, 0]);
  });

  it("returns the same array when all values are unique", () => {
    expect(dedupePitchClasses([0, 3, 6, 9])).toEqual([0, 3, 6, 9]);
  });

  it("returns an empty array for empty input", () => {
    expect(dedupePitchClasses([])).toEqual([]);
  });

  it("handles a single element", () => {
    expect(dedupePitchClasses([5])).toEqual([5]);
  });
});

describe("getPrimitiveNoteIndices", () => {
  it("equilateral-triangle from root 0 → [0,4,8]", () => {
    expect(getPrimitiveNoteIndices(0, "equilateral-triangle")).toEqual([0, 4, 8]);
  });

  it("suspended-triangle from root 0 → [0,5,7]", () => {
    expect(getPrimitiveNoteIndices(0, "suspended-triangle")).toEqual([0, 5, 7]);
  });

  it("square from root 0 → [0,3,6,9]", () => {
    expect(getPrimitiveNoteIndices(0, "square")).toEqual([0, 3, 6, 9]);
  });

  it("rectangle from root 0 → [0,4,6,10]", () => {
    expect(getPrimitiveNoteIndices(0, "rectangle")).toEqual([0, 4, 6, 10]);
  });

  it("symmetrical-trapezoid from root 0 → [0,4,7,11]", () => {
    expect(getPrimitiveNoteIndices(0, "symmetrical-trapezoid")).toEqual([0, 4, 7, 11]);
  });

  it("symmetrical-trapezoid from root 2 (D) → [2,6,9,1]", () => {
    expect(getPrimitiveNoteIndices(2, "symmetrical-trapezoid")).toEqual([2, 6, 9, 1]);
  });

  it("all results are in range 0–11 for every shape and root", () => {
    const shapes = ["equilateral-triangle", "suspended-triangle", "square", "rectangle", "symmetrical-trapezoid"] as const;
    for (const shape of shapes) {
      for (let root = 0; root < 12; root++) {
        for (const idx of getPrimitiveNoteIndices(root, shape)) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(11);
        }
      }
    }
  });

  it("equilateral-triangle from root 4 → [4,8,0]", () => {
    expect(getPrimitiveNoteIndices(4, "equilateral-triangle")).toEqual([4, 8, 0]);
  });
});
