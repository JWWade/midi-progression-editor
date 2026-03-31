import type { Chord } from "@/features/current-chord/types";
import type { BridgeSuggestion, BridgeType, ScaleContext } from "../types";
import { generateCandidates, type BridgeCandidate } from "./buildBridge";
import { scoreCandidate } from "./scoreCandidate";

/** Returns true if the bridge is trivially identical to the source→target pair. */
function isTrivial(
  bridge: Chord[],
  source: Chord,
  target: Chord,
): boolean {
  if (bridge.length === 0) return true;
  const first = bridge[0];
  const last = bridge[bridge.length - 1];
  return (
    first.root === source.root &&
    first.quality === source.quality &&
    last.root === target.root &&
    last.quality === target.quality
  );
}

/** Returns a deduplication key for a bridge based on root+quality sequence. */
function bridgeKey(bridge: Chord[]): string {
  return bridge.map((c) => `${c.root}:${c.quality}`).join("|");
}

/** Builds a short label for a bridge suggestion using root indices. */
function buildLabel(type: BridgeType, target: Chord): string {
  switch (type) {
    case "diatonic-ii-v":
      return `ii–V into root ${target.root}`;
    case "tritone-sub-ii-v":
      return `ii–♭II into root ${target.root} (tritone sub)`;
    case "chromatic-ii-v":
      return `chromatic ii–V into root ${target.root}`;
    case "incomplete-v":
      return `V into root ${target.root}`;
    case "incomplete-ii":
      return `ii into root ${target.root}`;
    case "tritone-sub":
      return `tritone sub into root ${target.root}`;
    case "backchain-vi-ii-v":
      return `vi–ii–V into root ${target.root}`;
    case "backchain-iii-vi-ii-v":
      return `III–vi–ii–V into root ${target.root}`;
  }
}

/** Builds a longer harmonic explanation using root indices. */
function buildExplanation(type: BridgeType, bridge: Chord[], target: Chord): string {
  const roots = bridge.map((c) => c.root).join(", ");
  switch (type) {
    case "diatonic-ii-v":
      return `Diatonic ii–V of root ${target.root}; bridge roots: ${roots}`;
    case "tritone-sub-ii-v":
      return `ii–V with tritone substitution into root ${target.root}; bridge roots: ${roots}`;
    case "chromatic-ii-v":
      return `Chromatic (half-step above) ii–V into root ${target.root}; bridge roots: ${roots}`;
    case "incomplete-v":
      return `Single dominant chord (V) into root ${target.root}; bridge root: ${roots}`;
    case "incomplete-ii":
      return `Single pre-dominant chord (ii) into root ${target.root}; bridge root: ${roots}`;
    case "tritone-sub":
      return `♭II7 substituting V into root ${target.root}; bridge root: ${roots}`;
    case "backchain-vi-ii-v":
      return `Backcycled vi–ii–V into root ${target.root}; bridge roots: ${roots}`;
    case "backchain-iii-vi-ii-v":
      return `Backcycled III–vi–ii–V into root ${target.root}; bridge roots: ${roots}`;
  }
}

/**
 * Suggests ranked ii–V bridge candidates to insert between source and target.
 *
 * @param source           - The chord before the insertion point.
 * @param target           - The chord being approached.
 * @param scale            - Optional diatonic context for bonus scoring.
 * @param maxBridgeLength  - Maximum number of chords in any bridge (default 2).
 * @param topN             - Maximum number of suggestions returned (default 3).
 * @returns Ranked list of bridge suggestions, at most topN items.
 */
export function suggestBridges(
  source: Chord,
  target: Chord,
  scale: ScaleContext | null = null,
  maxBridgeLength = 2,
  topN = 3,
): BridgeSuggestion[] {
  // Early exit: identical source and target
  if (source.root === target.root && source.quality === target.quality) {
    return [];
  }

  const candidates: BridgeCandidate[] = generateCandidates(
    source,
    target,
    maxBridgeLength,
  );

  // Filter trivial candidates
  const nonTrivial = candidates.filter(
    (c) => !isTrivial(c.bridge, source, target),
  );

  // Score each candidate
  const scored = nonTrivial.map((c) => ({
    ...c,
    score: scoreCandidate(c.bridge, source, target, scale),
  }));

  // Deduplicate by chord root+quality sequence
  const seen = new Set<string>();
  const deduplicated = scored.filter((c) => {
    const key = bridgeKey(c.bridge);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort descending by score and take topN
  return deduplicated
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((c) => ({
      bridge: c.bridge,
      score: c.score,
      type: c.type,
      label: buildLabel(c.type, target),
      explanation: buildExplanation(c.type, c.bridge, target),
    }));
}
