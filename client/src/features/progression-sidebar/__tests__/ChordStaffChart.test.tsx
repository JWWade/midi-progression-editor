// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChordStaffChart } from "../components/ChordStaffChart";

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
});
