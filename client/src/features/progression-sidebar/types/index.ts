import type { Chord } from '@/features/current-chord/types';

/**
 * A node in the chord progression.
 */
export type ProgressionNode = { type: 'chord'; id: string; value: Chord };
