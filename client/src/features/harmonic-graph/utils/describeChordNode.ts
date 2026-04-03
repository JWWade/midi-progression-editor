import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import { getChordName } from "@/features/chord/data/chordNames";
import { findNearestChord } from "@/features/chord/utils/findNearestChord";
import type { ChordNode, DescribedChordNode } from "../types";

/**
 * Enriches a canonical graph node with an inferred named-chord interpretation.
 */
export function describeChordNode(
  node: ChordNode,
  pitchClasses: readonly string[] = PITCH_CLASSES,
): DescribedChordNode {
  const { root, quality, matchScore } = findNearestChord(node.pcs);
  return {
    ...node,
    root,
    quality,
    symbol: getChordName(root, quality, pitchClasses),
    matchScore,
  };
}

/**
 * Maps all graph nodes to their described forms.
 */
export function describeChordNodes(
  nodes: ChordNode[],
  pitchClasses: readonly string[] = PITCH_CLASSES,
): DescribedChordNode[] {
  return nodes.map((node) => describeChordNode(node, pitchClasses));
}
