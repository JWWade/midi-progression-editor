import { useState, useRef, useCallback, useEffect } from 'react';
import type { Chord } from '@/features/current-chord/types';
import type { ScaleType } from '@/features/scale/types';
import { useEnharmonic } from '@/app/providers/useEnharmonic';
import { IntentStore } from '../services/IntentStore';
import { captureIntent } from '../services/IntentCaptureService';
import { snapshotContext } from '../services/ContextSnapshotter';

export interface UseIntentCaptureParams {
  chords: Chord[];
  keyRoot: number;
  keyScale: ScaleType;
}

export interface UseIntentCaptureReturn {
  /**
   * Synchronously captures an intent with the current composition context.
   * @param rawInput Optional free-form text (defaults to empty string).
   * @param cursorPosition Optional active note index (0–11).
   * @returns The generated intent ID.
   */
  capture: (rawInput?: string, cursorPosition?: number) => string;
  /** The underlying store, for advanced use (inspection, resolution). */
  store: IntentStore;
}

/**
 * React hook that provides a stable `capture` function backed by a
 * singleton `IntentStore` for the lifetime of the component.
 *
 * Mutable refs are synced via `useEffect` (not during render) so that
 * `capture` never becomes stale without violating the React refs rules.
 */
export function useIntentCapture({
  chords,
  keyRoot,
  keyScale,
}: UseIntentCaptureParams): UseIntentCaptureReturn {
  const { pitchClasses } = useEnharmonic();

  // Singleton store created once via useState factory; stable for component lifetime
  const [store] = useState(() => new IntentStore());

  // Mutable refs keep capture() stable while reflecting the latest values.
  // Synced via useEffect after each render, not during render.
  const chordsRef = useRef(chords);
  const keyRootRef = useRef(keyRoot);
  const keyScaleRef = useRef(keyScale);
  const pitchClassesRef = useRef(pitchClasses);

  useEffect(() => { chordsRef.current = chords; }, [chords]);
  useEffect(() => { keyRootRef.current = keyRoot; }, [keyRoot]);
  useEffect(() => { keyScaleRef.current = keyScale; }, [keyScale]);
  useEffect(() => { pitchClassesRef.current = pitchClasses; }, [pitchClasses]);

  const capture = useCallback((rawInput = '', cursorPosition?: number): string => {
    const context = snapshotContext({
      chords: chordsRef.current,
      keyRoot: keyRootRef.current,
      keyScale: keyScaleRef.current,
      pitchClasses: pitchClassesRef.current,
      cursorPosition,
    });
    return captureIntent({ rawInput, context }, store);
  }, [store]);

  return { capture, store };
}
