// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { EnharmonicProvider } from "@/app/providers/EnharmonicProvider";
import type { Chord } from "../types";
import { CurrentChordPanel } from "./CurrentChordPanel";

vi.mock("@/features/audio", () => ({
  useAudioPlayback: () => ({
    isPlaying: false,
    play: vi.fn(),
    stop: vi.fn(),
  }),
}));

function renderPanel(chord: Chord) {
  return render(
    <ThemeProvider>
      <EnharmonicProvider>
        <CurrentChordPanel chord={chord} onAddChord={vi.fn()} />
      </EnharmonicProvider>
    </ThemeProvider>,
  );
}

describe("CurrentChordPanel", () => {
  afterEach(cleanup);
  it("shows inferred symbol and resolved quality for rerooted custom chords", () => {
    const chord: Chord = { root: 7, quality: "major", customNotes: [7, 0, 4] };

    renderPanel(chord);

    expect(screen.getByText("Gq")).not.toBeNull();
    expect(screen.getByText("Quartal").previousElementSibling?.textContent).toBe("G");
    expect(screen.getByText("Quartal")).not.toBeNull();
    expect(screen.getByLabelText(/Chord notes: G-C-E/i)).not.toBeNull();
  });

  it("shows interval row with correct labels for a standard major chord", () => {
    const chord: Chord = { root: 0, quality: "major" };

    renderPanel(chord);

    const intervalRow = screen.getByLabelText("Chord intervals");
    expect(intervalRow).not.toBeNull();
    // C major: C=Root, E=M3, G=P5
    expect(intervalRow.textContent).toContain("Root");
    expect(intervalRow.textContent).toContain("M3");
    expect(intervalRow.textContent).toContain("P5");
  });

  it("shows interval row with correct labels for a dominant 7th chord", () => {
    const chord: Chord = { root: 0, quality: "dom7" };

    renderPanel(chord);

    const intervalRow = screen.getByLabelText("Chord intervals");
    // C dom7: C=Root, E=M3, G=P5, Bb=m7
    expect(intervalRow.textContent).toContain("Root");
    expect(intervalRow.textContent).toContain("M3");
    expect(intervalRow.textContent).toContain("P5");
    expect(intervalRow.textContent).toContain("m7");
  });

  it("shows interval row relative to first note for a custom chord", () => {
    const chord: Chord = { root: 0, quality: "major", customNotes: [0, 5, 10] };

    renderPanel(chord);

    const intervalRow = screen.getByLabelText("Chord intervals");
    // [0, 5, 10]: offsets = [0, 5, 10] → Root, P4, m7
    expect(intervalRow.textContent).toContain("Root");
    expect(intervalRow.textContent).toContain("P4");
    expect(intervalRow.textContent).toContain("m7");
  });

  it("does not show interval row when no chord is selected", () => {
    render(
      <ThemeProvider>
        <EnharmonicProvider>
          <CurrentChordPanel chord={null} onAddChord={vi.fn()} />
        </EnharmonicProvider>
      </ThemeProvider>,
    );

    expect(screen.queryByLabelText("Chord intervals")).toBeNull();
  });
});