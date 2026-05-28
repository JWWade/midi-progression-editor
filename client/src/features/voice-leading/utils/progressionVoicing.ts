import type { Chord } from "@/features/current-chord/types";
import {
  closeVoiceChord,
  openVoiceChord,
  minimalMotionVoicing,
} from "./voicing";
import { chordMatchingFlexible } from "./chordDistance";
import { buildVoicingTargets, enforceVoicingTargets } from "./voicingTargets";
import type { MotionBias, VoiceLeadingConfig } from "../types";

function flexibleVoicing(
  previousVoicing: number[],
  nextPitchClasses: number[],
  strictness: number,
  motionBias: MotionBias,
): number[] {
  if (previousVoicing.length === 0) return [];

  const previousPitchClasses = previousVoicing.map((midi) => ((midi % 12) + 12) % 12);
  const { mapping } = chordMatchingFlexible(previousPitchClasses, nextPitchClasses, { penalty: strictness });
  const result: (number | undefined)[] = new Array(nextPitchClasses.length);

  for (const { fromIdx, toIdx } of mapping) {
    const previousMidi = previousVoicing[Math.min(fromIdx, previousVoicing.length - 1)]!;
    const targetPitchClass = nextPitchClasses[toIdx]!;
    const k = Math.round((previousMidi - targetPitchClass) / 12);
    const baseMidi = 12 * k + targetPitchClass;
    const candidates = [baseMidi - 12, baseMidi, baseMidi + 12];
    let best = baseMidi;

    for (const candidate of candidates) {
      const candidateDistance = Math.abs(candidate - previousMidi);
      const bestDistance = Math.abs(best - previousMidi);
      if (candidateDistance < bestDistance) {
        best = candidate;
      } else if (candidateDistance === bestDistance) {
        if (motionBias === "down" && candidate < best) best = candidate;
        else if (motionBias === "up" && candidate > best) best = candidate;
      }
    }

    result[toIdx] = best;
  }

  const fallbackReference = previousVoicing[previousVoicing.length - 1]!;
  for (let i = 0; i < nextPitchClasses.length; i++) {
    if (result[i] !== undefined) continue;

    const targetPitchClass = nextPitchClasses[i]!;
    const k = Math.round((fallbackReference - targetPitchClass) / 12);
    const baseMidi = 12 * k + targetPitchClass;
    const candidates = [baseMidi - 12, baseMidi, baseMidi + 12];
    let best = baseMidi;

    for (const candidate of candidates) {
      const candidateDistance = Math.abs(candidate - fallbackReference);
      const bestDistance = Math.abs(best - fallbackReference);
      if (candidateDistance < bestDistance) {
        best = candidate;
      } else if (candidateDistance === bestDistance) {
        if (motionBias === "down" && candidate < best) best = candidate;
        else if (motionBias === "up" && candidate > best) best = candidate;
      }
    }

    result[i] = best;
  }

  return result as number[];
}

export function computeNextChordVoicing(
  chord: Chord,
  previousVoicing: number[],
  config: VoiceLeadingConfig,
): number[] {
  const targets = buildVoicingTargets(chord);
  const pitchClassSet = targets.pitchClasses;

  const currentVoicing = (() => {
    if (config.style === "close") {
      return closeVoiceChord(pitchClassSet, config.startOctave);
    }
    if (config.style === "open") {
      return openVoiceChord(pitchClassSet, config.startOctave);
    }
    if (config.style === "flexible") {
      return previousVoicing.length === 0
        ? closeVoiceChord(pitchClassSet, config.startOctave)
        : flexibleVoicing(previousVoicing, pitchClassSet, config.strictness, config.motionBias);
    }
    return previousVoicing.length === 0
      ? closeVoiceChord(pitchClassSet, config.startOctave)
      : minimalMotionVoicing(previousVoicing, pitchClassSet, config.motionBias);
  })();

  return enforceVoicingTargets(currentVoicing, targets, {
    extensionRegisterPolicy: config.extensionRegisterPolicy,
  });
}

export function buildProgressionVoicings(
  chords: Chord[],
  config: VoiceLeadingConfig,
): number[][] {
  const voicings: number[][] = [];
  let previousVoicing: number[] = [];

  for (const chord of chords) {
    const voicing = computeNextChordVoicing(chord, previousVoicing, config);
    voicings.push(voicing);
    previousVoicing = voicing;
  }

  return voicings;
}