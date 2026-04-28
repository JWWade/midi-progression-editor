import { describe, expect, it } from "vitest";
import type { Chord } from "../../types";
import { getChordPitchClasses } from "@/features/chord/utils";
import { orderPolygonNoteIndices } from "@/features/chromatic-circle/utils/geometry";
import { resolveChordIdentity } from "../chordName";

describe("geometry/identity parity", () => {
  const cases: Chord[] = [
    { root: 0, quality: "major" },
    { root: 2, quality: "dom7" },
    // G-C-F = G quartal (exact intervals: 0, 5, 10)
    { root: 7, quality: "quartal", customNotes: [7, 0, 5] },
    { root: 0, quality: "major", customNotes: [12, -8, 4, 19, 7, 0] },
  ];

  it("produces stable ordered polygon indices between panel and circle root contexts", () => {
    for (const chord of cases) {
      const noteIndices = getChordPitchClasses(chord);
      const resolved = resolveChordIdentity(chord);

      const panelOrdered = orderPolygonNoteIndices(noteIndices, resolved.root);
      const circleOrdered = orderPolygonNoteIndices(noteIndices, chord.root);

      expect(panelOrdered).toEqual(circleOrdered);
    }
  });

  it("keeps resolved identity deterministic across repeated evaluations", () => {
    for (const chord of cases) {
      const a = resolveChordIdentity(chord);
      const b = resolveChordIdentity(chord);
      expect(a).toEqual(b);
    }
  });
});
