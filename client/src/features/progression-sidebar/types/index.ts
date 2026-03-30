import type { Chord } from '@/features/current-chord/types';

/**
 * A node in the chord progression.
 *
 * - `"chord"` nodes hold a concrete chord value.
 * - `"placeholder"` nodes represent a captured user intent that has not
 *   yet been resolved into a chord. They are rendered as ghost tiles,
 *   skipped silently during playback, and maintain the timing structure
 *   of the sequence.
 */
export type ProgressionNode =
  | { type: 'chord'; id: string; value: Chord }
  | { type: 'placeholder'; id: string; intentId: string };
