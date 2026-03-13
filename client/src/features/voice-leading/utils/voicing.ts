/**
 * Voice-leading voicing utilities.
 *
 * MIDI formula (consistent with audioUtils.ts):
 *   midiNote = 12 * (octave + 1) + pitchClass
 * e.g. C4 = 12 * 5 + 0 = 60, E4 = 12 * 5 + 4 = 64
 */

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
 * Tie-break: prefer the lower MIDI note number.
 *
 * @param prevMidi        - MIDI note numbers of the previous voiced chord.
 * @param nextPitchClasses - Pitch classes (0–11) for the next chord.
 * @returns Absolute MIDI note numbers with minimal voice-leading motion.
 */
export function minimalMotionVoicing(
  prevMidi: number[],
  nextPitchClasses: number[],
): number[] {
  const voiceCount = Math.min(prevMidi.length, nextPitchClasses.length);
  return Array.from({ length: voiceCount }, (_, i) => {
    const prev = prevMidi[i];
    const pc = nextPitchClasses[i];
    // Nearest MIDI note with pitch class pc to prev:
    // MIDI notes with pitch class pc are 12*k + pc; find k that minimises |12*k + pc - prev|.
    const k = Math.round((prev - pc) / 12);
    const base = 12 * k + pc;
    // Check base and its immediate neighbours (handles rounding edge cases).
    // Tie-break: prefer lower MIDI note number.
    const candidates = [base - 12, base, base + 12];
    let best = base;
    for (const candidate of candidates) {
      const candDist = Math.abs(candidate - prev);
      const bestDist = Math.abs(best - prev);
      if (candDist < bestDist || (candDist === bestDist && candidate < best)) {
        best = candidate;
      }
    }
    return best;
  });
}
