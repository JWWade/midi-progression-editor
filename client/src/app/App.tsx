import { useState, useCallback, useMemo, useRef } from 'react';
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
  // Guard ref to prevent duplicate progression entries from rapid double-clicks.
  // Set synchronously when add is initiated; cleared after the current animation
  // frame so intentional subsequent adds still work.
  const addGuardRef = useRef(false);

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
    if (currentChord === null || addGuardRef.current) return;
    addGuardRef.current = true;
    addChord(currentChord);
    // currentChord intentionally stays after adding so the panel remains
    // populated and the user can immediately add the same chord again
    // without re-selecting it on the circle.
    requestAnimationFrame(() => {
      addGuardRef.current = false;
    });
  }, [currentChord, addChord]);

  const isProgressionFull = chords.length >= MAX_PROGRESSION_LENGTH;

  return (
    <div className={styles.layout}>
      <main className={styles.circleArea}>
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
