import type { Chord } from '@/features/current-chord/types';

/**
 * The minimal composition context captured at the moment an intent is
 * recorded. Intentionally loose — fields are optional so that capture
 * succeeds even when context is partially unavailable.
 */
export interface IntentContext {
  /** Ordered snapshot of the active chord progression. */
  progressionSnapshot?: Chord[];
  /** Display name of the root note (e.g. "C", "F#"). */
  key?: string;
  /** Display label for the active scale mode (e.g. "Major", "Dorian"). */
  scale?: string;
  /** Active cursor / note index (0–11), if available. */
  cursorPosition?: number;
}

/**
 * A single captured user intent — immutable once created.
 * Append-only; the `resolved` flag is the only mutable aspect.
 */
export interface IntentCapture {
  /** Unique identifier (UUIDv4). */
  id: string;
  /** Unix timestamp (ms) of capture. */
  timestamp: number;
  /** Snapshot of composition context at capture time. */
  context: IntentContext;
  /** Free-form text input from the user (may be empty for hotkey captures). */
  rawInput: string;
  /** Whether this intent has been resolved into a concrete chord. */
  resolved: boolean;
}
