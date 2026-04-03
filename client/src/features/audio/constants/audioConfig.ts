/**
 * Audio playback configuration and default parameters.
 * Used for tuning synthesis parameters (ADSR, gain, waveform, etc.)
 */

export type OscillatorTypeConfig = "sine" | "square" | "sawtooth" | "triangle";

export interface AudioParams {
  /** Master output gain (0–1) */
  masterVolume: number;

  /** Peak gain after attack phase (0–1) */
  attackPeak: number;

  /** Attack time in seconds */
  attackTime: number;

  /** Decay time in seconds */
  decayTime: number;

  /** Sustain level (0–1) */
  sustainLevel: number;

  /** Release time in seconds */
  releaseTime: number;

  /** Oscillator waveform type */
  oscillatorType: OscillatorTypeConfig;

  /** If true, divide all gain ramp values by note count to prevent polyphony clipping */
  scaleGainByNoteCount: boolean;

  /** Compressor threshold (dB) — set to Infinity to disable the compressor */
  compressorThreshold: number;

  /** Compressor ratio */
  compressorRatio: number;
}

export const DEFAULT_AUDIO_PARAMS: AudioParams = {
  masterVolume: 0.15,
  attackPeak: 0.7,
  attackTime: 0.02,
  decayTime: 0.12,
  sustainLevel: 0.42,
  releaseTime: 0.22,
  oscillatorType: "sine",
  scaleGainByNoteCount: true,
  compressorThreshold: -24,
  compressorRatio: 4,
};
