import { useState, useCallback, useMemo } from 'react';
import { ChromaticCircle } from '../features/chromatic-circle';
import { CurrentChordPanel, type Chord } from '../features/current-chord';
import { getDiatonicIndices } from '../features/chromatic-circle/utils';
import { ProgressionSidebar } from '../features/progression-sidebar';
import { MAX_PROGRESSION_LENGTH } from '../features/progression-sidebar/constants/progressionConfig';
import type { ScaleType } from '../features/scale/types';
import styles from './App.module.css';

interface ProgressionEntry {
  id: string;
  chord: Chord;
}

export default function App() {
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);
  const [progression, setProgression] = useState<ProgressionEntry[]>([]);
  const [keyRoot, setKeyRoot] = useState<number>(0);
  const [keyScale, setKeyScale] = useState<ScaleType>("major");

  const diatonicIndices = useMemo(
    () => getDiatonicIndices(keyRoot, keyScale),
    [keyRoot, keyScale],
  );

  const handleCurrentChordChange = useCallback((chord: Chord) => {
    setCurrentChord(chord);
  }, []);

  const handleKeyScaleChange = useCallback((root: number, scale: ScaleType) => {
    setKeyRoot(root);
    setKeyScale(scale);
  }, []);

  const handleAddChord = useCallback(() => {
    if (currentChord === null) return;
    if (progression.length >= MAX_PROGRESSION_LENGTH) return;
    const entry: ProgressionEntry = { id: `${Date.now()}-${Math.random()}`, chord: currentChord };
    setProgression((prev) => [...prev, entry]);
    setCurrentChord(null);
  }, [currentChord, progression.length]);

  const isProgressionFull = progression.length >= MAX_PROGRESSION_LENGTH;

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setProgression((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setProgression((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleDelete = useCallback((index: number) => {
    setProgression((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={styles.layout}>
      <main className={styles.circleArea}>
        <h1>Hello World</h1>
        <CurrentChordPanel
          chord={currentChord}
          onAddChord={handleAddChord}
          diatonicIndices={diatonicIndices}
          isProgressionFull={isProgressionFull}
          progressionLength={progression.length}
          maxProgressionLength={MAX_PROGRESSION_LENGTH}
        />
        <ChromaticCircle onCurrentChordChange={handleCurrentChordChange} onKeyScaleChange={handleKeyScaleChange} />
      </main>
      <ProgressionSidebar
        chords={progression.map((entry) => entry.chord)}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onDelete={handleDelete}
        maxLength={MAX_PROGRESSION_LENGTH}
      />
    </div>
  );
}
