// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCustomChordState } from "../useCustomChordState";

function makeOptions(overrides: Partial<Parameters<typeof useCustomChordState>[0]> = {}) {
  return {
    selectedChordName: "C",
    setSelectedChordName: vi.fn(),
    onCurrentChordChange: vi.fn(),
    onAnnounce: vi.fn(),
    ...overrides,
  };
}

describe("useCustomChordState", () => {
  it("starts with customFromChord as null", () => {
    const { result } = renderHook(() => useCustomChordState(makeOptions()));
    expect(result.current.customFromChord).toBeNull();
  });

  it("exposes the expected handlers", () => {
    const { result } = renderHook(() => useCustomChordState(makeOptions()));
    expect(typeof result.current.handleRotateChord).toBe("function");
    expect(typeof result.current.handleMirrorChord).toBe("function");
    expect(typeof result.current.handleRandomChord).toBe("function");
    expect(typeof result.current.handleSelectPrimitiveShape).toBe("function");
    expect(typeof result.current.setCustomFromChord).toBe("function");
  });

  it("setCustomFromChord updates customFromChord", () => {
    const { result } = renderHook(() => useCustomChordState(makeOptions()));
    const chord = { root: 0, quality: "major" as const, customNotes: [0, 4, 7] };
    act(() => {
      result.current.setCustomFromChord(chord);
    });
    expect(result.current.customFromChord).toEqual(chord);
  });

  it("setCustomFromChord(null) clears the custom chord", () => {
    const { result } = renderHook(() => useCustomChordState(makeOptions()));
    act(() => {
      result.current.setCustomFromChord({ root: 0, quality: "major", customNotes: [0, 4, 7] });
    });
    act(() => {
      result.current.setCustomFromChord(null);
    });
    expect(result.current.customFromChord).toBeNull();
  });

  it("handleSelectPrimitiveShape sets a custom chord for the 'equilateral-triangle' shape", () => {
    const onCurrentChordChange = vi.fn();
    const { result } = renderHook(() =>
      useCustomChordState(makeOptions({ onCurrentChordChange })),
    );
    act(() => {
      result.current.handleSelectPrimitiveShape("equilateral-triangle");
    });
    expect(result.current.customFromChord).not.toBeNull();
    expect(result.current.customFromChord?.primitiveShape).toBe("equilateral-triangle");
    expect(onCurrentChordChange).toHaveBeenCalledOnce();
  });

  it("handleRandomChord sets a non-null customFromChord with 3 notes", () => {
    const onCurrentChordChange = vi.fn();
    const { result } = renderHook(() =>
      useCustomChordState(makeOptions({ onCurrentChordChange })),
    );
    act(() => {
      result.current.handleRandomChord();
    });
    expect(result.current.customFromChord).not.toBeNull();
    expect(result.current.customFromChord?.customNotes).toHaveLength(3);
    expect(onCurrentChordChange).toHaveBeenCalledOnce();
  });

  it("handleRotateChord clockwise calls setSelectedChordName when no custom chord is active", () => {
    const setSelectedChordName = vi.fn();
    const { result } = renderHook(() =>
      useCustomChordState(makeOptions({ selectedChordName: "C", setSelectedChordName })),
    );
    act(() => {
      result.current.handleRotateChord("clockwise");
    });
    // Named chord C rotated clockwise by 1 semitone becomes C#
    expect(setSelectedChordName).toHaveBeenCalledWith("C#");
  });

  it("handleMirrorChord calls onAnnounce with the mirror message", () => {
    const onAnnounce = vi.fn();
    const { result } = renderHook(() =>
      useCustomChordState(makeOptions({ selectedChordName: "C", onAnnounce })),
    );
    act(() => {
      result.current.handleMirrorChord();
    });
    expect(onAnnounce).toHaveBeenCalledWith("Mirrored chord about root");
  });
});
