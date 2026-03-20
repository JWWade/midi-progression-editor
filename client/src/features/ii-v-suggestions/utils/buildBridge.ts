import type { Chord } from "@/features/current-chord/types";
import type { ChordType } from "@/features/chord/types";
import type { BridgeType } from "../types";

export interface DiatonicIIV {
  iiRoot: number;
  VRoot: number;
  iiQuality: ChordType;
  VQuality: "dom7";
}

export interface BridgeCandidate {
  bridge: Chord[];
  type: BridgeType;
}

/**
 * Builds the diatonic ii–V pair targeting the given chord.
 *
 * For a minor-key target (quality "minor" or "min7"), the ii chord is a
 * half-diminished seventh; otherwise it is a minor seventh.
 */
export function buildDiatonicIIV(target: Chord): DiatonicIIV {
  const iiRoot = (target.root + 2) % 12;
  const VRoot = (target.root + 7) % 12;
  const isMinorTarget =
    target.quality === "minor" || target.quality === "min7";
  const iiQuality: ChordType = isMinorTarget ? "halfdim7" : "min7";
  return { iiRoot, VRoot, iiQuality, VQuality: "dom7" };
}

/**
 * Generates all bridge candidates for the given source→target pair.
 * Only candidates whose length is ≤ maxBridgeLength are produced.
 */
export function generateCandidates(
  _source: Chord,
  target: Chord,
  maxBridgeLength: number,
): BridgeCandidate[] {
  const candidates: BridgeCandidate[] = [];
  const { iiRoot, VRoot, iiQuality, VQuality } = buildDiatonicIIV(target);

  const ii: Chord = { root: iiRoot, quality: iiQuality };
  const V: Chord = { root: VRoot, quality: VQuality };
  const tritoneRoot = (VRoot + 6) % 12;
  const tritoneV: Chord = { root: tritoneRoot, quality: "dom7" };

  // Length-2 candidates
  if (maxBridgeLength >= 2) {
    candidates.push({ bridge: [ii, V], type: "diatonic-ii-v" });
    candidates.push({ bridge: [ii, tritoneV], type: "tritone-sub-ii-v" });

    const chrIIRoot = (iiRoot - 1 + 12) % 12;
    const chrVRoot = (VRoot - 1 + 12) % 12;
    const chrII: Chord = { root: chrIIRoot, quality: "min7" };
    const chrV: Chord = { root: chrVRoot, quality: "dom7" };
    candidates.push({ bridge: [chrII, chrV], type: "chromatic-ii-v" });
  }

  // Length-1 candidates
  if (maxBridgeLength >= 1) {
    candidates.push({ bridge: [V], type: "incomplete-v" });
    candidates.push({ bridge: [ii], type: "incomplete-ii" });
    candidates.push({ bridge: [tritoneV], type: "tritone-sub" });
  }

  // Length-3 candidate
  if (maxBridgeLength >= 3) {
    const viRoot = (iiRoot + 9) % 12;
    const vi: Chord = { root: viRoot, quality: "min7" };
    candidates.push({ bridge: [vi, ii, V], type: "backchain-vi-ii-v" });
  }

  // Length-4 candidate
  if (maxBridgeLength >= 4) {
    const viRoot = (iiRoot + 9) % 12;
    const vi: Chord = { root: viRoot, quality: "min7" };
    const IIIRoot = (viRoot + 4) % 12;
    const III: Chord = { root: IIIRoot, quality: "dom7" };
    candidates.push({
      bridge: [III, vi, ii, V],
      type: "backchain-iii-vi-ii-v",
    });
  }

  return candidates;
}
