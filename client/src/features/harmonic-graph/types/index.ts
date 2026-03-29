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
