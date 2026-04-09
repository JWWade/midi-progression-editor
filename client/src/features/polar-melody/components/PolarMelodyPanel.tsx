import { useState, useMemo, useCallback, useEffect } from "react";
import { Midi } from "@tonejs/midi";
import type { ScaleType } from "@/features/scale/types";
import { SCALE_LABELS } from "@/features/scale/types";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import type { AudioParams } from "@/features/audio/constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "@/features/audio/constants/audioConfig";
import {
  samplePolarMelody,
  POLAR_MELODY_PRESETS,
  type PolarMelodyPresetKey,
} from "../utils/samplePolarMelody";
import { usePolarMelodyPlayer } from "../hooks/usePolarMelodyPlayer";
import styles from "./PolarMelodyPanel.module.css";

const STEP_OPTIONS = [4, 8, 16, 32] as const;
type StepCount = (typeof STEP_OPTIONS)[number];

const PRESET_KEYS = Object.keys(POLAR_MELODY_PRESETS) as PolarMelodyPresetKey[];
type PresetOption = PolarMelodyPresetKey | "custom";

interface PolarMelodyPanelProps {
  keyRoot: number;
  keyScale: ScaleType;
  bpm: number;
  audioParams?: AudioParams;
  /** Called whenever the active pitch class changes during preview playback. */
  onCurrentPitchClassChange?: (pitchClass: number | null) => void;
}

export function PolarMelodyPanel({
  keyRoot,
  keyScale,
  bpm,
  audioParams = DEFAULT_AUDIO_PARAMS,
  onCurrentPitchClassChange,
}: PolarMelodyPanelProps) {
  const [preset, setPreset] = useState<PresetOption>("rose");
  const [customA, setCustomA] = useState(1.0);
  const [customB, setCustomB] = useState(1.0);
  const [customK, setCustomK] = useState(4);
  const [steps, setSteps] = useState<StepCount>(16);

  const isCustom = preset === "custom";

  const { A, B, k } = useMemo(() => {
    if (isCustom) return { A: customA, B: customB, k: customK };
    return POLAR_MELODY_PRESETS[preset];
  }, [preset, isCustom, customA, customB, customK]);

  const sequence = useMemo(
    () => samplePolarMelody({ A, B, k, N: steps, keyRoot, keyScale }),
    [A, B, k, steps, keyRoot, keyScale],
  );

  const { isPlaying, currentStep, currentPitchClass, play, stop } =
    usePolarMelodyPlayer(sequence, bpm, audioParams);

  // Notify parent of the active pitch class so it can highlight the note on
  // the chromatic circle during preview playback.
  useEffect(() => {
    onCurrentPitchClassChange?.(currentPitchClass);
  }, [currentPitchClass, onCurrentPitchClassChange]);

  const handlePresetChange = useCallback((value: string) => {
    const p = value as PresetOption;
    setPreset(p);
    if (p !== "custom") {
      const preset = POLAR_MELODY_PRESETS[p];
      setCustomA(preset.A);
      setCustomB(preset.B);
      setCustomK(preset.k);
    }
  }, []);

  const handleExportMidi = useCallback(() => {
    const midi = new Midi();
    midi.header.setTempo(bpm);

    const track = midi.addTrack();
    track.name = "Polar Melody";

    const secondsPerBeat = 60 / bpm;
    // Sixteenth note duration
    const stepDuration = secondsPerBeat * 0.25;
    const octave = 4;

    sequence.forEach((pitchClass, i) => {
      const midiNote = 12 * (octave + 1) + pitchClass;
      track.addNote({
        midi: midiNote,
        time: i * stepDuration,
        duration: stepDuration * 0.9,
        velocity: 80 / 127,
      });
    });

    const bytes = midi.toArray();
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `polar-melody-${Date.now()}.mid`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [sequence, bpm]);

  const keyName = PITCH_CLASSES[keyRoot];
  const scaleName = SCALE_LABELS[keyScale];

  return (
    <div className={styles.panel}>
      <p className={styles.title}>Polar Melody</p>

      {/* Equation preset */}
      <div className={styles.controlRow}>
        <label className={styles.label} htmlFor="polar-preset">
          Preset
        </label>
        <select
          id="polar-preset"
          className={styles.select}
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value)}
          aria-label="Equation preset"
        >
          {PRESET_KEYS.map((key) => (
            <option key={key} value={key}>
              {POLAR_MELODY_PRESETS[key].label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* A, B, k parameters */}
      <div className={styles.controlRow}>
        <label className={styles.label} htmlFor="polar-A">
          A (offset)
        </label>
        <input
          id="polar-A"
          type="number"
          className={styles.numberInput}
          min={0.1}
          max={4.0}
          step={0.1}
          value={A}
          disabled={!isCustom}
          onChange={(e) => setCustomA(parseFloat(e.target.value) || 1)}
          aria-label="Constant offset A"
        />
      </div>

      <div className={styles.controlRow}>
        <label className={styles.label} htmlFor="polar-B">
          B (amplitude)
        </label>
        <input
          id="polar-B"
          type="number"
          className={styles.numberInput}
          min={0.1}
          max={4.0}
          step={0.1}
          value={B}
          disabled={!isCustom}
          onChange={(e) => setCustomB(parseFloat(e.target.value) || 1)}
          aria-label="Amplitude B"
        />
      </div>

      <div className={styles.controlRow}>
        <label className={styles.label} htmlFor="polar-k">
          k (frequency)
        </label>
        <input
          id="polar-k"
          type="number"
          className={styles.numberInput}
          min={1}
          max={16}
          step={1}
          value={k}
          disabled={!isCustom}
          onChange={(e) => setCustomK(Math.round(parseFloat(e.target.value)) || 1)}
          aria-label="Angular frequency k"
        />
      </div>

      {/* N steps */}
      <div className={styles.controlRow}>
        <label className={styles.label} htmlFor="polar-N">
          N (steps)
        </label>
        <select
          id="polar-N"
          className={styles.select}
          value={steps}
          onChange={(e) => setSteps(parseInt(e.target.value, 10) as StepCount)}
          aria-label="Number of steps"
        >
          {STEP_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Key context (read-only) */}
      <div className={styles.controlRow}>
        <span className={styles.label}>Key</span>
        <span className={styles.readonlyText}>
          {keyName} {scaleName}
        </span>
      </div>

      {/* Playback + export */}
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={`${styles.button} ${isPlaying ? styles.buttonActive : ""}`}
          onClick={isPlaying ? stop : play}
          aria-label={isPlaying ? "Stop preview" : "Start preview"}
        >
          {isPlaying ? "■ Stop" : "▶ Preview"}
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={handleExportMidi}
          aria-label="Export MIDI"
        >
          Export MIDI
        </button>
      </div>

      {/* Note grid */}
      <div className={styles.noteGrid} role="list" aria-label="Generated note sequence">
        {sequence.slice(0, 32).map((pc, i) => (
          <span
            key={i}
            role="listitem"
            className={`${styles.noteCell} ${isPlaying && i === currentStep ? styles.noteCellActive : ""}`}
            aria-current={isPlaying && i === currentStep ? "true" : undefined}
          >
            {PITCH_CLASSES[pc]}
          </span>
        ))}
      </div>
    </div>
  );
}

export type { PolarMelodyPanelProps };
