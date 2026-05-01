// @vitest-environment jsdom

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnharmonicProvider } from "@/app/providers/EnharmonicProvider";
import { ChordGrid } from "./ChordGrid";

function renderGrid(
  props: Partial<React.ComponentProps<typeof ChordGrid>> = {},
) {
  const defaultProps: React.ComponentProps<typeof ChordGrid> = {
    value: "C",
    onChange: vi.fn(),
  };

  return render(
    React.createElement(
      EnharmonicProvider,
      null,
      React.createElement(ChordGrid, { ...defaultProps, ...props }),
    ),
  );
}

describe("ChordGrid", () => {
  afterEach(cleanup);

  it("opens the chord picker when an exact-match custom chord label is clicked", async () => {
    renderGrid({
      value: "C",
      customChord: {
        root: 8,
        quality: "major",
        customNotes: [8, 11, 3],
      },
      "aria-label": "Chord",
    });

    expect(screen.queryByRole("grid", { name: "Chord picker" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Chord" }));

    expect(screen.getByRole("grid", { name: "Chord picker" })).not.toBeNull();
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
  });

  it("opens picker and highlights a known omitted-tone chord (C7 without fifth)", async () => {
    renderGrid({
      value: "C",
      customChord: {
        root: 0,
        quality: "major",
        customNotes: [0, 4, 10],
      },
      "aria-label": "Chord",
    });

    // The recognized named chord should be shown as a button (not raw-note text).
    expect(screen.queryByText("C E A#")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Chord" }));

    const picker = screen.getByRole("grid", { name: "Chord picker" });
    expect(picker).not.toBeNull();

    const c7Cell = screen.getByRole("gridcell", { name: "C7" });
    expect(c7Cell.getAttribute("aria-selected")).toBe("true");
  });

  it("keeps the picker available when custom notes are not a named chord", async () => {
    renderGrid({
      value: "C",
      customChord: {
        root: 5,
        quality: "major",
        customNotes: [5, 8, 9],
      },
      "aria-label": "Chord",
    });

    expect(screen.getByRole("button", { name: "Chord" })).not.toBeNull();
    expect(screen.getByText("F G# A")).not.toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Chord" }));

    const picker = screen.getByRole("grid", { name: "Chord picker" });
    expect(picker).not.toBeNull();
    expect(screen.getByRole("gridcell", { name: "C" })).not.toBeNull();
  });
});