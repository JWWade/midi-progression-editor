import { describe, it, expect, vi } from "vitest";
import { createHarmonySnapshot, isHarmonySnapshot } from "../HarmonySnapshot";
import type { HarmonySnapshot } from "../HarmonySnapshot";
import type { Chord } from "@/features/current-chord/types";
import type { ScaleContext } from "../ScaleContext";

// ── Fixtures ────────────────────────────────────────────────────────────────

const chords: Chord[] = [
  { root: 0, quality: "major" },
  { root: 7, quality: "dom7" },
];

const cMajorScale: ScaleContext = { root: 0, mode: "major" };

// ── createHarmonySnapshot ────────────────────────────────────────────────────

describe("createHarmonySnapshot", () => {
  it("sets schemaVersion to 1", () => {
    const snap = createHarmonySnapshot(chords, cMajorScale);
    expect(snap.schemaVersion).toBe(1);
  });

  it("stores progression verbatim", () => {
    const snap = createHarmonySnapshot(chords, cMajorScale);
    expect(snap.progression).toEqual(chords);
  });

  it("stores scaleContext verbatim", () => {
    const snap = createHarmonySnapshot(chords, cMajorScale);
    expect(snap.scaleContext).toEqual(cMajorScale);
  });

  it("accepts null scaleContext", () => {
    const snap = createHarmonySnapshot(chords, null);
    expect(snap.scaleContext).toBeNull();
  });

  it("accepts an empty progression", () => {
    const snap = createHarmonySnapshot([], null);
    expect(snap.progression).toEqual([]);
  });

  it("metadata.createdAt is a valid ISO 8601 date string", () => {
    const snap = createHarmonySnapshot(chords, null);
    const date = new Date(snap.metadata.createdAt);
    expect(isNaN(date.getTime())).toBe(false);
  });

  it("metadata.createdAt reflects the current time", () => {
    const before = Date.now();
    const snap = createHarmonySnapshot(chords, null);
    const after = Date.now();
    const snapTime = new Date(snap.metadata.createdAt).getTime();
    expect(snapTime).toBeGreaterThanOrEqual(before);
    expect(snapTime).toBeLessThanOrEqual(after);
  });

  it("merges optional label into metadata", () => {
    const snap = createHarmonySnapshot(chords, null, { label: "Autumn Leaves" });
    expect(snap.metadata.label).toBe("Autumn Leaves");
  });

  it("merges optional tags into metadata", () => {
    const snap = createHarmonySnapshot(chords, null, {
      tags: ["jazz", "ii-V"],
    });
    expect(snap.metadata.tags).toEqual(["jazz", "ii-V"]);
  });

  it("merges optional bpm into metadata", () => {
    const snap = createHarmonySnapshot(chords, null, { bpm: 180 });
    expect(snap.metadata.bpm).toBe(180);
  });

  it("merges optional beatsPerChord into metadata", () => {
    const snap = createHarmonySnapshot(chords, null, { beatsPerChord: 4 });
    expect(snap.metadata.beatsPerChord).toBe(4);
  });

  it("omits unspecified optional metadata fields", () => {
    const snap = createHarmonySnapshot(chords, null);
    expect(snap.metadata.label).toBeUndefined();
    expect(snap.metadata.tags).toBeUndefined();
    expect(snap.metadata.bpm).toBeUndefined();
    expect(snap.metadata.beatsPerChord).toBeUndefined();
  });

  it("round-trips through JSON serialisation", () => {
    const snap = createHarmonySnapshot(chords, cMajorScale, {
      label: "round-trip",
      tags: ["test"],
      bpm: 120,
    });
    const parsed: unknown = JSON.parse(JSON.stringify(snap));
    expect(isHarmonySnapshot(parsed)).toBe(true);
    const restored = parsed as HarmonySnapshot;
    expect(restored.progression).toEqual(chords);
    expect(restored.scaleContext).toEqual(cMajorScale);
    expect(restored.metadata.label).toBe("round-trip");
  });

  it("createdAt is frozen at creation time even if Date is mocked later", () => {
    const fixedDate = new Date("2026-01-15T10:00:00.000Z");
    const realNow = Date.now;
    Date.now = () => fixedDate.getTime();
    const fakeToISO = vi
      .spyOn(Date.prototype, "toISOString")
      .mockReturnValue("2026-01-15T10:00:00.000Z");
    const snap = createHarmonySnapshot([], null);
    expect(snap.metadata.createdAt).toBe("2026-01-15T10:00:00.000Z");
    fakeToISO.mockRestore();
    Date.now = realNow;
  });
});

