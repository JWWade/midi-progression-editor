export { getChordPitchClasses } from "./getChordPitchClasses";
export { rerootChord } from "./rerootChord";
export {
  normalizePitchClass,
  normalizePitchClasses,
  dedupeNormalizedPitchClasses,
  uniqueSortedPitchClasses,
} from "./pitchClass";
export type { ChordCandidate } from "./chordIdentity";
export { findBestChordIdentity, findBestQualityForRoot, findChordCandidates } from "./chordIdentity";
