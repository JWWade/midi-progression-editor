import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChromaticCircle } from '../features/chromatic-circle';
import { CurrentChordPanel, type Chord, formatChordName } from '../features/current-chord';
import { getDiatonicIndices } from '../features/chromatic-circle/utils';
import { ProgressionSidebar } from '../features/progression-sidebar';
import { useProgression } from '../features/progression-sidebar/hooks/useProgression';
import { useBridgePreview } from '../features/progression-sidebar/hooks/useBridgePreview';
import { useBridgeApply } from '../features/progression-sidebar/hooks/useBridgeApply';
import { MAX_PROGRESSION_LENGTH } from '../features/progression-sidebar/constants/progressionConfig';
import { useFileImport } from './hooks/useFileImport';
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
import { KeyContextPanel } from '../features/scale';
import { AudioDebugPanel } from '../features/audio/components/AudioDebugPanel';
import { useTutorial } from '../features/tutorial';
import { getRandomBpmInRange } from '../features/midi-export/utils/bpmTempoLabel';
import type { VoiceLeadingConfig } from '../features/voice-leading';
import type { ToneInfo } from '../features/chord-inspection';
import styles from './App.module.css';

const DEFAULT_VOICE_LEADING_CONFIG: VoiceLeadingConfig = {
  style: 'close',
  strictness: 2,
  motionBias: 'neutral',
  startOctave: 4,
  extensionRegisterPolicy: 'strict',
};

export default function App() {
  const [startupSelection] = useState(() => selectRandomDiatonicStartupChord());
  const [currentChord, setCurrentChord] = useState<Chord | null>(startupSelection.chord);
  const [keyRoot, setKeyRoot] = useState<number>(startupSelection.keyRoot);
  const [keyScale, setKeyScale] = useState<ScaleType>(startupSelection.keyScale);
  const [audioParams, setAudioParams] = useState<AudioParams>(DEFAULT_AUDIO_PARAMS);
  const [bpm, setBpm] = useState(() => getRandomBpmInRange("Adagio", "Presto"));
  const [beatsPerChord, setBeatsPerChord] = useState(4);
  const [voiceLeadingConfig, setVoiceLeadingConfig] = useState<VoiceLeadingConfig>(DEFAULT_VOICE_LEADING_CONFIG);
  const [selectedTone, setSelectedTone] = useState<ToneInfo | null>(null);
  const chordDurationMs = useMemo(() => Math.round((60 / bpm) * beatsPerChord * 1000), [bpm, beatsPerChord]);

  // Chord sent back from the progression sidebar to the chromatic circle.
  // Spread into a new object on each send so the ChromaticCircle effect always
  // fires, even when the same chord is re-sent.
  const [sendBackChord, setSendBackChord] = useState<Chord | null>(null);

  // Visualization toggles (lifted from ChromaticCircle)
  const [showLegend, setShowLegend] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
  } = useProgressionPlayback(chords, audioParams, chordDurationMs, voiceLeadingConfig);
  const playingChord: Chord | null = playingIndex !== null ? (chords[playingIndex] ?? null) : null;

  const {
    isPreviewPlaying,
    previewBridge,
    previewInsertAfterIndex,
    previewError,
    startPreview: onPreviewBridge,
    stopPreview: onStopPreview,
    clearPreviewError,
  } = useBridgePreview(chordDurationMs, audioParams);

  // ARIA live region: announce chord name on each playback step; clear when stopped.
  // Derived directly to avoid synchronous setState in an effect.
  const playbackLiveText = isPlaying && playingChord !== null
    ? formatChordName(playingChord, pitchClasses)
    : '';

  // Separate ARIA live region for event-driven announcements (e.g. chord sent to circle).
  const [sendBackMessage, setSendBackMessage] = useState('');

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

  /**
   * Single write path for all key context changes (E12-02).
   * source identifies the call site for debugging; has no semantic effect.
   */
  const setKeyContext = useCallback(
    (_action: { root: number; scale: ScaleType; source: "panel" | "tonicSnap" | "snapshot" | "startup" }) => {
      setKeyRoot(_action.root);
      setKeyScale(_action.scale);
    },
    [],
  );

  const { importError, clearImportError, loadJsonInputRef, handleLoadJsonClick, handleFileChange } =
    useFileImport(setChords, setKeyContext);

  const handleSendChordToCircle = useCallback((chord: Chord) => {
    // Spread into a new object so ChromaticCircle's loadChord effect always fires.
    setSendBackChord({ ...chord });
    setSendBackMessage(`${formatChordName(chord, pitchClasses)} loaded into chromatic circle`);
    fireEvent('chordClicked');
  }, [pitchClasses, fireEvent]);

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
        {playbackLiveText}
      </div>
      <div
        className={styles.visuallyHidden}
        aria-live="polite"
        aria-atomic="true"
      >
        {sendBackMessage}
      </div>
      <AppHeader
        onLoadJson={handleLoadJsonClick}
      />
      <div className={styles.keyContextBar}>
        <button
          className={styles.settingsToggle}
          onClick={() => setIsSettingsOpen((v) => !v)}
          aria-expanded={isSettingsOpen}
          aria-label="Toggle settings panels"
          title="Settings"
        >
          ⚙
        </button>
        {isSettingsOpen && (
          <div className={styles.settingsCards}>
            <KeyContextPanel
              keyRoot={keyRoot}
              keyScale={keyScale}
              onSetKeyContext={setKeyContext}
            />
            <AudioDebugPanel params={audioParams} onChange={setAudioParams} />
          </div>
        )}
      </div>
      <div className={styles.primaryFlowContainer}>
        {/* Chromatic Circle - Left */}
        <section
          id="chromatic-circle"
          className={styles.circleArea}
          role="region"
          aria-label="Chromatic Circle - Select and shape the current chord"
        >
          <ChromaticCircle
            initialChordName={startupSelection.chordName}
            externalChord={playingChord}
            isPlaybackActive={isPlaying}
            playingPitchClass={playingPitchClass}
            onCurrentChordChange={handleCurrentChordChange}
            selectedScale={keyScale}
            keyRoot={keyRoot}
            showIntervals={false}
            showLegend={showLegend}
            onLegendChange={setShowLegend}
            selectedTone={selectedTone}
            onToneSelect={setSelectedTone}
            loadChord={sendBackChord}
            controlsLayout="below"
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
            selectedTone={selectedTone}
            onCloseToneInfo={() => setSelectedTone(null)}
            diatonicIndices={diatonicIndices}
            isProgressionFull={isProgressionFull}
            progressionLength={chords.length}
            maxProgressionLength={MAX_PROGRESSION_LENGTH}
            audioParams={audioParams}
            keyRoot={keyRoot}
            keyScale={keyScale}
            onSetKeyContext={setKeyContext}
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
            bpm={bpm}
            onBpmChange={setBpm}
            beatsPerChord={beatsPerChord}
            onBeatsPerChordChange={setBeatsPerChord}
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
            voiceLeadingConfig={voiceLeadingConfig}
            onVoiceLeadingConfigChange={setVoiceLeadingConfig}
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
          action={{ label: 'Dismiss', onClick: clearImportError }}
        />
      )}
      {previewError && (
        <Toast
          message={previewError}
          action={{ label: 'Dismiss', onClick: clearPreviewError }}
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
