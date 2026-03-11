import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChromaticCircle } from '../features/chromatic-circle';
import { CurrentChordPanel, type Chord } from '../features/current-chord';
import { getDiatonicIndices } from '../features/chromatic-circle/utils';
import { ProgressionSidebar } from '../features/progression-sidebar';
import { useProgression } from '../features/progression-sidebar/hooks/useProgression';
import { MAX_PROGRESSION_LENGTH } from '../features/progression-sidebar/constants/progressionConfig';
import { AppHeader } from './components/AppHeader';
import type { ScaleType } from '../features/scale/types';
import type { CursorMode } from '../shared/types/CursorMode';
import styles from './App.module.css';

export default function App() {
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);
  const [keyRoot, setKeyRoot] = useState<number>(0);
  const [keyScale, setKeyScale] = useState<ScaleType>("major");

  // Cursor mode and selection state (for multi-mode interaction)
  const [cursorMode, setCursorMode] = useState<CursorMode>('info');
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());

  // Visualization toggles and scale selector (lifted from ChromaticCircle)
  const [selectedScale, setSelectedScale] = useState<ScaleType>("major");
  const [showExtension, setShowExtension] = useState(false);
  const [showCentroid, setShowCentroid] = useState(false);
  const [showIntervals, setShowIntervals] = useState(false);

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

  // Keyboard shortcuts for mode switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to I and S keys when focus is not in a form control
      const activeElement = document.activeElement as HTMLElement;
      const isInFormControl = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.tagName === 'TEXTAREA'
      );

      if (isInFormControl) return;

      if (e.key.toLowerCase() === 'i' && cursorMode !== 'info') {
        e.preventDefault();
        setCursorMode('info');
      } else if (e.key.toLowerCase() === 's' && cursorMode !== 'select') {
        e.preventDefault();
        setCursorMode('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursorMode]);

  return (
    <div className={styles.layout}>
      <AppHeader
        cursorMode={cursorMode}
        onCursorModeChange={setCursorMode}
        selectedScale={selectedScale}
        onScaleChange={setSelectedScale}
        showExtension={showExtension}
        onExtensionChange={setShowExtension}
        showCentroid={showCentroid}
        onCentroidChange={setShowCentroid}
        showIntervals={showIntervals}
        onIntervalsChange={setShowIntervals}
      />
      <div className={styles.primaryFlowContainer}>
        {/* Chromatic Circle - Left */}
        <section
          className={styles.circleArea}
          role="region"
          aria-label="Chromatic Circle - Select and inspect the current chord"
        >
          <ChromaticCircle
            onCurrentChordChange={handleCurrentChordChange}
            onKeyScaleChange={handleKeyScaleChange}
            selectedScale={selectedScale}
            showExtension={showExtension}
            showCentroid={showCentroid}
            showIntervals={showIntervals}
            cursorMode={cursorMode}
            selectedNotes={selectedNotes}
            onSelectedNotesChange={setSelectedNotes}
          />
        </section>

        {/* Current Chord Panel - Center */}
        <section
          className={styles.panelArea}
          role="region"
          aria-label="Current Chord - Add to progression"
        >
          <CurrentChordPanel
            chord={currentChord}
            onAddChord={handleAddChord}
            diatonicIndices={diatonicIndices}
            isProgressionFull={isProgressionFull}
            progressionLength={chords.length}
            maxProgressionLength={MAX_PROGRESSION_LENGTH}
          />
        </section>

        {/* Progression Sidebar - Right */}
        <section
          className={styles.sidebarArea}
          role="region"
          aria-label="Chord Progression - View and manage added chords"
        >
          <ProgressionSidebar
            chords={chords}
            onMoveUp={(i) => moveChord(i, 'up')}
            onMoveDown={(i) => moveChord(i, 'down')}
            onDelete={deleteChord}
            maxLength={MAX_PROGRESSION_LENGTH}
          />
        </section>
      </div>
    </div>
  );
}
