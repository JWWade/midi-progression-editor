import React from "react";
import type { AudioParams, OscillatorTypeConfig } from "../constants/audioConfig";
import styles from "./AudioDebugPanel.module.css";

interface AudioDebugPanelProps {
  params: AudioParams;
  onChange: (params: AudioParams) => void;
}

/** Musical display names for oscillator waveform types. */
const WAVEFORM_LABELS: Record<OscillatorTypeConfig, string> = {
  sine: "Mellow",
  triangle: "Warm",
  square: "Hollow",
  sawtooth: "Bright",
};

const OSCILLATOR_TYPES: OscillatorTypeConfig[] = ["sine", "triangle", "square", "sawtooth"];

export function AudioDebugPanel({ params, onChange }: AudioDebugPanelProps): React.ReactElement {
  const handleChange = (field: keyof AudioParams, value: unknown) => {
    onChange({ ...params, [field]: value });
  };

  return (
    <section className={styles.panel} aria-label="Sound settings">
      <span className={styles.label}>Sound Settings</span>
      <div className={styles.controls}>
        <div className={styles.control}>
          <label htmlFor="masterVolume" className={styles.controlLabel}>
            Volume ({Math.round(params.masterVolume * 100)}%)
          </label>
          <input
            id="masterVolume"
            type="range"
            className={styles.slider}
            min="0"
            max="1"
            step="0.01"
            value={params.masterVolume}
            aria-valuetext={`${Math.round(params.masterVolume * 100)}%`}
            onChange={(e) => handleChange("masterVolume", parseFloat(e.target.value))}
          />
        </div>
        <div className={styles.control}>
          <label htmlFor="oscillatorType" className={styles.controlLabel}>Tone</label>
          <select
            id="oscillatorType"
            className={styles.select}
            value={params.oscillatorType}
            onChange={(e) => handleChange("oscillatorType", e.target.value as OscillatorTypeConfig)}
          >
            {OSCILLATOR_TYPES.map((type) => (
              <option key={type} value={type}>{WAVEFORM_LABELS[type]}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
