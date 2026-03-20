// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// ---------------------------------------------------------------------------
// Minimal Web Audio API mock — only the pieces exercised by audioUtils.
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
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    ...extra,
  };
}

/** Tracks every node created during a test so we can assert on them later. */
const createdNodes: MockNode[] = [];

function makeMockAudioContext() {
  const destination = makeMockNode();

  return {
    state: "running" as AudioContextState,
    currentTime: 0,
    destination,
    resume: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(() => {
      const node = makeMockNode({
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
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
  // AudioContext must be a regular function (not an arrow function) so that it
  // can be called with `new`.
  vi.stubGlobal(
    "AudioContext",
    vi.fn(function MockAudioContext(this: unknown) {
      return mockCtx;
    }),
  );
});

// ---------------------------------------------------------------------------
// The module under test. Re-imported fresh for each test via vi.resetModules
// so that the module-level variables (activeOscillators, etc.) are reset.
// ---------------------------------------------------------------------------
async function importFresh() {
  vi.resetModules();
  return import("../audioUtils");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("stopChord", () => {
  it("calls stop() and disconnect() on every active oscillator", async () => {
    vi.useFakeTimers();
    const { playChord, stopChord } = await importFresh();

    const playPromise = playChord([{ index: 0 }, { index: 4 }, { index: 7 }], {
      duration: 500,
    });

    const oscillators = createdNodes.filter((n) => n.start !== undefined);
    expect(oscillators).toHaveLength(3);

    stopChord();

    for (const osc of oscillators) {
      expect(osc.stop).toHaveBeenCalled();
      expect(osc.disconnect).toHaveBeenCalled();
    }

    // Resolve the pending promise so we don't get dangling timers.
    vi.runAllTimers();
    await playPromise;
    vi.useRealTimers();
  });

  it("disconnects the envelope gain, master gain, and compressor nodes", async () => {
    vi.useFakeTimers();
    const { playChord, stopChord } = await importFresh();

    const playPromise = playChord([{ index: 0 }], { duration: 500 });

    const gainNodes = createdNodes.filter((n) => n.gain !== undefined);
    const compressorNode = createdNodes.find((n) => n.threshold !== undefined);

    expect(gainNodes).toHaveLength(2); // envelopeGain + masterGain
    expect(compressorNode).toBeDefined();

    stopChord();

    for (const g of gainNodes) {
      expect(g.disconnect).toHaveBeenCalled();
    }
    expect(compressorNode!.disconnect).toHaveBeenCalled();

    vi.runAllTimers();
    await playPromise;
    vi.useRealTimers();
  });

  it("is safe to call when nothing is playing", async () => {
    const { stopChord } = await importFresh();
    // Must not throw.
    expect(() => stopChord()).not.toThrow();
  });
});

describe("playChord natural-end cleanup", () => {
  it("disconnects all nodes after the duration elapses", async () => {
    vi.useFakeTimers();
    const { playChord } = await importFresh();

    const playPromise = playChord([{ index: 0 }, { index: 4 }], { duration: 300 });

    const gainNodes = createdNodes.filter((n) => n.gain !== undefined);
    const compressorNode = createdNodes.find((n) => n.threshold !== undefined);
    const oscillators = createdNodes.filter((n) => n.start !== undefined);

    expect(gainNodes).toHaveLength(2);
    expect(compressorNode).toBeDefined();

    // Nodes are not yet disconnected while the chord is sounding.
    for (const n of [...gainNodes, compressorNode!]) {
      expect(n.disconnect).not.toHaveBeenCalled();
    }

    // Advance time past the duration so the cleanup setTimeout fires.
    vi.runAllTimers();
    await playPromise;

    for (const n of [...gainNodes, compressorNode!]) {
      expect(n.disconnect).toHaveBeenCalled();
    }
    for (const osc of oscillators) {
      expect(osc.disconnect).toHaveBeenCalled();
    }

    vi.useRealTimers();
  });
});

describe("rapid chord changes (stopChord before timeout)", () => {
  it("does not disconnect the second chord's nodes when the first chord's timeout fires", async () => {
    vi.useFakeTimers();
    const { playChord, stopChord } = await importFresh();

    // First chord
    const firstPlay = playChord([{ index: 0 }], { duration: 300 });
    const firstNodes = createdNodes.slice();

    // Immediately interrupt with a second chord (simulates rapid changes).
    stopChord();
    const secondPlay = playChord([{ index: 7 }], { duration: 300 });
    const secondNodes = createdNodes.filter((n) => !firstNodes.includes(n));

    // Second chord's gain nodes should not yet have been disconnected.
    const secondGains = secondNodes.filter((n) => n.gain !== undefined);
    expect(secondGains.length).toBeGreaterThan(0);
    for (const n of secondGains) {
      expect(n.disconnect).not.toHaveBeenCalled();
    }

    // Advance past both durations — both timeouts fire.
    vi.runAllTimers();
    await Promise.all([firstPlay, secondPlay]);

    // Second chord's nodes must be disconnected by their own timeout.
    for (const n of secondGains) {
      expect(n.disconnect).toHaveBeenCalled();
    }

    vi.useRealTimers();
  });
});
