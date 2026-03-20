// @vitest-environment jsdom
/**
 * Tests for useBridgeApply hook — apply/undo state logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import { useBridgeApply } from "../hooks/useBridgeApply";
import type { Chord } from "@/features/current-chord/types";

// ── Chord fixtures ──────────────────────────────────────────────────────────

const Cmaj7: Chord = { root: 0, quality: "maj7" };
const Am7: Chord = { root: 9, quality: "min7" };
const Dm7: Chord = { root: 2, quality: "min7" };
const G7: Chord = { root: 7, quality: "dom7" };
const Fmaj7: Chord = { root: 5, quality: "maj7" };

// ── Test harness ─────────────────────────────────────────────────────────────
//
// useBridgeApply takes external chords + setChords. We use a React-state
// wrapper so that applyBridge / undoBridge updates are reflected in the
// hook's next render (just like a real component).

function useBridgeApplyHarness(initialChords: Chord[]) {
  const [chords, setChords] = useState<Chord[]>(initialChords);
  const bridge = useBridgeApply(chords, setChords);
  return { chords, ...bridge };
}

// ── 10. Apply inserts chords ─────────────────────────────────────────────────

describe("useBridgeApply — applyBridge", () => {
  it("splices bridge chords after insertAfterIndex=0", () => {
    const { result } = renderHook(() =>
      useBridgeApplyHarness([Cmaj7, Am7]),
    );

    act(() => {
      result.current.applyBridge([Dm7, G7], 0);
    });

    // [Cmaj7, ← Dm7, G7 inserted here, Am7]
    expect(result.current.chords).toEqual([Cmaj7, Dm7, G7, Am7]);
  });

  it("sets undoPending to true after apply", () => {
    const { result } = renderHook(() =>
      useBridgeApplyHarness([Cmaj7, Am7]),
    );

    act(() => {
      result.current.applyBridge([Dm7, G7], 0);
    });

    expect(result.current.undoPending).toBe(true);
  });

  it("inserts bridge at the end when insertAfterIndex equals last index", () => {
    const { result } = renderHook(() =>
      useBridgeApplyHarness([Cmaj7, Am7]),
    );

    act(() => {
      result.current.applyBridge([Fmaj7], 1);
    });

    expect(result.current.chords).toEqual([Cmaj7, Am7, Fmaj7]);
  });
});

// ── 11. Undo restores ────────────────────────────────────────────────────────

describe("useBridgeApply — undoBridge", () => {
  it("restores chords to the pre-apply snapshot", () => {
    const { result } = renderHook(() =>
      useBridgeApplyHarness([Cmaj7, Am7]),
    );

    act(() => {
      result.current.applyBridge([Dm7, G7], 0);
    });
    act(() => {
      result.current.undoBridge();
    });

    expect(result.current.chords).toEqual([Cmaj7, Am7]);
  });

  it("clears undoPending after undoBridge", () => {
    const { result } = renderHook(() =>
      useBridgeApplyHarness([Cmaj7, Am7]),
    );

    act(() => {
      result.current.applyBridge([Dm7, G7], 0);
    });
    act(() => {
      result.current.undoBridge();
    });

    expect(result.current.undoPending).toBe(false);
  });
});

// ── 12 & 13. Timer-based tests ───────────────────────────────────────────────

describe("useBridgeApply — timer behaviour", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 12. Timer auto-clears
  it("undoPending auto-clears to false after 6 seconds without explicit undo", () => {
    const { result } = renderHook(() =>
      useBridgeApplyHarness([Cmaj7, Am7]),
    );

    act(() => {
      result.current.applyBridge([Dm7, G7], 0);
    });

    expect(result.current.undoPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(6001);
    });

    expect(result.current.undoPending).toBe(false);
  });

  // 13. Double apply
  it("second applyBridge discards first snapshot; undo reverts to state after first apply", () => {
    const { result } = renderHook(() =>
      useBridgeApplyHarness([Cmaj7, Am7]),
    );

    // First apply: [Cmaj7, Am7] → [Cmaj7, Dm7, Am7]
    act(() => {
      result.current.applyBridge([Dm7], 0);
    });

    // Second apply on updated state [Cmaj7, Dm7, Am7] → [Cmaj7, G7, Dm7, Am7]
    act(() => {
      result.current.applyBridge([G7], 0);
    });

    expect(result.current.chords).toEqual([Cmaj7, G7, Dm7, Am7]);

    // Undo should go back to state between first and second apply
    act(() => {
      result.current.undoBridge();
    });

    expect(result.current.chords).toEqual([Cmaj7, Dm7, Am7]);
  });

  it("second applyBridge resets the 6-second timer", () => {
    const { result } = renderHook(() =>
      useBridgeApplyHarness([Cmaj7, Am7]),
    );

    act(() => {
      result.current.applyBridge([Dm7], 0);
    });

    // Advance almost to the first timer expiry
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Second apply resets the timer
    act(() => {
      result.current.applyBridge([G7], 0);
    });

    expect(result.current.undoPending).toBe(true);

    // 5000ms more (total 10000ms from first apply, but only 5000ms from second)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should still be pending (second timer hasn't expired yet)
    expect(result.current.undoPending).toBe(true);

    // Advance to expiry of second timer
    act(() => {
      vi.advanceTimersByTime(1001);
    });

    expect(result.current.undoPending).toBe(false);
  });
});
