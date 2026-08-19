import { useState, useCallback, useMemo } from 'react';
import type { Chord } from '@/features/current-chord/types';
import { MAX_PROGRESSION_LENGTH } from '../constants/progressionConfig';
import type { ProgressionNode } from '../types';

export interface UseProgressionReturn {
  /** All nodes in display order. */
  nodes: ProgressionNode[];
  /** Chord-only subset of nodes, used for playback and metric computation. */
  chords: Chord[];
  addChord: (chord: Chord) => void;
  addChords: (chords: Chord[]) => {
    added: number;
    reason?: 'full' | 'insufficient-space';
  };
  /** Moves a chord node by its chord-list index. */
  moveChord: (index: number, direction: 'up' | 'down') => void;
  /** Deletes a chord node by its chord-list index. */
  deleteChord: (index: number) => void;
  /** Replaces all nodes with chord nodes derived from `newChords`. */
  setChords: (chords: Chord[]) => void;
}

export function useProgression(): UseProgressionReturn {
  const [entries, setEntries] = useState<ProgressionNode[]>([]);

  const chords = useMemo(
    () => entries.map((e) => e.value),
    [entries],
  );

  const addChord = useCallback((chord: Chord) => {
    setEntries((prev) => {
      if (prev.length >= MAX_PROGRESSION_LENGTH) return prev;
      return [...prev, { id: crypto.randomUUID(), type: 'chord', value: chord }];
    });
  }, []);

  const addChords = useCallback((chordsToAdd: Chord[]) => {
    if (chordsToAdd.length === 0) {
      return { added: 0 };
    }

    if (entries.length >= MAX_PROGRESSION_LENGTH) {
      return { added: 0, reason: 'full' as const };
    }

    if (entries.length + chordsToAdd.length > MAX_PROGRESSION_LENGTH) {
      return { added: 0, reason: 'insufficient-space' as const };
    }

    setEntries((prev) => [
      ...prev,
      ...chordsToAdd.map((chord) => ({
        id: crypto.randomUUID(),
        type: 'chord' as const,
        value: chord,
      })),
    ]);

    return { added: chordsToAdd.length };
  }, [entries]);

  const moveChord = useCallback((chordIndex: number, direction: 'up' | 'down') => {
    setEntries((prev) => {
      if (chordIndex < 0 || chordIndex >= prev.length) return prev;

      const next = [...prev];
      if (direction === 'up') {
        if (chordIndex === 0) return prev;
        [next[chordIndex - 1], next[chordIndex]] = [next[chordIndex], next[chordIndex - 1]];
      } else {
        if (chordIndex >= prev.length - 1) return prev;
        [next[chordIndex], next[chordIndex + 1]] = [next[chordIndex + 1], next[chordIndex]];
      }
      return next;
    });
  }, []);

  const deleteChord = useCallback((chordIndex: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== chordIndex));
  }, []);

  const setChords = useCallback((newChords: Chord[]) => {
    setEntries(
      newChords.map((chord) => ({
        id: crypto.randomUUID(),
        type: 'chord' as const,
        value: chord,
      })),
    );
  }, []);

  return { nodes: entries, chords, addChord, addChords, moveChord, deleteChord, setChords };
}
