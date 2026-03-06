import { useState, useCallback, useMemo } from 'react';
import { ChromaticCircle } from '../features/chromatic-circle';
import { CurrentChordPanel, type Chord } from '../features/current-chord';
import { getDiatonicIndices } from '../features/chromatic-circle/utils';
import { ProgressionSidebar } from '../features/progression-sidebar';
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
    const entry: ProgressionEntry = { id: `${Date.now()}-${Math.random()}`, chord: currentChord };
    setProgression((prev) => [...prev, entry]);
    setCurrentChord(null);
  }, [currentChord]);

  return (
    <div className={styles.layout}>
      <main className={styles.circleArea}>
        <h1>Hello World</h1>
        <CurrentChordPanel chord={currentChord} onAddChord={handleAddChord} diatonicIndices={diatonicIndices} />
        <ChromaticCircle onCurrentChordChange={handleCurrentChordChange} onKeyScaleChange={handleKeyScaleChange} />
      </main>
      <ProgressionSidebar chords={progression.map((entry) => entry.chord)} />
    </div>
  );
}
