/**
 * Snapshot import / export utilities.
 *
 * Provides `exportSnapshot` and `importSnapshot` to serialise and deserialise
 * {@link HarmonySnapshot} values to/from JSON strings.  All imported data is
 * validated with {@link isHarmonySnapshot} before being returned.
 */

import type { Chord } from "@/features/current-chord/types";
import type { ScaleContext } from "@/shared/types/ScaleContext";
import type { HarmonyMetadata, HarmonySnapshot } from "@/shared/types/HarmonySnapshot";
import {
  createHarmonySnapshot,
  isHarmonySnapshot,
} from "@/shared/types/HarmonySnapshot";
import { createLogger } from "@/shared/utils/logger";

const log = createLogger("snapshotIO");

/**
 * Serialises the current session state into a JSON string that can be saved
 * to a file and later re-imported with {@link importSnapshot}.
 *
 * @param chords        The ordered chord progression to capture.
 * @param scaleContext  The active diatonic context, or `null` when unset.
 * @param partialMeta   Optional metadata to embed (bpm, beatsPerChord, label, …).
 * @returns             A pretty-printed JSON string containing a {@link HarmonySnapshot}.
 */
export function exportSnapshot(
  chords: Chord[],
  scaleContext: ScaleContext | null,
  partialMeta: Partial<HarmonyMetadata> = {},
): string {
  const snapshot = createHarmonySnapshot(chords, scaleContext, partialMeta);
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Parses and validates a JSON string as a {@link HarmonySnapshot}.
 *
 * Returns `null` (instead of throwing) when the input is not valid JSON or
 * does not satisfy the {@link isHarmonySnapshot} guard, so callers can show a
 * user-visible error message instead of crashing.
 *
 * @param json  The raw JSON string to parse (e.g. from a loaded file).
 * @returns     A validated {@link HarmonySnapshot}, or `null` on failure.
 */
export function importSnapshot(json: string): HarmonySnapshot | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    log.debug("importSnapshot: JSON.parse failed", err);
    return null;
  }
  if (!isHarmonySnapshot(parsed)) {
    log.debug("importSnapshot: isHarmonySnapshot guard rejected the payload");
    return null;
  }
  return parsed;
}
