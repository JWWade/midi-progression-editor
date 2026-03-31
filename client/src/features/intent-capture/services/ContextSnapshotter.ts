import type { Chord } from '@/features/current-chord/types';
import type { ScaleType } from '@/features/scale/types';
import { SCALE_LABELS } from '@/features/scale/types';
import type { IntentContext } from '../types';

export interface SnapshotParams {
  /** The current chord progression (chord-only, no placeholders). */
  chords: Chord[];
  /** Root pitch-class index (0 = C … 11 = B). */
  keyRoot: number;
  /** Active scale mode. */
  keyScale: ScaleType;
  /** Ordered pitch-class display names (e.g. ["C","C#",…]). */
  pitchClasses: readonly string[];
  /** Active cursor / note index (0–11), if available. */
  cursorPosition?: number;
}

/**
 * Produces a minimal, serialisable snapshot of the current composition
 * context. Called synchronously at capture time; performs no async I/O.
 */
export function snapshotContext(params: SnapshotParams): IntentContext {
  const { chords, keyRoot, keyScale, pitchClasses, cursorPosition } = params;
  return {
    progressionSnapshot: [...chords],
    key: pitchClasses[keyRoot] ?? String(keyRoot),
    scale: SCALE_LABELS[keyScale] ?? keyScale,
    ...(cursorPosition !== undefined ? { cursorPosition } : {}),
  };
}
