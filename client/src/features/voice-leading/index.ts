export { closeVoiceChord, minimalMotionVoicing, openVoiceChord } from "./utils/voicing";
export { buildVoicingTargets, enforceVoicingTargets, hasExtensionRegisterTargets } from "./utils/voicingTargets";
export { computeNextChordVoicing, buildProgressionVoicings } from "./utils/progressionVoicing";
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
export type { VoiceLeadingStyle, MotionBias, ExtensionRegisterPolicy, VoiceLeadingConfig } from "./types";
export type { HybridParams, HybridComponents } from "./utils/hybridDistance";
export {
  hybridDistance,
  hybridComponents,
  DEFAULT_HYBRID_PARAMS,
  pitchClassToUnitCircle,
  pcsUnitCentroid,
  pcsPolygonArea,
  pcsRadialSpread,
} from "./utils/hybridDistance";
