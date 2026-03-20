import type { Chord } from "@/features/current-chord/types";

export type BridgeType =
  | "diatonic-ii-v"
  | "tritone-sub-ii-v"
  | "chromatic-ii-v"
  | "incomplete-ii"
  | "incomplete-v"
  | "tritone-sub"
  | "backchain-vi-ii-v"
  | "backchain-iii-vi-ii-v";

export interface BridgeSuggestion {
  /** Ordered list of chords to insert between source and target. */
  bridge: Chord[];
  /** Normalized score 0–1 (higher = more recommended). */
  score: number;
  /** Musical bridge type classification. */
  type: BridgeType;
  /**
   * Short human-readable label, e.g. "ii–V into G".
   * Uses root indices only — enharmonic resolution happens at render time.
   */
  label: string;
  /**
   * Longer harmonic explanation, e.g. "Diatonic ii–V of root 7; bridge roots: 9, 2"
   * Full enharmonic names (e.g. "Am7 shares E with Dm7") are deferred to render time.
   */
  explanation: string;
}

export interface BridgeRequest {
  sourceChord: Chord;
  targetChord: Chord;
  insertAfterIndex: number;
  contextScale?: { root: number; mode: string } | null;
  maxBridgeLength?: number;
  topN?: number;
}
