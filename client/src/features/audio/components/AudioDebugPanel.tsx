import React, { useState } from "react";
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

/** Returns a percentage string (0–100) relative to a slider's min/max range. */
function toPercent(value: number, min: number, max: number): string {
  return `${Math.round(((value - min) / (max - min)) * 100)}%`;
}

export function AudioDebugPanel({ params, onChange }: AudioDebugPanelProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field: keyof AudioParams, value: unknown) => {
    onChange({ ...params, [field]: value });
  };

  if (!isExpanded) {
    return (
      <div className={styles.toggleButton}>
        <button onClick={() => setIsExpanded(true)} aria-label="Sound settings">Sound</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Sound</h3>
        <button onClick={() => setIsExpanded(false)} aria-label="Collapse sound settings">
          ▼
        </button>
      </div>

      <div className={styles.controls}>
        {/* Volume */}
        <div className={styles.control}>
          <label htmlFor="masterVolume">Volume ({Math.round(params.masterVolume * 100)}%)</label>
          <input
            id="masterVolume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.masterVolume}
            aria-valuetext={`${Math.round(params.masterVolume * 100)}%`}
            onChange={(e) => handleChange("masterVolume", parseFloat(e.target.value))}
          />
        </div>

        {/* Attack */}
        <div className={styles.control}>
          <label htmlFor="attackTime">Attack</label>
          <input
            id="attackTime"
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={params.attackTime}
            aria-valuetext={toPercent(params.attackTime, 0.01, 0.5)}
            onChange={(e) => handleChange("attackTime", parseFloat(e.target.value))}
          />
        </div>

        {/* Decay */}
        <div className={styles.control}>
          <label htmlFor="decayTime">Decay</label>
          <input
            id="decayTime"
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={params.decayTime}
            aria-valuetext={toPercent(params.decayTime, 0.01, 0.5)}
            onChange={(e) => handleChange("decayTime", parseFloat(e.target.value))}
          />
        </div>

        {/* Sustain */}
        <div className={styles.control}>
          <label htmlFor="sustainLevel">Sustain</label>
          <input
            id="sustainLevel"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.sustainLevel}
            aria-valuetext={`${Math.round(params.sustainLevel * 100)}%`}
            onChange={(e) => handleChange("sustainLevel", parseFloat(e.target.value))}
          />
        </div>

        {/* Release */}
        <div className={styles.control}>
          <label htmlFor="releaseTime">Release</label>
          <input
            id="releaseTime"
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={params.releaseTime}
            aria-valuetext={toPercent(params.releaseTime, 0.01, 0.5)}
            onChange={(e) => handleChange("releaseTime", parseFloat(e.target.value))}
          />
        </div>

        {/* Tone */}
        <div className={styles.control}>
          <label htmlFor="oscillatorType">Tone</label>
          <select
            id="oscillatorType"
            value={params.oscillatorType}
            onChange={(e) => handleChange("oscillatorType", e.target.value as OscillatorTypeConfig)}
          >
            {OSCILLATOR_TYPES.map((type) => (
              <option key={type} value={type}>
                {WAVEFORM_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
