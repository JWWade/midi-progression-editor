export type VoiceLeadingStyle =
  | 'close'      // Tightly Stacked: closeVoiceChord for every chord
  | 'minimal'    // Smooth Stepwise (default): closeVoiceChord for chord 1, minimalMotionVoicing for subsequent
  | 'open'       // Wide & Spacious: openVoiceChord for every chord
  | 'flexible';  // Flexible Voices: chordMatchingFlexible-based voicing with strictness penalty

export type MotionBias = 'up' | 'neutral' | 'down';

export type ExtensionRegisterPolicy =
  | 'strict'   // keep 9/11/13 in upper-extension register
  | 'relaxed'; // allow folded pitch-class placement when motion prefers it

export interface VoiceLeadingConfig {
  style: VoiceLeadingStyle;
  /** Maps directly to penalty in chordMatchingFlexible (0–4). Default: 2. */
  strictness: number;
  motionBias: MotionBias;
  /** Starting octave for the first chord (2–6). Default: 4. */
  startOctave: number;
  /** Extension-register handling policy. Default: strict. */
  extensionRegisterPolicy: ExtensionRegisterPolicy;
}
