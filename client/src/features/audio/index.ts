export { initAudioContext, playChord, stopChord, playArpeggio } from "./utils/audioUtils";
export type { PlayOptions, ArpeggioHandle } from "./utils/audioUtils";
export { useAudioPlayback } from "./hooks/useAudioPlayback";
export type { UseAudioPlaybackResult } from "./hooks/useAudioPlayback";
export { useProgressionPlayback } from "./hooks/useProgressionPlayback";
export type { UseProgressionPlaybackResult } from "./hooks/useProgressionPlayback";
export type {
  ArpeggioPattern,
  ArpeggioDirection,
  ArpeggioSubdivision,
} from "./types/arpeggioPattern";
export {
  DEFAULT_ARPEGGIO_PATTERN,
  ARPEGGIO_DIRECTION_LABELS,
  ARPEGGIO_SUBDIVISION_LABELS,
} from "./types/arpeggioPattern";
export {
  generateArpeggioSequence,
  computeArpeggioStartOffsets,
  getSubdivisionBeats,
} from "./utils/arpeggioUtils";
