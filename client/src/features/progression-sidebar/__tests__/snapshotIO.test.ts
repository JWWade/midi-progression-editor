import { describe, it, expect } from "vitest";
import { exportSnapshot, importSnapshot } from "../utils/snapshotIO";
import type { Chord } from "@/features/current-chord/types";
import type { ScaleContext } from "@/shared/types/ScaleContext";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const chords: Chord[] = [
  { root: 0, quality: "major" },
  { root: 7, quality: "dom7" },
];

const cMajor: ScaleContext = { root: 0, mode: "major" };

// ── exportSnapshot ────────────────────────────────────────────────────────────

describe("exportSnapshot", () => {
  it("produces valid JSON", () => {
    const json = exportSnapshot(chords, cMajor);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("exported JSON passes isHarmonySnapshot guard via importSnapshot", () => {
    const json = exportSnapshot(chords, cMajor);
    const result = importSnapshot(json);
    expect(result).not.toBeNull();
  });

  it("embeds progression verbatim", () => {
    const json = exportSnapshot(chords, cMajor);
    const snap = importSnapshot(json)!;
    expect(snap.progression).toEqual(chords);
  });

  it("embeds scaleContext verbatim", () => {
    const json = exportSnapshot(chords, cMajor);
    const snap = importSnapshot(json)!;
    expect(snap.scaleContext).toEqual(cMajor);
  });

  it("accepts null scaleContext", () => {
    const json = exportSnapshot(chords, null);
    const snap = importSnapshot(json)!;
    expect(snap).not.toBeNull();
    expect(snap.scaleContext).toBeNull();
  });

  it("embeds partial metadata", () => {
    const json = exportSnapshot(chords, cMajor, { bpm: 120, beatsPerChord: 2 });
    const snap = importSnapshot(json)!;
    expect(snap.metadata.bpm).toBe(120);
    expect(snap.metadata.beatsPerChord).toBe(2);
  });

  it("sets schemaVersion to 1", () => {
    const json = exportSnapshot([], null);
    const snap = importSnapshot(json)!;
    expect(snap.schemaVersion).toBe(1);
  });
});

// ── importSnapshot ────────────────────────────────────────────────────────────

describe("importSnapshot", () => {
  it("returns null for invalid JSON", () => {
    expect(importSnapshot("not json")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(importSnapshot("")).toBeNull();
  });

  it("returns null when schemaVersion is wrong", () => {
    const bad = JSON.stringify({ schemaVersion: 99, progression: [], scaleContext: null, metadata: { createdAt: new Date().toISOString() } });
    expect(importSnapshot(bad)).toBeNull();
  });

  it("returns null when progression is missing", () => {
    const bad = JSON.stringify({ schemaVersion: 1, scaleContext: null, metadata: { createdAt: new Date().toISOString() } });
    expect(importSnapshot(bad)).toBeNull();
  });

  it("returns null when metadata.createdAt is missing", () => {
    const bad = JSON.stringify({ schemaVersion: 1, progression: [], scaleContext: null, metadata: {} });
    expect(importSnapshot(bad)).toBeNull();
  });

  it("returns null for a plain number", () => {
    expect(importSnapshot("42")).toBeNull();
  });

  it("round-trips a full snapshot", () => {
    const original = exportSnapshot(chords, cMajor, { label: "test", bpm: 90 });
    const restored = importSnapshot(original)!;
    expect(restored.progression).toEqual(chords);
    expect(restored.scaleContext).toEqual(cMajor);
    expect(restored.metadata.label).toBe("test");
    expect(restored.metadata.bpm).toBe(90);
  });
});
