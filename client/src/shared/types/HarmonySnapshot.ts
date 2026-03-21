import type { Chord } from "@/features/current-chord/types";
import type { ScaleContext } from "./ScaleContext";

/**
 * Semantic version of the HarmonySnapshot schema.
 *
 * Increment when fields are removed or given incompatible semantics.  Adding
 * new *optional* fields is backward-compatible and does not require a bump.
 */
export type HarmonySnapshotVersion = 1;

/**
 * Descriptive metadata attached to a harmony snapshot.  All fields except
 * `createdAt` are optional so that snapshots can be created with minimal
 * ceremony and enriched later.
 */
export interface HarmonyMetadata {
  /** ISO 8601 creation timestamp (set automatically by `createHarmonySnapshot`). */
  createdAt: string;
  /** Optional human-readable label for the progression (e.g. "Autumn Leaves A section"). */
  label?: string;
  /**
   * Free-form tags for cataloging and retrieval.
   * Examples: ["jazz", "ii-V", "key-C", "minor-tonality"]
   */
  tags?: string[];
  /** Beats per minute at capture time, if known. */
  bpm?: number;
  /** Number of beats each chord occupies at capture time, if known. */
  beatsPerChord?: number;
}

/**
 * A versioned, serialisable snapshot of a chord progression and its harmonic
 * context.
 *
 * **Intended uses:**
 * - Persistence / import-export (JSON files or localStorage)
 * - MIDI export metadata
 * - ML feature extraction and training-data cataloging
 * - Cataloging system entries
 *
 * **Schema guarantees (v1):**
 * - `schemaVersion === 1` identifies this exact field layout.
 * - `progression` is always an array (may be empty).
 * - `scaleContext` is either a {@link ScaleContext} object or `null`.
 * - `metadata.createdAt` is always present as an ISO 8601 string.
 * - Future backward-compatible additions will only append new *optional* fields.
 * - Incompatible changes will use `schemaVersion === 2` (or higher) so that
 *   consumers can branch on `schemaVersion` without breaking existing code.
 */
export interface HarmonySnapshot {
  schemaVersion: HarmonySnapshotVersion;
  /** Ordered chord progression. */
  progression: Chord[];
  /** Diatonic context in which the progression lives, or `null` when unset. */
  scaleContext: ScaleContext | null;
  /** Descriptive metadata for display, tagging, and ML labeling. */
  metadata: HarmonyMetadata;
}

/**
 * Creates a {@link HarmonySnapshot} from the minimal required inputs.
 *
 * `metadata.createdAt` is set to the current UTC time.  Additional metadata
 * fields (label, tags, bpm, beatsPerChord) can be supplied via `partialMeta`.
 *
 * @example
 * ```ts
 * const snapshot = createHarmonySnapshot(chords, { root: 0, mode: "major" }, {
 *   label: "Autumn Leaves",
 *   tags: ["jazz", "standard"],
 *   bpm: 120,
 * });
 * ```
 */
export function createHarmonySnapshot(
  progression: Chord[],
  scaleContext: ScaleContext | null,
  partialMeta: Partial<HarmonyMetadata> = {},
): HarmonySnapshot {
  return {
    schemaVersion: 1,
    progression,
    scaleContext,
    metadata: {
      createdAt: new Date().toISOString(),
      ...partialMeta,
    },
  };
}

/**
 * Type guard: returns `true` when `value` is a well-formed {@link HarmonySnapshot}
 * with the current schema version (`schemaVersion === 1`).
 *
 * Use this before deserialising untrusted JSON (e.g. from localStorage,
 * imported files, or an API response) to avoid runtime errors.
 *
 * @example
 * ```ts
 * const raw: unknown = JSON.parse(stored);
 * if (isHarmonySnapshot(raw)) {
 *   // raw is HarmonySnapshot here
 * }
 * ```
 */
export function isHarmonySnapshot(value: unknown): value is HarmonySnapshot {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v["schemaVersion"] !== 1) return false;
  if (!Array.isArray(v["progression"])) return false;
  if (v["scaleContext"] !== null && typeof v["scaleContext"] !== "object")
    return false;
  const meta = v["metadata"];
  if (typeof meta !== "object" || meta === null) return false;
  if (
    typeof (meta as Record<string, unknown>)["createdAt"] !== "string"
  )
    return false;
  return true;
}
