/**
 * Voice-leading voicing utilities.
 *
 * MIDI formula (consistent with audioUtils.ts):
 *   midiNote = 12 * (octave + 1) + pitchClass
 * e.g. C4 = 12 * 5 + 0 = 60, E4 = 12 * 5 + 4 = 64
 */

import type { MotionBias } from "../types";

const DEFAULT_START_OCTAVE = 4;

/**
 * Voices a chord in close position starting from a given octave.
 *
 * @param pitchClasses - Pitch classes (0–11); first element is the root.
 * @param startOctave  - Octave in which the root is placed (default: 4).
 * @returns Absolute MIDI note numbers in close position.
 */
export function closeVoiceChord(
  pitchClasses: number[],
  startOctave: number = DEFAULT_START_OCTAVE,
): number[] {
  if (pitchClasses.length === 0) return [];

  const result: number[] = [];
  // Place root at startOctave using the app-wide formula
  let prevMidi = 12 * (startOctave + 1) + pitchClasses[0];
  result.push(prevMidi);

  for (let i = 1; i < pitchClasses.length; i++) {
    const pc = pitchClasses[i];
    // Find the smallest MIDI note >= prevMidi with this pitch class.
    // MIDI notes with pitch class pc are 12*k + pc for integer k.
    // We need the minimum k such that 12*k + pc >= prevMidi.
    const k = Math.ceil((prevMidi - pc) / 12);
    const midi = 12 * k + pc;
    result.push(midi);
    prevMidi = midi;
  }

  return result;
}

/**
 * Voices the next chord by minimising total semitone movement from the previous chord.
 * Each voice independently selects the octave placement closest to its previous MIDI note.
 * Tie-break behaviour is controlled by `bias`:
 *   - `'neutral'` (default): no preference — keeps the rounded base candidate.
 *   - `'down'`: prefer lower MIDI note on a tie.
 *   - `'up'`: prefer higher MIDI note on a tie.
 *
 * @param prevMidi        - MIDI note numbers of the previous voiced chord.
 * @param nextPitchClasses - Pitch classes (0–11) for the next chord.
 * @param bias            - Directional tie-break preference (default: 'neutral').
 * @returns Absolute MIDI note numbers with minimal voice-leading motion.
 */
export function minimalMotionVoicing(
  prevMidi: number[],
  nextPitchClasses: number[],
  bias: MotionBias = 'neutral',
): number[] {
  if (prevMidi.length === 0) return [];
  return Array.from({ length: nextPitchClasses.length }, (_, i) => {
    // For voices beyond prevMidi's range (e.g. going from a triad to a seventh
    // chord), anchor to the last previous note so the new voice is placed nearby
    // rather than being silently dropped.
    const prev = prevMidi[Math.min(i, prevMidi.length - 1)];
    return selectClosestMidi(prev, nextPitchClasses[i]!, bias);
  });
}

/**
 * Select the absolute MIDI note with pitch class `pc` closest to `prev`,
 * applying the given directional `bias` when two candidates are equidistant.
 *
 * @param prev - Reference MIDI note number.
 * @param pc   - Target pitch class (0–11).
 * @param bias - Directional tie-break preference.
 */
function selectClosestMidi(prev: number, pc: number, bias: MotionBias): number {
  // Nearest MIDI note with pitch class pc to prev:
  // MIDI notes with pitch class pc are 12*k + pc; find k that minimises |12*k + pc - prev|.
  const k = Math.round((prev - pc) / 12);
  const base = 12 * k + pc;
  // Check base and its immediate neighbours (handles rounding edge cases).
  const candidates = [base - 12, base, base + 12];
  let best = base;
  for (const candidate of candidates) {
    const candDist = Math.abs(candidate - prev);
    const bestDist = Math.abs(best - prev);
    if (candDist < bestDist) {
      best = candidate;
    } else if (candDist === bestDist) {
      if (bias === 'down' && candidate < best) best = candidate;
      else if (bias === 'up' && candidate > best) best = candidate;
      // 'neutral': no change — keep existing best (= base on first tie encountered)
    }
  }
  return best;
}

/**
 * Voices a chord in open position by spreading alternate voices up one octave,
 * then sorting the result ascending.
 *
 * Starting from close voicing, odd-indexed notes (index 1, 3, …) are raised by
 * 12 semitones to open up the voicing.  The resulting notes are sorted in
 * ascending order so the output is always a well-formed voicing.
 *
 * Examples (default octave 4):
 *   - C major triad  [0,4,7]       → close [60,64,67] → spread [60,76,67] → sort [60,67,76]
 *   - C maj7         [0,4,7,11]    → close [60,64,67,71] → spread [60,76,67,83] → sort [60,67,76,83]
 *
 * @param pitchClasses - Pitch classes (0–11); first element is the root.
 * @param startOctave  - Octave in which the root is placed (default: 4).
 * @returns Absolute MIDI note numbers in open position, sorted ascending.
 */
export function openVoiceChord(
  pitchClasses: number[],
  startOctave: number = DEFAULT_START_OCTAVE,
): number[] {
  if (pitchClasses.length === 0) return [];
  const close = closeVoiceChord(pitchClasses, startOctave);
  const spread = close.map((midi, i) => (i % 2 === 1 ? midi + 12 : midi));
  return spread.slice().sort((a, b) => a - b);
}
