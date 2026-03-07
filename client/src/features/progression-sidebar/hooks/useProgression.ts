import { useState, useCallback, useMemo } from 'react';
import type { Chord } from '@/features/current-chord/types';
import { MAX_PROGRESSION_LENGTH } from '../constants/progressionConfig';

interface ProgressionEntry {
  id: string;
  chord: Chord;
}

export interface UseProgressionReturn {
  chords: Chord[];
  addChord: (chord: Chord) => void;
  moveChord: (index: number, direction: 'up' | 'down') => void;
  deleteChord: (index: number) => void;
}

export function useProgression(): UseProgressionReturn {
  const [entries, setEntries] = useState<ProgressionEntry[]>([]);

  const chords = useMemo(() => entries.map((e) => e.chord), [entries]);

  const addChord = useCallback((chord: Chord) => {
    setEntries((prev) => {
      if (prev.length >= MAX_PROGRESSION_LENGTH) return prev;
      return [...prev, { id: crypto.randomUUID(), chord }];
    });
  }, []);

  const moveChord = useCallback((index: number, direction: 'up' | 'down') => {
    setEntries((prev) => {
      const next = [...prev];
      if (direction === 'up') {
        if (index === 0) return prev;
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
      } else {
        if (index >= prev.length - 1) return prev;
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
      }
      return next;
    });
  }, []);

  const deleteChord = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { chords, addChord, moveChord, deleteChord };
}
