export { closeVoiceChord, minimalMotionVoicing, openVoiceChord } from "./utils/voicing";
export {
  pitchClassDistance,
  chordDistance,
  chordMatching,
  chordDistanceFlexible,
  chordMatchingFlexible,
} from "./utils/chordDistance";
export {
  normalize,
  transpose,
  invert,
  canonicalizeChord,
} from "./utils/canonicalizeChord";
export type { CanonicalizationMode, CanonicalChord } from "./utils/canonicalizeChord";
export type { VoiceLeadingStyle, MotionBias, VoiceLeadingConfig } from "./types";
