/**
 * Re-exports the quality-based color system under the canonical color-language
 * feature names so that consumers can import from this module.
 *
 * `QualityColorSet` is the authoritative name for the per-quality color family
 * (aliased from {@link ChordQualityColor}).
 * `ChordColors` is the authoritative data map (aliased from
 * {@link ChordQualityColors}).
 */
export type { ChordQualityColor as QualityColorSet } from "@/features/chord/constants/chordQualityColors";
export { ChordQualityColors as ChordColors } from "@/features/chord/constants/chordQualityColors";
