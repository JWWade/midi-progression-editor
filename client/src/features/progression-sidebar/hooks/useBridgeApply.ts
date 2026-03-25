import { useState, useRef, useCallback } from 'react';
import type { Chord } from '@/features/current-chord/types';

export interface UseBridgeApplyReturn {
  applyBridge: (insertAfterIndex: number, bridge: Chord[]) => void;
  undoPending: boolean;
  undoBridge: () => void;
  clearUndo: () => void;
}

const UNDO_TIMEOUT_MS = 6000;

export function useBridgeApply(
  chords: Chord[],
  setChords: (chords: Chord[]) => void,
): UseBridgeApplyReturn {
  const [undoPending, setUndoPending] = useState(false);
  const snapshotRef = useRef<Chord[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndo = useCallback(() => {
    snapshotRef.current = null;
    setUndoPending(false);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const applyBridge = useCallback(
    (insertAfterIndex: number, bridge: Chord[]) => {
      // Discard any previous pending undo before starting fresh
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Snapshot the current chords before the apply
      snapshotRef.current = structuredClone(chords);

      // Splice bridge chords in after insertAfterIndex
      const newChords = [...chords];
      newChords.splice(insertAfterIndex + 1, 0, ...bridge);
      setChords(newChords);

      setUndoPending(true);

      // Auto-dismiss after 6 seconds
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        snapshotRef.current = null;
        setUndoPending(false);
      }, UNDO_TIMEOUT_MS);
    },
    [chords, setChords],
  );

  const undoBridge = useCallback(() => {
    if (snapshotRef.current !== null) {
      setChords(snapshotRef.current);
    }
    clearUndo();
  }, [setChords, clearUndo]);

  return { applyBridge, undoPending, undoBridge, clearUndo };
}
