// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useProgression } from "../hooks/useProgression";

const C_MAJOR = { root: 0, quality: "major" } as const;
const D_MINOR = { root: 2, quality: "minor" } as const;
const G_MAJOR = { root: 7, quality: "major" } as const;

describe("useProgression addChords", () => {
  it("adds all chords when sufficient capacity exists", () => {
    const { result } = renderHook(() => useProgression());

    let outcome: { added: number; reason?: "full" | "insufficient-space" } = { added: 0 };
    act(() => {
      outcome = result.current.addChords([D_MINOR, G_MAJOR, C_MAJOR]);
    });

    expect(outcome).toEqual({ added: 3 });
    expect(result.current.chords).toEqual([D_MINOR, G_MAJOR, C_MAJOR]);
  });

  it("uses all-or-nothing insertion when near max length", () => {
    const { result } = renderHook(() => useProgression());

    act(() => {
      result.current.addChords([C_MAJOR, C_MAJOR, C_MAJOR, C_MAJOR, C_MAJOR, C_MAJOR]);
    });

    let outcome: { added: number; reason?: "full" | "insufficient-space" } = { added: 0 };
    act(() => {
      outcome = result.current.addChords([D_MINOR, G_MAJOR, C_MAJOR]);
    });

    expect(outcome).toEqual({ added: 0, reason: "insufficient-space" });
    expect(result.current.chords).toHaveLength(6);
  });
});
