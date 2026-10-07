// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useChromaticCircleData } from "./useChromaticCircleData";

describe("useChromaticCircleData", () => {
  it("returns C major notes locally without loading or error state", () => {
    const { result } = renderHook(() => useChromaticCircleData());

    expect(result.current).toEqual({
      scaleNotes: [
        { midi: 0, name: "C" },
        { midi: 2, name: "D" },
        { midi: 4, name: "E" },
        { midi: 5, name: "F" },
        { midi: 7, name: "G" },
        { midi: 9, name: "A" },
        { midi: 11, name: "B" },
      ],
      isLoading: false,
      error: null,
    });
  });
});
