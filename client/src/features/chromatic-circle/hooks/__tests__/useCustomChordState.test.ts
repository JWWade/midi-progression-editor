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
    expect(typeof result.current.handleMutateChord).toBe("function");
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

  it("handleSelectPrimitiveShape sets a custom chord for shapes with no exact match", () => {
    const onCurrentChordChange = vi.fn();
    const { result } = renderHook(() =>
      useCustomChordState(makeOptions({ onCurrentChordChange })),
    );
    act(() => {
      result.current.handleSelectPrimitiveShape("square");
    });
    expect(result.current.customFromChord).not.toBeNull();
    expect(result.current.customFromChord?.primitiveShape).toBe("square");
    expect(onCurrentChordChange).toHaveBeenCalledOnce();
  });

  it("handleSelectPrimitiveShape snaps to named chord when notes match exactly", () => {
    const setSelectedChordName = vi.fn();
    const onCurrentChordChange = vi.fn();
    const { result } = renderHook(() =>
      useCustomChordState(
        makeOptions({ selectedChordName: "C", setSelectedChordName, onCurrentChordChange }),
      ),
    );
    act(() => {
      result.current.handleSelectPrimitiveShape("symmetrical-trapezoid");
    });
    expect(result.current.customFromChord).toBeNull();
    expect(setSelectedChordName).toHaveBeenCalledWith("Cmaj7");
    expect(onCurrentChordChange).toHaveBeenCalledWith({ root: 0, quality: "maj7" });
  });

  it("handleSelectPrimitiveShape with equilateral-triangle snaps to aug when root is C", () => {
    const setSelectedChordName = vi.fn();
    const onCurrentChordChange = vi.fn();
    const { result } = renderHook(() =>
      useCustomChordState(
        makeOptions({ selectedChordName: "C", setSelectedChordName, onCurrentChordChange }),
      ),
    );
    act(() => {
      result.current.handleSelectPrimitiveShape("equilateral-triangle");
    });
    expect(result.current.customFromChord).toBeNull();
    expect(setSelectedChordName).toHaveBeenCalledWith("Caug");
    expect(onCurrentChordChange).toHaveBeenCalledWith({ root: 0, quality: "aug" });
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

  it("handleMutateChord calls onAnnounce with a message naming the replaced note", () => {
    // Fix random: always pick pos=0 (first note) and available[0] (first non-chord pc).
    // C major notes = [0,4,7]. Pos 0 = C (pc 0). Available pcs start at 1 (C#).
    const randomValues = [0, 0]; // first call → pos 0; second call → available index 0
    let callCount = 0;
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
      const val = randomValues[callCount] ?? 0;
      callCount++;
      return val;
    });
    const onAnnounce = vi.fn();
    const { result } = renderHook(() =>
      useCustomChordState(makeOptions({ selectedChordName: "C", onAnnounce })),
    );
    act(() => {
      result.current.handleMutateChord();
    });
    randomSpy.mockRestore();
    // pos=0 → C (pc 0) is replaced; available[0] = 1 (C#)
    expect(onAnnounce).toHaveBeenCalledWith("Replaced C with C#");
  });

  it("handleMutateChord replaces exactly one note from the current chord", () => {
    // C major = [0, 4, 7]. Fix random: pos=1 (pc 4, E), replace with available[0]=1 (C#).
    const randomValues = [1 / 3, 0];
    let callCount = 0;
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
      const val = randomValues[callCount] ?? 0;
      callCount++;
      return val;
    });
    const onCurrentChordChange = vi.fn();
    const { result } = renderHook(() =>
      useCustomChordState(makeOptions({ selectedChordName: "C", onCurrentChordChange })),
    );
    act(() => {
      result.current.handleMutateChord();
    });
    randomSpy.mockRestore();
    // One of: customFromChord set with 3 notes, or named chord recognised
    const custom = result.current.customFromChord;
    if (custom !== null) {
      const notes = custom.customNotes;
      expect(notes).toHaveLength(3);
      // Exactly two of the original notes [0,4,7] should still be present
      const originalNotes = [0, 4, 7];
      const retained = notes.filter((n) => originalNotes.includes(n));
      expect(retained).toHaveLength(2);
    } else {
      // Named chord: onCurrentChordChange was called
      expect(onCurrentChordChange).toHaveBeenCalled();
    }
  });

  it("handleMutateChord with a custom chord mutates one of its notes", () => {
    // [0,4,7]: pos=0 (pc 0, C), replace with available[0]=1 (C#).
    const randomValues = [0, 0];
    let callCount = 0;
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
      const val = randomValues[callCount] ?? 0;
      callCount++;
      return val;
    });
    const onCurrentChordChange = vi.fn();
    const { result } = renderHook(() =>
      useCustomChordState(makeOptions({ onCurrentChordChange })),
    );
    const initialNotes = [0, 4, 7];
    act(() => {
      result.current.setCustomFromChord({ root: 0, quality: "major", customNotes: initialNotes });
    });
    act(() => {
      result.current.handleMutateChord();
    });
    randomSpy.mockRestore();
    const custom = result.current.customFromChord;
    if (custom !== null) {
      const notes = custom.customNotes;
      expect(notes).toHaveLength(3);
      // All resulting notes must be unique
      expect(new Set(notes).size).toBe(3);
      // pc 0 (C) was replaced by pc 1 (C#)
      expect(notes).not.toContain(0);
      expect(notes).toContain(1);
    } else {
      // Matched a named chord
      expect(onCurrentChordChange).toHaveBeenCalled();
    }
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
