// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDragState } from "../useDragState";

/** Minimal mock of a React PointerEvent for testing. */
function makePointerEvent(overrides: Partial<{
  clientX: number;
  clientY: number;
  pointerId: number;
  stopPropagation: () => void;
  target: Partial<EventTarget & { setPointerCapture: (id: number) => void }>;
  currentTarget: Partial<SVGGElement>;
}> = {}): Parameters<ReturnType<typeof useDragState>["startDrag"]>[1] {
  return {
    clientX: 0,
    clientY: 0,
    pointerId: 1,
    stopPropagation: () => {},
    target: { setPointerCapture: () => {} },
    currentTarget: {},
    ...overrides,
  } as unknown as Parameters<ReturnType<typeof useDragState>["startDrag"]>[1];
}

describe("useDragState", () => {
  it("has the correct initial state", () => {
    const { result } = renderHook(() => useDragState());
    expect(result.current.isDragging).toBe(false);
    expect(result.current.draggedNoteIndex).toBeNull();
    expect(result.current.dragTargetIndex).toBeNull();
    expect(result.current.didDrag).toBe(false);
  });

  it("exposes startDrag, updateDragPosition, and resetDrag handlers", () => {
    const { result } = renderHook(() => useDragState());
    expect(typeof result.current.startDrag).toBe("function");
    expect(typeof result.current.updateDragPosition).toBe("function");
    expect(typeof result.current.resetDrag).toBe("function");
  });

  it("sets isDragging and draggedNoteIndex after startDrag", () => {
    const { result } = renderHook(() => useDragState());
    act(() => {
      result.current.startDrag(4, makePointerEvent({ clientX: 10, clientY: 20 }));
    });
    expect(result.current.isDragging).toBe(true);
    expect(result.current.draggedNoteIndex).toBe(4);
    expect(result.current.dragTargetIndex).toBe(4);
    expect(result.current.didDrag).toBe(false);
  });

  it("resets all fields to initial values after resetDrag", () => {
    const { result } = renderHook(() => useDragState());
    act(() => {
      result.current.startDrag(7, makePointerEvent());
    });
    act(() => {
      result.current.resetDrag();
    });
    expect(result.current.isDragging).toBe(false);
    expect(result.current.draggedNoteIndex).toBeNull();
    expect(result.current.dragTargetIndex).toBeNull();
    expect(result.current.didDrag).toBe(false);
  });

  it("does nothing on updateDragPosition when not dragging", () => {
    const { result } = renderHook(() => useDragState());
    // No startDrag — still in idle state
    act(() => {
      result.current.updateDragPosition(makePointerEvent({ clientX: 100, clientY: 100 }));
    });
    expect(result.current.isDragging).toBe(false);
    expect(result.current.draggedNoteIndex).toBeNull();
  });

  it("can start a drag with each of the 12 note indices", () => {
    for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
      const { result } = renderHook(() => useDragState());
      act(() => {
        result.current.startDrag(noteIndex, makePointerEvent());
      });
      expect(result.current.draggedNoteIndex).toBe(noteIndex);
    }
  });
});
