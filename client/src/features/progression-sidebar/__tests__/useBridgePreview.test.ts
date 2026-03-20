// @vitest-environment jsdom
/**
 * Tests for useBridgePreview hook — preview start / stop / ghost state.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBridgePreview } from "../hooks/useBridgePreview";
import { EnharmonicProvider } from "@/app/providers/EnharmonicProvider";
import type { Chord } from "@/features/current-chord/types";

// ── Mock audio utilities — no real AudioContext in tests ────────────────────

vi.mock("@/features/audio/utils/audioUtils", () => ({
  playChord: vi.fn(() => new Promise<void>(() => { /* never resolves — keeps previews "playing" */ })),
  stopChord: vi.fn(),
  initAudioContext: vi.fn(),
}));

// ── Chord fixtures ──────────────────────────────────────────────────────────

const Cmaj7: Chord = { root: 0, quality: "maj7" };
const Am7: Chord = { root: 9, quality: "min7" };
const Dm7: Chord = { root: 2, quality: "min7" };
const G7: Chord = { root: 7, quality: "dom7" };

const bridge1: Chord[] = [Dm7, G7];
const bridge2: Chord[] = [Am7];

// ── Wrapper providing EnharmonicProvider context ─────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(EnharmonicProvider, null, children);
}

// ── 14. startPreview sets previewBridge ──────────────────────────────────────

describe("useBridgePreview — startPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets previewBridge to the supplied bridge array", () => {
    const { result } = renderHook(() => useBridgePreview(), { wrapper });

    act(() => {
      result.current.startPreview(Cmaj7, bridge1, Am7, 0);
    });

    expect(result.current.previewBridge).toBe(bridge1);
  });

  it("sets isPreviewPlaying to true", () => {
    const { result } = renderHook(() => useBridgePreview(), { wrapper });

    act(() => {
      result.current.startPreview(Cmaj7, bridge1, Am7, 0);
    });

    expect(result.current.isPreviewPlaying).toBe(true);
  });

  it("sets previewInsertAfterIndex to the supplied index", () => {
    const { result } = renderHook(() => useBridgePreview(), { wrapper });

    act(() => {
      result.current.startPreview(Cmaj7, bridge1, Am7, 2);
    });

    expect(result.current.previewInsertAfterIndex).toBe(2);
  });
});

// ── 15. stopPreview clears state ─────────────────────────────────────────────

describe("useBridgePreview — stopPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears previewBridge to null", () => {
    const { result } = renderHook(() => useBridgePreview(), { wrapper });

    act(() => {
      result.current.startPreview(Cmaj7, bridge1, Am7, 0);
    });
    act(() => {
      result.current.stopPreview();
    });

    expect(result.current.previewBridge).toBeNull();
  });

  it("sets isPreviewPlaying to false", () => {
    const { result } = renderHook(() => useBridgePreview(), { wrapper });

    act(() => {
      result.current.startPreview(Cmaj7, bridge1, Am7, 0);
    });
    act(() => {
      result.current.stopPreview();
    });

    expect(result.current.isPreviewPlaying).toBe(false);
  });

  it("clears previewInsertAfterIndex to null", () => {
    const { result } = renderHook(() => useBridgePreview(), { wrapper });

    act(() => {
      result.current.startPreview(Cmaj7, bridge1, Am7, 1);
    });
    act(() => {
      result.current.stopPreview();
    });

    expect(result.current.previewInsertAfterIndex).toBeNull();
  });

  it("calls stopChord", async () => {
    const { stopChord } = await import("@/features/audio/utils/audioUtils");
    const { result } = renderHook(() => useBridgePreview(), { wrapper });

    act(() => {
      result.current.startPreview(Cmaj7, bridge1, Am7, 0);
    });
    act(() => {
      result.current.stopPreview();
    });

    expect(stopChord).toHaveBeenCalled();
  });
});

// ── 16. Re-entrant call ───────────────────────────────────────────────────────

describe("useBridgePreview — re-entrant startPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("second startPreview replaces previewBridge with the new bridge", () => {
    const { result } = renderHook(() => useBridgePreview(), { wrapper });

    act(() => {
      result.current.startPreview(Cmaj7, bridge1, Am7, 0);
    });
    act(() => {
      result.current.startPreview(Am7, bridge2, Cmaj7, 1);
    });

    expect(result.current.previewBridge).toBe(bridge2);
  });

  it("second startPreview calls stopChord to halt the first sequence", async () => {
    const { stopChord } = await import("@/features/audio/utils/audioUtils");
    const { result } = renderHook(() => useBridgePreview(), { wrapper });

    act(() => {
      result.current.startPreview(Cmaj7, bridge1, Am7, 0);
    });

    const callsBefore = (stopChord as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => {
      result.current.startPreview(Am7, bridge2, Cmaj7, 1);
    });

    expect((stopChord as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("isPreviewPlaying stays true after second startPreview", () => {
    const { result } = renderHook(() => useBridgePreview(), { wrapper });

    act(() => {
      result.current.startPreview(Cmaj7, bridge1, Am7, 0);
    });
    act(() => {
      result.current.startPreview(Am7, bridge2, Cmaj7, 1);
    });

    expect(result.current.isPreviewPlaying).toBe(true);
  });
});
