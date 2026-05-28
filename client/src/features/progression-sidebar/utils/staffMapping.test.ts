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

  it("spells accidentals as flats when flat preference is requested", () => {
    const layout = buildStaffNoteLayout([61], pitchClasses, "treble", "flat");
    expect(layout[0]?.noteLabel).toBe("Db4");
  });

  it("spells accidentals as sharps when sharp preference is requested", () => {
    const layout = buildStaffNoteLayout([61], pitchClasses, "treble", "sharp");
    expect(layout[0]?.noteLabel).toBe("C#4");
  });

  it("separates clustered noteheads to avoid overlap", () => {
    const layout = buildStaffNoteLayout([60, 61, 62, 63, 64, 65, 66], pitchClasses, "treble");
    const minSpacing = layout.slice(1).reduce((currentMin, note, index) => {
      const previous = layout[index];
      if (!previous) return currentMin;
      return Math.min(currentMin, note.x - previous.x);
    }, Number.POSITIVE_INFINITY);

    expect(minSpacing).toBeGreaterThanOrEqual(12);
  });
});
