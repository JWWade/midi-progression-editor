import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChromaticCircle } from '../features/chromatic-circle';
import { CurrentChordPanel, type Chord, formatChordName } from '../features/current-chord';
import { getDiatonicIndices } from '../features/chromatic-circle/utils';
import { ProgressionSidebar } from '../features/progression-sidebar';
import { useProgression } from '../features/progression-sidebar/hooks/useProgression';
import { useBridgePreview } from '../features/progression-sidebar/hooks/useBridgePreview';
import { useBridgeApply } from '../features/progression-sidebar/hooks/useBridgeApply';
import { importSnapshot } from '../features/progression-sidebar/utils/snapshotIO';
import { MAX_PROGRESSION_LENGTH } from '../features/progression-sidebar/constants/progressionConfig';
import { useProgressionPlayback } from '../features/audio';
import type { AudioParams } from '../features/audio/constants/audioConfig';
import { DEFAULT_AUDIO_PARAMS } from '../features/audio/constants/audioConfig';
import { AppHeader } from './components/AppHeader';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { DevDiagnosticsPanel } from './components/DevDiagnosticsPanel';
import type { ScaleType } from '../features/scale/types';
import { useEnharmonic } from './providers/useEnharmonic';
import { VisualLegend } from '../features/legend';
import { Toast } from '../shared/components/Toast/Toast';
import { selectRandomDiatonicStartupChord } from '../features/chord/utils/selectRandomDiatonicStartupChord';
import { useTutorial } from '../features/tutorial';
import styles from './App.module.css';

/** Default chord duration used for progression playback (milliseconds). */
const DEFAULT_CHORD_DURATION_MS = 1200;

