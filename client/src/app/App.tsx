import { useState, useCallback, useMemo } from 'react';
import { ChromaticCircle } from '../features/chromatic-circle';
import { CurrentChordPanel, type Chord } from '../features/current-chord';
import { getDiatonicIndices } from '../features/chromatic-circle/utils';
import { ProgressionSidebar } from '../features/progression-sidebar';
import { useProgression } from '../features/progression-sidebar/hooks/useProgression';
import { MAX_PROGRESSION_LENGTH } from '../features/progression-sidebar/constants/progressionConfig';
import type { ScaleType } from '../features/scale/types';
import styles from './App.module.css';

export default function App() {
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);
  const [keyRoot, setKeyRoot] = useState<number>(0);
  const [keyScale, setKeyScale] = useState<ScaleType>("major");

  const { chords, addChord, moveChord, deleteChord } = useProgression();

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
    addChord(currentChord);
    setCurrentChord(null);
  }, [currentChord, addChord]);

  const isProgressionFull = chords.length >= MAX_PROGRESSION_LENGTH;

  return (
    <div className={styles.layout}>
      <main className={styles.circleArea}>
        <h1>Hello World</h1>
        <CurrentChordPanel
          chord={currentChord}
          onAddChord={handleAddChord}
          diatonicIndices={diatonicIndices}
          isProgressionFull={isProgressionFull}
          progressionLength={chords.length}
          maxProgressionLength={MAX_PROGRESSION_LENGTH}
        />
        <ChromaticCircle onCurrentChordChange={handleCurrentChordChange} onKeyScaleChange={handleKeyScaleChange} />
      </main>
      <ProgressionSidebar
        chords={chords}
        onMoveUp={(i) => moveChord(i, 'up')}
        onMoveDown={(i) => moveChord(i, 'down')}
        onDelete={deleteChord}
        maxLength={MAX_PROGRESSION_LENGTH}
      />
    </div>
  );
}
