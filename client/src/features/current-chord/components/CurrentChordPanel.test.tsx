// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
  it("shows inferred symbol and resolved quality for rerooted custom chords", () => {
    const chord: Chord = { root: 7, quality: "major", customNotes: [7, 0, 4] };

    renderPanel(chord);

    expect(screen.getByText("Gq")).not.toBeNull();
    expect(screen.getByText("Quartal").previousElementSibling?.textContent).toBe("G");
    expect(screen.getByText("Quartal")).not.toBeNull();
    expect(screen.getByLabelText(/Chord notes: G-C-E/i)).not.toBeNull();
  });
});