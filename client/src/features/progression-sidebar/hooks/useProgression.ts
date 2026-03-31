import { useState, useCallback, useMemo } from 'react';
import type { Chord } from '@/features/current-chord/types';
import { MAX_PROGRESSION_LENGTH } from '../constants/progressionConfig';
import type { ProgressionNode } from '../types';

export interface UseProgressionReturn {
  /** All nodes in display order, including placeholders. */
  nodes: ProgressionNode[];
  /** Chord-only subset of nodes, used for playback and metric computation. */
  chords: Chord[];
  addChord: (chord: Chord) => void;
  /** Appends a placeholder node referencing the given intent ID. */
  addPlaceholder: (intentId: string) => void;
  /** Removes the node with the given `id` (placeholder or chord). */
  deletePlaceholder: (id: string) => void;
  /** Moves a chord node by its chord-list index. Placeholders are unaffected. */
  moveChord: (index: number, direction: 'up' | 'down') => void;
  /** Deletes a chord node by its chord-list index. */
  deleteChord: (index: number) => void;
  /** Replaces all nodes with chord nodes derived from `newChords`. */
  setChords: (chords: Chord[]) => void;
}

export function useProgression(): UseProgressionReturn {
  const [entries, setEntries] = useState<ProgressionNode[]>([]);

  const chords = useMemo(
    () =>
      entries
        .filter((e): e is Extract<ProgressionNode, { type: 'chord' }> => e.type === 'chord')
        .map((e) => e.value),
    [entries],
  );

  const addChord = useCallback((chord: Chord) => {
    setEntries((prev) => {
      const chordCount = prev.filter((e) => e.type === 'chord').length;
      if (chordCount >= MAX_PROGRESSION_LENGTH) return prev;
      return [...prev, { id: crypto.randomUUID(), type: 'chord', value: chord }];
    });
  }, []);

  const addPlaceholder = useCallback((intentId: string) => {
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'placeholder', intentId },
    ]);
  }, []);

  const deletePlaceholder = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const moveChord = useCallback((chordIndex: number, direction: 'up' | 'down') => {
    setEntries((prev) => {
      // Collect the entry indices of chord nodes in order
      const chordEntryIndices = prev.reduce<number[]>((acc, e, i) => {
        if (e.type === 'chord') acc.push(i);
        return acc;
      }, []);

      const currentEntryIdx = chordEntryIndices[chordIndex];
      if (currentEntryIdx === undefined) return prev;

      const next = [...prev];
      if (direction === 'up') {
        if (chordIndex === 0) return prev;
        const swapEntryIdx = chordEntryIndices[chordIndex - 1];
        [next[swapEntryIdx], next[currentEntryIdx]] = [next[currentEntryIdx], next[swapEntryIdx]];
      } else {
        if (chordIndex >= chordEntryIndices.length - 1) return prev;
        const swapEntryIdx = chordEntryIndices[chordIndex + 1];
        [next[currentEntryIdx], next[swapEntryIdx]] = [next[swapEntryIdx], next[currentEntryIdx]];
      }
      return next;
    });
  }, []);

  const deleteChord = useCallback((chordIndex: number) => {
    setEntries((prev) => {
      const chordEntryIndices = prev.reduce<number[]>((acc, e, i) => {
        if (e.type === 'chord') acc.push(i);
        return acc;
      }, []);
      const entryIdx = chordEntryIndices[chordIndex];
      if (entryIdx === undefined) return prev;
      return prev.filter((_, i) => i !== entryIdx);
    });
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

  return { nodes: entries, chords, addChord, addPlaceholder, deletePlaceholder, moveChord, deleteChord, setChords };
}
