// @vitest-environment jsdom
/**
 * Tests for playArpeggio — scheduled note playback utility.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// ---------------------------------------------------------------------------
// Minimal Web Audio API mock
// ---------------------------------------------------------------------------

type MockNode = {
  connect: Mock;
  disconnect: Mock;
  start?: Mock;
  stop?: Mock;
  gain?: { setValueAtTime: Mock; linearRampToValueAtTime: Mock; value: number };
  frequency?: { value: number };
  type?: string;
  threshold?: { value: number };
  ratio?: { value: number };
  knee?: { value: number };
  attack?: { value: number };
  release?: { value: number };
};

function makeMockNode(extra: Partial<MockNode> = {}): MockNode {
  return { connect: vi.fn(), disconnect: vi.fn(), ...extra };
}

const createdNodes: MockNode[] = [];

function makeMockAudioContext() {
  return {
    state: "running" as AudioContextState,
    currentTime: 0,
    destination: makeMockNode(),
    resume: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(() => {
      const node = makeMockNode({
        gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      });
      createdNodes.push(node);
      return node;
    }),
    createDynamicsCompressor: vi.fn(() => {
      const node = makeMockNode({
        threshold: { value: 0 },
        ratio: { value: 1 },
        knee: { value: 0 },
        attack: { value: 0 },
        release: { value: 0 },
      });
      createdNodes.push(node);
      return node;
    }),
    createOscillator: vi.fn(() => {
      const node = makeMockNode({
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
        type: "sine",
      });
      createdNodes.push(node);
      return node;
    }),
  };
}

let mockCtx: ReturnType<typeof makeMockAudioContext>;

beforeEach(() => {
  createdNodes.length = 0;
  mockCtx = makeMockAudioContext();
  vi.stubGlobal(
    "AudioContext",
    vi.fn(function MockAudioContext(this: unknown) {
      return mockCtx;
    }),
  );
});

async function importFresh() {
  vi.resetModules();
  return import("../audioUtils");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("playArpeggio — return shape", () => {
  it("returns an object with cancel() and done Promise", async () => {
    vi.useFakeTimers();
    const { playArpeggio } = await importFresh();

    const handle = playArpeggio([{ index: 0 }], { duration: 50 });
    expect(typeof handle.cancel).toBe("function");
    expect(handle.done).toBeInstanceOf(Promise);

    handle.cancel();
    vi.runAllTimers();
    await handle.done;
    vi.useRealTimers();
  });
});

describe("playArpeggio — cancel", () => {
  it("cancel() calls stopChord (disconnects oscillators)", async () => {
    vi.useFakeTimers();
    const { playArpeggio } = await importFresh();

    const handle = playArpeggio([{ index: 0 }, { index: 4 }], { duration: 200 });

    // Cancel immediately after the first note starts
    handle.cancel();

    const oscillators = createdNodes.filter((n) => n.start !== undefined);
    expect(oscillators.length).toBeGreaterThan(0);
    for (const osc of oscillators) {
      expect(osc.stop).toHaveBeenCalled();
    }

    vi.runAllTimers();
    await handle.done;
    vi.useRealTimers();
  });

  it("done resolves after cancel (does not hang)", async () => {
    vi.useFakeTimers();
    const { playArpeggio } = await importFresh();

    const handle = playArpeggio([{ index: 0 }, { index: 7 }], { duration: 500 });
    handle.cancel();

    vi.runAllTimers();
    await expect(handle.done).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

describe("playArpeggio — plays notes sequentially", () => {
  it("schedules all notes immediately upon invocation", async () => {
    vi.useFakeTimers();
    const { playArpeggio } = await importFresh();

    playArpeggio([{ index: 0 }, { index: 4 }, { index: 7 }], { duration: 100 });

    const oscillators = createdNodes.filter((n) => n.start !== undefined);
    expect(oscillators).toHaveLength(3);
    expect(oscillators[0]!.start).toHaveBeenCalledWith(0);
    expect(oscillators[1]!.start).toHaveBeenCalledWith(0.1);
    expect(oscillators[2]!.start).toHaveBeenCalledWith(0.2);

    vi.runAllTimers();
    vi.useRealTimers();
  });

  it("accepts explicit start offsets and note durations", async () => {
    vi.useFakeTimers();
    const { playArpeggio } = await importFresh();

    playArpeggio(
      [{ index: 0 }, { index: 4 }],
      {
        startOffsetsMs: [0, 250],
        noteDurationsMs: [300, 500],
        totalDurationMs: 750,
      },
    );

    const oscillators = createdNodes.filter((n) => n.start !== undefined);
    expect(oscillators).toHaveLength(2);
    expect(oscillators[0]!.start).toHaveBeenCalledWith(0);
    expect(oscillators[0]!.stop).toHaveBeenCalledWith(0.3);
    expect(oscillators[1]!.start).toHaveBeenCalledWith(0.25);
    expect(oscillators[1]!.stop).toHaveBeenCalledWith(0.75);

    vi.runAllTimers();
    vi.useRealTimers();
  });
});
