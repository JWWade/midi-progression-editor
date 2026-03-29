/** A canonical triad node in the chord graph. */
export interface ChordNode {
  /** Canonical key derived from the lex-min pitch-class set, e.g. "0,3,8". */
  id: string;
  /** Canonical pitch classes (lex-min representative under transposition). */
  pcs: number[];
}

/** A weighted, undirected edge between two chord nodes. */
export interface ChordEdge {
  /** `id` of the source node. */
  from: string;
  /** `id` of the destination node. */
  to: string;
  /** Voice-leading cost between the two canonical chords (`chordDistance`). */
  weight: number;
}

/** A weighted, undirected metric graph over canonical chord representatives. */
export interface ChordGraph {
  nodes: ChordNode[];
  edges: ChordEdge[];
}

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
