// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChordStaffChart } from "../components/ChordStaffChart";
import styles from "../components/ChordStaffChart.module.css";

const PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

describe("ChordStaffChart", () => {
  it("shows a fallback badge when no voiced notes are available", () => {
    render(
      <ChordStaffChart
        chordName="Dm"
        voicedMidiNotes={null}
        pitchClasses={PITCH_CLASSES}
      />,
    );

    expect(screen.getByRole("status")).not.toBeNull();
    expect(screen.getByText("Chart unavailable")).not.toBeNull();
  });

  it("connects the staff image to a screen-reader description when descriptionId is provided", () => {
    render(
      <ChordStaffChart
        chordName="Dm"
        voicedMidiNotes={[50, 53, 57]}
        pitchClasses={PITCH_CLASSES}
        descriptionId="dm-chart-description"
      />,
    );

    const image = screen.getByRole("img", { name: /dm staff chart/i });
    expect(image.getAttribute("aria-describedby")).toBe("dm-chart-description");

    const description = document.getElementById("dm-chart-description");
    expect(description).not.toBeNull();
    expect(description?.textContent).toContain("Dm, F clef, D3 F3 A3");
  });

  it("prefers flat accidental spelling when chord name uses flats", () => {
    render(
      <ChordStaffChart
        chordName="Bbm"
        voicedMidiNotes={[58, 61, 65]}
        pitchClasses={PITCH_CLASSES}
        descriptionId="bbm-chart-description"
      />,
    );

    const description = document.getElementById("bbm-chart-description");
    expect(description).not.toBeNull();
    expect(description?.textContent).toContain("Bb3 Db4 F4");
    expect(description?.textContent).not.toContain("C#4");
  });

  it("uses explicit note-name overrides when provided", () => {
    render(
      <ChordStaffChart
        chordName="D diminished"
        voicedMidiNotes={[50, 53, 56, 59]}
        pitchClasses={PITCH_CLASSES}
        noteNameOverridesByPitchClass={{ 2: "D", 5: "F", 8: "Ab", 11: "Cb" }}
        descriptionId="d-dim-spelling"
      />,
    );

    const description = document.getElementById("d-dim-spelling");
    expect(description).not.toBeNull();
    expect(description?.textContent).toContain("D3 F3 Ab3 Cb4");
  });

  it("applies the comfortable density style when requested", () => {
    const { container } = render(
      <ChordStaffChart
        chordName="Dm"
        voicedMidiNotes={[50, 53, 57]}
        pitchClasses={PITCH_CLASSES}
        density="comfortable"
      />,
    );

    const wrap = container.querySelector(`.${styles.chartWrap}`);
    expect(wrap?.className).toContain(styles.chartComfortable);
  });

  it("positions accidental glyphs to the left of noteheads", () => {
    const { container } = render(
      <ChordStaffChart
        chordName="Am6"
        voicedMidiNotes={[57, 60, 64, 66]}
        pitchClasses={PITCH_CLASSES}
      />,
    );

    const accidental = screen.getByText("#");
    const accidentalX = Number(accidental.getAttribute("x"));
    const accidentalY = Number(accidental.getAttribute("y"));
    const noteheads = Array.from(container.querySelectorAll("ellipse"));
    const maxNoteheadX = Math.max(...noteheads.map((node) => Number(node.getAttribute("cx"))));
    const nearestNoteheadY = Math.min(...noteheads.map((node) => {
      const cy = Number(node.getAttribute("cy"));
      return Math.abs(cy - accidentalY);
    }));

    expect(accidentalX).toBeLessThan(maxNoteheadX - 10);
    expect(nearestNoteheadY).toBeGreaterThanOrEqual(0.5);
  });

  it("keeps high-register voicings within the chart viewport", () => {
    const { container } = render(
      <ChordStaffChart
        chordName="Cmaj7"
        voicedMidiNotes={[67, 71, 74, 77]}
        pitchClasses={PITCH_CLASSES}
      />,
    );

    const noteheads = Array.from(container.querySelectorAll("ellipse"));
    const noteYValues = noteheads.map((node) => Number(node.getAttribute("cy")));
    const ledgerLines = Array.from(container.querySelectorAll(`.${styles.ledgerLine}`));
    const ledgerYValues = ledgerLines.flatMap((line) => [
      Number(line.getAttribute("y1")),
      Number(line.getAttribute("y2")),
    ]);
    const accidentalGlyphs = Array.from(container.querySelectorAll(`.${styles.accidental}`));
    const accidentalYValues = accidentalGlyphs.map((glyph) => Number(glyph.getAttribute("y")));

    const allYValues = [...noteYValues, ...ledgerYValues, ...accidentalYValues];
    expect(allYValues.length).toBeGreaterThan(0);
    expect(Math.min(...allYValues)).toBeGreaterThanOrEqual(6);
    expect(Math.max(...allYValues)).toBeLessThanOrEqual(78);
  });
});
