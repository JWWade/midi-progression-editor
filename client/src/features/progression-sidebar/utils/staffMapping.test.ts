import { describe, expect, it } from "vitest";
import { buildStaffNoteLayout, pickStaffClef } from "./staffMapping";

describe("pickStaffClef", () => {
  it("chooses bass for low-register voicings", () => {
    expect(pickStaffClef([40, 43, 47, 50])).toBe("bass");
  });

  it("chooses treble for high-register voicings", () => {
    expect(pickStaffClef([60, 64, 67, 71])).toBe("treble");
  });
});

describe("buildStaffNoteLayout", () => {
  const pitchClasses = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  it("maps midi notes to deterministic note labels", () => {
    const layout = buildStaffNoteLayout([48, 55, 62, 64], pitchClasses, "bass");
    expect(layout.map((note) => note.noteLabel)).toEqual(["C3", "G3", "D4", "E4"]);
  });

  it("adds ledger lines when notes exceed treble staff range", () => {
    const layout = buildStaffNoteLayout([88], pitchClasses, "treble");
    expect(layout[0]?.ledgerLineYs.length).toBeGreaterThan(0);
  });
});