export default function App() {
  const [startupSelection] = useState(() => selectRandomDiatonicStartupChord());
  const [currentChord, setCurrentChord] = useState<Chord | null>(startupSelection.chord);
  const [keyRoot, setKeyRoot] = useState<number>(startupSelection.keyRoot);
  const [keyScale, setKeyScale] = useState<ScaleType>(startupSelection.keyScale);
  const [audioParams, setAudioParams] = useState<AudioParams>(DEFAULT_AUDIO_PARAMS);
  const [chordDurationMs, setChordDurationMs] = useState(DEFAULT_CHORD_DURATION_MS);

  // Chord sent back from the progression sidebar to the chromatic circle.
  // Spread into a new object on each send so the ChromaticCircle effect always
  // fires, even when the same chord is re-sent.
  const [sendBackChord, setSendBackChord] = useState<Chord | null>(null);

  // Visualization toggles (lifted from ChromaticCircle)
  const [showCentroid, setShowCentroid] = useState(false);
  const [showIntervals, setShowIntervals] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  // Session import state
  const [importError, setImportError] = useState<string | null>(null);
  const loadJsonInputRef = useRef<HTMLInputElement>(null);

  const { pitchClasses } = useEnharmonic();
  const { nodes, chords, addChord, moveChord, deleteChord, setChords } = useProgression();
  // Guard ref to prevent duplicate progression entries from rapid double-clicks.
  // Set synchronously when add is initiated; cleared after the current animation
  // frame so intentional subsequent adds still work.
  const addGuardRef = useRef(false);

  // Tutorial engine integration
  const { fireEvent, updateAppContext } = useTutorial();

  const { applyBridge, undoPending, undoBridge } = useBridgeApply(chords, setChords);

  const {
    isPlaying,
    playingIndex,
    playingPitchClass,
    loop,
    play: onPlay,
    stop: onStop,
    toggleLoop,
    arpeggioEnabled,
    arpeggioPattern,
    toggleArpeggio,
    setArpeggioPattern,
  } = useProgressionPlayback(chords, audioParams, chordDurationMs);
  const playingChord: Chord | null = playingIndex !== null ? (chords[playingIndex] ?? null) : null;

  const {
    isPreviewPlaying,
    previewBridge,
    previewInsertAfterIndex,
    startPreview: onPreviewBridge,
    stopPreview: onStopPreview,
  } = useBridgePreview(chordDurationMs, audioParams);

  // ARIA live region: announce chord name on each playback step; clear when stopped.
  const [liveRegionText, setLiveRegionText] = useState('');
  useEffect(() => {
    if (!isPlaying || playingChord === null) {
      setLiveRegionText('');
      return;
    }
    setLiveRegionText(formatChordName(playingChord, pitchClasses));
  }, [isPlaying, playingChord, pitchClasses]);

  useEffect(() => {
    if (isPlaying) {
      onStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chords]);

  const diatonicIndices = useMemo(
    () => getDiatonicIndices(keyRoot, keyScale),
    [keyRoot, keyScale],
  );

  const handleCurrentChordChange = useCallback((chord: Chord) => {
    setCurrentChord(chord);
    fireEvent('chordSelected');
  }, [fireEvent]);

  const handleKeyScaleChange = useCallback((root: number, scale: ScaleType) => {
    setKeyRoot(root);
    setKeyScale(scale);
  }, []);

  const handleSendChordToCircle = useCallback((chord: Chord) => {
    // Spread into a new object so ChromaticCircle's loadChord effect always fires.
    setSendBackChord({ ...chord });
    setLiveRegionText(`${formatChordName(chord, pitchClasses)} loaded into chromatic circle`);
    fireEvent('chordClicked');
  }, [pitchClasses, fireEvent]);

  const handleLoadJsonClick = useCallback(() => {
    loadJsonInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset value so re-selecting the same file triggers onChange again
      e.target.value = '';

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          setImportError('Failed to read file.');
          return;
        }
        const snapshot = importSnapshot(text);
        if (!snapshot) {
          setImportError('Invalid session file. The file does not contain a valid progression snapshot.');
          return;
        }
        setChords(snapshot.progression);
        if (snapshot.scaleContext) {
          setKeyRoot(snapshot.scaleContext.root);
          setKeyScale(snapshot.scaleContext.mode);
        }
        setImportError(null);
      };
      reader.onerror = () => {
        setImportError('Failed to read file.');
      };
      reader.readAsText(file);
    },
    [setChords],
  );

  const handleAddChord = useCallback(() => {
    if (currentChord === null || addGuardRef.current) return;
    addGuardRef.current = true;
    addChord(currentChord);
    fireEvent('chordAdded');
    // currentChord intentionally stays after adding so the panel remains
    // populated and the user can immediately add the same chord again
    // without re-selecting it on the circle.
    requestAnimationFrame(() => {
      addGuardRef.current = false;
    });
  }, [currentChord, addChord, fireEvent]);

  const isProgressionFull = chords.length >= MAX_PROGRESSION_LENGTH;

  // Keep the tutorial engine in sync with app state for state-based triggers.
  useEffect(() => {
    updateAppContext({ progressionLength: chords.length, isPlaying });
  }, [chords.length, isPlaying, updateAppContext]);

  return (
    <AppErrorBoundary>
    <div className={styles.layout}>
      <nav className={styles.skipNav} aria-label="Skip navigation">
        <a href="#chromatic-circle" className={styles.skipLink}>Skip to circle</a>
        <a href="#current-chord" className={styles.skipLink}>Skip to chord panel</a>
        <a href="#chord-progression" className={styles.skipLink}>Skip to progression</a>
      </nav>
      <h1 className={styles.visuallyHidden}>MIDI Progression Editor</h1>
      <div
        className={styles.visuallyHidden}
        aria-live="polite"
        aria-atomic="true"
      >
        {liveRegionText}
      </div>
      <AppHeader
        showCentroid={showCentroid}
        onCentroidChange={setShowCentroid}
        showIntervals={showIntervals}
        onIntervalsChange={setShowIntervals}
        showLegend={showLegend}
        onLegendChange={setShowLegend}
        onLoadJson={handleLoadJsonClick}
      />
      <div className={styles.primaryFlowContainer}>
        {/* Chromatic Circle - Left */}
        <section
          id="chromatic-circle"
          className={styles.circleArea}
          role="region"
          aria-label="Chromatic Circle - Select and inspect the current chord"
        >
          <ChromaticCircle
            initialChordName={startupSelection.chordName}
            externalChord={playingChord}
            isPlaybackActive={isPlaying}
            playingPitchClass={playingPitchClass}
            onCurrentChordChange={handleCurrentChordChange}
            onKeyScaleChange={handleKeyScaleChange}
            selectedScale={keyScale}
            showCentroid={showCentroid}
            showIntervals={showIntervals}
            loadChord={sendBackChord}
          />
          {showLegend && <VisualLegend />}
        </section>

        {/* Current Chord Panel - Center */}
        <section
          id="current-chord"
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
            audioParams={audioParams}
            onAudioParamsChange={setAudioParams}
          />
        </section>

        {/* Progression Sidebar - Right */}
        <section
          id="chord-progression"
          className={styles.sidebarArea}
          role="region"
          aria-label="Chord Progression - View and manage added chords"
        >
          <ProgressionSidebar
            nodes={nodes}
            chords={chords}
            onMoveUp={(i) => moveChord(i, 'up')}
            onMoveDown={(i) => moveChord(i, 'down')}
            onDelete={deleteChord}
            maxLength={MAX_PROGRESSION_LENGTH}
            isPlaying={isPlaying}
            playingIndex={playingIndex}
            onPlay={onPlay}
            onStop={onStop}
            loop={loop}
            onToggleLoop={toggleLoop}
            chordDurationMs={chordDurationMs}
            onChordDurationChange={setChordDurationMs}
            scale={{ root: keyRoot, mode: keyScale }}
            onApplyBridge={applyBridge}
            onPreviewBridge={onPreviewBridge}
            onStopPreview={onStopPreview}
            previewBridge={previewBridge}
            previewInsertAfterIndex={previewInsertAfterIndex}
            isPreviewPlaying={isPreviewPlaying}
            onSendBack={handleSendChordToCircle}
            arpeggioEnabled={arpeggioEnabled}
            arpeggioPattern={arpeggioPattern}
            playingPitchClass={playingPitchClass}
            onToggleArpeggio={toggleArpeggio}
            onSetArpeggioPattern={setArpeggioPattern}
          />
        </section>
      </div>
      {undoPending && (
        <Toast
          message="Bridge inserted —"
          action={{ label: 'Undo', onClick: undoBridge }}
        />
      )}
      {importError && (
        <Toast
          message={importError}
          action={{ label: 'Dismiss', onClick: () => setImportError(null) }}
        />
      )}
      <input
        ref={loadJsonInputRef}
        type="file"
        accept=".json,application/json"
        aria-hidden="true"
        tabIndex={-1}
        className={styles.visuallyHidden}
        onChange={handleFileChange}
      />
      {import.meta.env.DEV && (
        <DevDiagnosticsPanel
          currentChord={currentChord}
          keyRoot={keyRoot}
          keyScale={keyScale}
          progressionLength={chords.length}
          maxProgressionLength={MAX_PROGRESSION_LENGTH}
          audioParams={audioParams}
          isPlaying={isPlaying}
          playingIndex={playingIndex}
        />
      )}
    </div>
    </AppErrorBoundary>
  );
}
