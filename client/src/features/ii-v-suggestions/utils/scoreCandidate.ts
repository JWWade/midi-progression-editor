import type { Chord } from "@/features/current-chord/types";
import { SCALE_INTERVALS } from "@/features/scale/types/scales";
import type { ScaleType } from "@/features/scale/types/scales";
import { closeVoiceChord, minimalMotionVoicing } from "@/features/voice-leading";
import { computeSharedNotes } from "@/features/progression-sidebar/utils/pairMetrics";
import { getDiatonicIndices } from "@/features/scale/utils";
import { getChordPitchClasses } from "@/features/chord/utils";

/**
 * Computes the total semitone voice-leading cost between two adjacent chords.
 * Voices the `from` chord in close position, then minimises motion to `to`.
 */
function voiceLeadingCost(from: Chord, to: Chord): number {
  const fromPcs = getChordPitchClasses(from);
  const toPcs = getChordPitchClasses(to);
  if (fromPcs.length === 0 || toPcs.length === 0) return 0;

  const fromMidi = closeVoiceChord(fromPcs);
  const toMidi = minimalMotionVoicing(fromMidi, toPcs);

  // Sum motion over common voices only to avoid double-counting
  const commonVoices = Math.min(fromMidi.length, toMidi.length);
  let cost = 0;
  for (let i = 0; i < commonVoices; i++) {
    cost += Math.abs(fromMidi[i] - toMidi[i]);
  }
  return cost;
}

/**
 * Sums the voice-leading cost across the full chain:
 * source → bridge[0] → … → bridge[n-1] → target.
 */
export function totalVoiceLeadingCost(
  source: Chord,
  bridge: Chord[],
  target: Chord,
): number {
  const chain = [source, ...bridge, target];
  let total = 0;
  for (let i = 0; i < chain.length - 1; i++) {
    total += voiceLeadingCost(chain[i], chain[i + 1]);
  }
  return total;
}

/**
 * Returns the proportion of shared pitch classes across the full chain
 * (source → bridge → target), averaged over adjacent pairs.
 * Returns a value in [0, 1].
 */
export function sharedNoteBonus(
  source: Chord,
  bridge: Chord[],
  target: Chord,
): number {
  const chain = [source, ...bridge, target];
  let total = 0;
  for (let i = 0; i < chain.length - 1; i++) {
    total += computeSharedNotes(chain[i], chain[i + 1]).proportion;
  }
  return total / (chain.length - 1);
}

/**
 * Returns the proportion of bridge chord tones that are diatonic to the given
 * scale. Returns 0 if scale is null or the scale has fewer than 7 notes.
 */
export function diatonicBonus(
  bridge: Chord[],
  scale: { root: number; mode: string } | null,
): number {
  if (scale === null) return 0;

  // Guard: unknown mode (e.g. pentatonic subset) → no diatonic bonus
  if (!(scale.mode in SCALE_INTERVALS)) return 0;

  const diatonic = getDiatonicIndices(scale.root, scale.mode as ScaleType);
  if (diatonic.size < 7) return 0;

  let diatonicCount = 0;
  let totalCount = 0;

  for (const chord of bridge) {
    for (const pc of getChordPitchClasses(chord)) {
      totalCount++;
      if (diatonic.has(pc)) diatonicCount++;
    }
  }

  return totalCount === 0 ? 0 : diatonicCount / totalCount;
}

const COMPLEXITY_PENALTY: Record<number, number> = {
  1: 0,
  2: 0.25,
  3: 0.5,
  4: 1.0,
};

/**
 * Returns a penalty based on the number of chords in the bridge.
 * Longer bridges are penalised more heavily.
 */
export function complexityPenalty(bridge: Chord[]): number {
  return COMPLEXITY_PENALTY[bridge.length] ?? 1.0;
}

/**
 * Normalises a raw voice-leading cost to [0, 1].
 * A cost of 24 semitones or more is treated as the maximum.
 */
function normalizeVL(cost: number): number {
  return Math.min(cost / 24, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Scores a bridge candidate on a normalised 0–1 scale.
 *
 * raw = sharedNoteBonus * 0.30
 *     + diatonicBonus   * 0.20
 *     - normalizeVL(totalVoiceLeadingCost) * 0.40
 *     - complexityPenalty * 0.10
 *
 * score = clamp(raw / 0.50, 0, 1)
 */
export function scoreCandidate(
  bridge: Chord[],
  source: Chord,
  target: Chord,
  scale: { root: number; mode: string } | null,
): number {
  const sn = sharedNoteBonus(source, bridge, target);
  const dt = diatonicBonus(bridge, scale);
  const vl = normalizeVL(totalVoiceLeadingCost(source, bridge, target));
  const cp = complexityPenalty(bridge);

  const raw = sn * 0.3 + dt * 0.2 - vl * 0.4 - cp * 0.1;
  return clamp(raw / 0.5, 0, 1);
}