// ── isHarmonySnapshot ────────────────────────────────────────────────────────

describe("isHarmonySnapshot", () => {
  it("returns true for a valid snapshot with scaleContext", () => {
    const snap = createHarmonySnapshot(chords, cMajorScale);
    expect(isHarmonySnapshot(snap)).toBe(true);
  });

  it("returns true for a valid snapshot with null scaleContext", () => {
    const snap = createHarmonySnapshot(chords, null);
    expect(isHarmonySnapshot(snap)).toBe(true);
  });

  it("returns true for a valid snapshot with an empty progression", () => {
    const snap = createHarmonySnapshot([], null);
    expect(isHarmonySnapshot(snap)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isHarmonySnapshot(null)).toBe(false);
  });

  it("returns false for a primitive string", () => {
    expect(isHarmonySnapshot("not-an-object")).toBe(false);
  });

  it("returns false for a plain object without schemaVersion", () => {
    expect(
      isHarmonySnapshot({ progression: [], scaleContext: null }),
    ).toBe(false);
  });

  it("returns false when schemaVersion is 2", () => {
    const snap = createHarmonySnapshot([], null);
    expect(isHarmonySnapshot({ ...snap, schemaVersion: 2 })).toBe(false);
  });

  it("returns false when schemaVersion is a string '1'", () => {
    const snap = createHarmonySnapshot([], null);
    expect(isHarmonySnapshot({ ...snap, schemaVersion: "1" })).toBe(false);
  });

  it("returns false when progression is not an array", () => {
    const snap = createHarmonySnapshot([], null);
    expect(isHarmonySnapshot({ ...snap, progression: null })).toBe(false);
  });

  it("returns false when metadata is missing", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { metadata: _metadata, ...noMeta } = createHarmonySnapshot([], null);
    expect(isHarmonySnapshot(noMeta)).toBe(false);
  });

  it("returns false when metadata.createdAt is missing", () => {
    const snap = createHarmonySnapshot([], null);
    expect(
      isHarmonySnapshot({ ...snap, metadata: { label: "no-date" } }),
    ).toBe(false);
  });

  it("returns false when metadata.createdAt is a number", () => {
    const snap = createHarmonySnapshot([], null);
    expect(
      isHarmonySnapshot({
        ...snap,
        metadata: { ...snap.metadata, createdAt: 1234567890 },
      }),
    ).toBe(false);
  });

  it("returns false when scaleContext is a string", () => {
    const snap = createHarmonySnapshot([], null);
    expect(isHarmonySnapshot({ ...snap, scaleContext: "C major" })).toBe(false);
  });

  it("returns true when scaleContext is a valid object (structural check only)", () => {
    const snap = createHarmonySnapshot([], null);
    // isHarmonySnapshot only checks the outer shape, not ScaleContext internals
    expect(
      isHarmonySnapshot({ ...snap, scaleContext: { root: 0, mode: "major" } }),
    ).toBe(true);
  });
});

// ── ScaleContext mode constraint ─────────────────────────────────────────────

describe("ScaleContext", () => {
  it("allows all eight supported scale modes", () => {
    const modes: ScaleContext["mode"][] = [
      "major",
      "naturalMinor",
      "harmonicMinor",
      "melodicMinor",
      "dorian",
      "phrygian",
      "lydian",
      "mixolydian",
    ];
    for (const mode of modes) {
      const scale: ScaleContext = { root: 0, mode };
      const snap = createHarmonySnapshot([], scale);
      expect(snap.scaleContext?.mode).toBe(mode);
    }
  });
});
