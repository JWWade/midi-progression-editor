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
});