// @vitest-environment jsdom
/**
 * Tests for BridgeSuggestionPopover — UI rendering and interactions.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BridgeSuggestionPopover } from "../components/BridgeSuggestionPopover";
import { EnharmonicProvider } from "@/app/providers/EnharmonicProvider";
import type { BridgeSuggestion } from "@/features/ii-v-suggestions";
import type { Chord } from "@/features/current-chord/types";

// ── Chord fixtures ──────────────────────────────────────────────────────────

const Dm7: Chord = { root: 2, quality: "min7" };
const G7: Chord = { root: 7, quality: "dom7" };
const Am7: Chord = { root: 9, quality: "min7" };

// ── Suggestion fixtures ─────────────────────────────────────────────────────

function makeSuggestion(
  bridge: Chord[],
  type: BridgeSuggestion["type"] = "diatonic-ii-v",
  score = 0.75,
): BridgeSuggestion {
  return { bridge, type, score, label: "", explanation: "" };
}

const diatonicSuggestion = makeSuggestion([Dm7, G7], "diatonic-ii-v", 0.75);
const tritoneSubSuggestion = makeSuggestion([Am7], "incomplete-ii", 0.4);

// ── Default prop factory ─────────────────────────────────────────────────────

function makeProps(
  overrides: Partial<React.ComponentProps<typeof BridgeSuggestionPopover>> = {},
): React.ComponentProps<typeof BridgeSuggestionPopover> {
  return {
    suggestions: [diatonicSuggestion],
    sourceChordName: "Am7",
    targetChordName: "C",
    insertAfterIndex: 0,
    progressionLength: 2,
    maxProgressionLength: 8,
    onApply: vi.fn(),
    onPreview: vi.fn(),
    onStopPreview: vi.fn(),
    previewingBridge: null,
    onClose: vi.fn(),
    ...overrides,
  };
}

// ── Render helper that wraps with EnharmonicProvider ─────────────────────────

function renderPopover(
  props: React.ComponentProps<typeof BridgeSuggestionPopover>,
) {
  return render(
    React.createElement(
      EnharmonicProvider,
      null,
      React.createElement(BridgeSuggestionPopover, props),
    ),
  );
}

// ── 6. Renders suggestion rows ───────────────────────────────────────────────

describe("BridgeSuggestionPopover — suggestion rows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("renders a row for each suggestion with a ▶ preview button", () => {
    renderPopover(makeProps({ suggestions: [diatonicSuggestion, tritoneSubSuggestion] }));

    const previewButtons = screen.getAllByRole("button", { name: /Preview bridge/i });
    expect(previewButtons).toHaveLength(2);
  });

  it("renders the label text for the suggestion", () => {
    renderPopover(makeProps({ suggestions: [diatonicSuggestion], targetChordName: "C" }));

    // generateBridgeLabel('diatonic-ii-v', 'C') → 'ii–V into C'
    // getByText throws if element not found — no need for toBeInTheDocument
    expect(screen.getByText("ii–V into C")).not.toBeNull();
  });

  it("renders the ▶ icon on the preview button when not playing", () => {
    renderPopover(makeProps({ previewingBridge: null }));

    const previewBtn = screen.getByRole("button", { name: /Preview bridge/i });
    expect(previewBtn.textContent).toBe("▶");
  });

  it("renders ■ icon on the preview button when this bridge is previewing", () => {
    renderPopover(
      makeProps({ previewingBridge: diatonicSuggestion.bridge }),
    );

    const stopBtn = screen.getByRole("button", { name: /Stop preview/i });
    expect(stopBtn.textContent).toBe("■");
  });
});

// ── 7. Applies bridge ────────────────────────────────────────────────────────

describe("BridgeSuggestionPopover — apply button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("clicking Apply calls onApply with the suggestion's bridge array", async () => {
    const onApply = vi.fn();
    renderPopover(makeProps({ onApply, suggestions: [diatonicSuggestion] }));

    const applyBtn = screen.getByRole("button", { name: /Apply bridge/i });
    await userEvent.click(applyBtn);

    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledWith(diatonicSuggestion.bridge);
  });

  it("Apply button is disabled when bridge would exceed maxProgressionLength", () => {
    renderPopover(
      makeProps({
        suggestions: [diatonicSuggestion],
        progressionLength: 7,
        maxProgressionLength: 8,
        // bridge has 2 chords → 7+2=9 > 8, should be disabled
      }),
    );

    const applyBtn = screen.getByRole("button", { name: /Apply bridge/i });
    expect((applyBtn as HTMLButtonElement).disabled).toBe(true);
  });
});

// ── 8. No suggestions state ──────────────────────────────────────────────────

describe("BridgeSuggestionPopover — empty suggestions", () => {
  afterEach(cleanup);
  it("renders 'No bridge suggestions' text when suggestions array is empty", () => {
    renderPopover(makeProps({ suggestions: [] }));

    // getByText throws if element not found
    expect(screen.getByText("No bridge suggestions")).not.toBeNull();
  });

  it("does not render any Apply button when suggestions is empty", () => {
    renderPopover(makeProps({ suggestions: [] }));

    expect(screen.queryByRole("button", { name: /Apply bridge/i })).toBeNull();
  });
});

// ── 9. Empty progression guard ───────────────────────────────────────────────

describe("BridgeSuggestionPopover — progression length guard", () => {
  afterEach(cleanup);
  it("returns null (renders nothing) when progressionLength < 2", () => {
    const { container } = renderPopover(makeProps({ progressionLength: 1 }));
    expect(container.firstChild).toBeNull();
  });

  it("renders normally when progressionLength === 2", () => {
    renderPopover(makeProps({ progressionLength: 2 }));

    // getByRole throws if element not found
    expect(screen.getByRole("dialog")).not.toBeNull();
  });

  it("renders normally when progressionLength > 2", () => {
    renderPopover(makeProps({ progressionLength: 5 }));

    expect(screen.getByRole("dialog")).not.toBeNull();
  });
});
