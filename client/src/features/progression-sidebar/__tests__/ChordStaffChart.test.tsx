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
    const noteheads = Array.from(container.querySelectorAll("ellipse"));
    const maxNoteheadX = Math.max(...noteheads.map((node) => Number(node.getAttribute("cx"))));

    expect(accidentalX).toBeLessThan(maxNoteheadX - 10);
  });
});
