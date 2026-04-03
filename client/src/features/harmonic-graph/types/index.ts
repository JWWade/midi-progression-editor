/** A canonical chord node in the chord graph. */
export interface ChordNode {
  /** Canonical key derived from the lex-min pitch-class set, e.g. "0,3,8". */
  id: string;
  /** Canonical pitch classes (lex-min representative under the chosen symmetry group). */
  pcs: number[];
}

/**
 * A canonical graph node enriched with an inferred named-chord interpretation.
 *
 * Note: `root`/`quality` are inferred from `pcs` and are intended for display
 * and labeling; canonical equivalence classes may admit multiple spellings.
 */
export interface DescribedChordNode extends ChordNode {
  /** Inferred root pitch class (0–11). */
  root: number;
  /** Inferred chord quality. */
  quality: import("@/features/chord/types").ChordType;
  /** Compact chord symbol (e.g. C, Em, Gq). */
  symbol: string;
  /** Jaccard confidence score from the nearest-chord matcher (0–1). */
  matchScore: number;
}

/** A weighted, undirected edge between two chord nodes. */
export interface ChordEdge {
  /** `id` of the source node. */
  from: string;
  /** `id` of the destination node. */
  to: string;
  /** Voice-leading cost between the two canonical chords. */
  weight: number;
}

/** A weighted, undirected metric graph over canonical chord representatives. */
export interface ChordGraph {
  nodes: ChordNode[];
  edges: ChordEdge[];
}

/**
 * A function that computes the voice-leading cost between two pitch-class sets.
 * Must return `Infinity` when the two sets are incompatible (e.g. different sizes).
 */
export type WeightFn = (a: number[], b: number[]) => number;

/**
 * Result of a shortest voice-leading path query between two canonical chord nodes.
 */
export interface PathResult {
  /** Ordered sequence of canonical chord nodes from start to end (inclusive). */
  nodes: ChordNode[];
  /** Total voice-leading distance: sum of edge weights along the path. */
  totalDistance: number;
  /**
   * Per-step optimal voice-leading assignments.  Entry `i` describes the
   * mapping from `nodes[i].pcs` to `nodes[i+1].pcs` as returned by
   * `chordMatching`.  Absent when the path contains only one node.
   */
  mappings?: { fromIdx: number; toIdx: number }[][];
}
