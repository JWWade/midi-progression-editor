import type { ChordType } from "@/features/chord/types";
import type { ChordExtension } from "@/features/chord/types";

export type PrimitiveShape = "equilateral-triangle" | "suspended-triangle" | "square" | "rectangle" | "symmetrical-trapezoid";

/**
 * Core domain model representing a single chord in the progression editor.
 *
 * **Backward-compatibility contract (shared domain kernel):**
 * `Chord` is imported by many feature modules and by the serialised
 * `HarmonySnapshot` format (`schemaVersion: 1`). Treat it as a stable, versioned type:
 * - New **optional** fields may be added without a version bump.
 * - No field may be **removed** or given an **incompatible type** without
 *   coordinating all consumers and incrementing `HarmonySnapshotVersion`.
 *
 * Only `root` and `quality` are required; all other fields are optional
 * so that minimal chord representations remain valid.
 */
export interface Chord {
  /** Root pitch-class index (0 = C, 1 = C♯/D♭, …, 11 = B). */
  root: number;
  /** Chord quality (e.g. `"major"`, `"min7"`, `"quartal"`). */
  quality: ChordType;
  extensions?: ChordExtension[];

  /** Optional array of note indices [0-11] when chord is custom (not a named chord).
   *  When present, root/quality represent the *derived best-fit* chord for display purposes only.
   */
  customNotes?: number[];
  /** Optional primitive-shape metadata for geometry-first chord presets. */
  primitiveShape?: PrimitiveShape;
}
