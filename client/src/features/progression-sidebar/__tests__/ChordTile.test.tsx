// @vitest-environment jsdom
/**
 * Tests for ChordTile — inline playback controls (play chord / arpeggio).
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChordTile } from "../components/ChordTile";
import { EnharmonicProvider } from "@/app/providers/EnharmonicProvider";
import type { Chord } from "@/features/current-chord/types";

// ── Web Audio API mock ───────────────────────────────────────────────────────

vi.mock("@/features/audio", () => ({
  playChord: vi.fn().mockResolvedValue(undefined),
  playArpeggio: vi.fn().mockReturnValue({
    cancel: vi.fn(),
    done: Promise.resolve(),
  }),
  stopChord: vi.fn(),
}));

// ── Chord fixtures ──────────────────────────────────────────────────────────

const Cmaj: Chord = { root: 0, quality: "major" };
const Am7: Chord = { root: 9, quality: "min7" };
const EGC_CUSTOM: Chord = { root: 4, quality: "major", customNotes: [4, 7, 0] };

// ── Render helper ───────────────────────────────────────────────────────────

function renderTile(chord: Chord, extraProps: Partial<React.ComponentProps<typeof ChordTile>> = {}) {
  const defaultProps: React.ComponentProps<typeof ChordTile> = {
    chord,
    index: 0,
    isFirst: true,
    isLast: true,
    onDelete: vi.fn(),
    ...extraProps,
  };
  return render(
    React.createElement(
      EnharmonicProvider,
      null,
      React.createElement(ChordTile, defaultProps),
    ),
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ChordTile — playback buttons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("renders a Play chord button with aria-label 'Play chord'", () => {
    renderTile(Cmaj);
    expect(screen.getByRole("button", { name: /play chord/i })).not.toBeNull();
  });

  it("renders a Play arpeggio button with aria-label 'Play arpeggio'", () => {
    renderTile(Cmaj);
    expect(screen.getByRole("button", { name: /play arpeggio/i })).not.toBeNull();
  });

  it("clicking Play chord calls playChord with the chord's notes", async () => {
    const { playChord } = await import("@/features/audio");
    renderTile(Cmaj);
    const btn = screen.getByRole("button", { name: /play chord/i });
    await userEvent.click(btn);
    expect(playChord).toHaveBeenCalledOnce();
  });

  it("clicking Play arpeggio calls playArpeggio with the chord's notes", async () => {
    const { playArpeggio } = await import("@/features/audio");
    renderTile(Am7);
    const btn = screen.getByRole("button", { name: /play arpeggio/i });
    await userEvent.click(btn);
    expect(playArpeggio).toHaveBeenCalledOnce();
  });

  it("does not render playback buttons for ghost tiles", () => {
    renderTile(Cmaj, { isGhost: true });
    expect(screen.queryByRole("button", { name: /play chord/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /play arpeggio/i })).toBeNull();
  });

  it("calls onWillPlay before starting chord playback", async () => {
    const onWillPlay = vi.fn();
    renderTile(Cmaj, { onWillPlay });
    await userEvent.click(screen.getByRole("button", { name: /play chord/i }));
    expect(onWillPlay).toHaveBeenCalledOnce();
  });

  it("calls onWillPlay before starting arpeggio playback", async () => {
    const onWillPlay = vi.fn();
    renderTile(Cmaj, { onWillPlay });
    await userEvent.click(screen.getByRole("button", { name: /play arpeggio/i }));
    expect(onWillPlay).toHaveBeenCalledOnce();
  });
});

describe("ChordTile — existing controls still present", () => {
  afterEach(cleanup);

  it("renders Move up / Move down / Delete buttons", () => {
    renderTile(Cmaj, { isFirst: false, isLast: false });
    expect(screen.getByRole("button", { name: /move chord up/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: /move chord down/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: /delete chord/i })).not.toBeNull();
  });

  it("Move up is disabled when isFirst=true", () => {
    renderTile(Cmaj, { isFirst: true });
    const btn = screen.getByRole("button", { name: /move chord up/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("Move down is disabled when isLast=true", () => {
    renderTile(Cmaj, { isLast: true });
    const btn = screen.getByRole("button", { name: /move chord down/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows inferred symbol and note list for rerooted custom chords", () => {
    renderTile(EGC_CUSTOM);
    expect(screen.getByText("Em")).not.toBeNull();
    expect(screen.getByText("E G C")).not.toBeNull();
  });
});
