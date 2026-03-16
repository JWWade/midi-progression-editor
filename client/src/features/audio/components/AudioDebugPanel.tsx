import React, { useState } from "react";
import type { AudioParams, OscillatorTypeConfig } from "../constants/audioConfig";
import styles from "./AudioDebugPanel.module.css";

interface AudioDebugPanelProps {
  params: AudioParams;
  onChange: (params: AudioParams) => void;
}

const OSCILLATOR_TYPES: OscillatorTypeConfig[] = ["sine", "square", "sawtooth", "triangle"];

export function AudioDebugPanel({ params, onChange }: AudioDebugPanelProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (field: keyof AudioParams, value: unknown) => {
    onChange({ ...params, [field]: value });
  };

  if (!isExpanded) {
    return (
      <div className={styles.toggleButton}>
        <button onClick={() => setIsExpanded(true)}>▶ Audio Debug</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Audio Debug Panel</h3>
        <button onClick={() => setIsExpanded(false)} aria-label="Collapse audio debug panel">
          ▼
        </button>
      </div>

      <div className={styles.controls}>
        {/* Master Volume */}
        <div className={styles.control}>
          <label htmlFor="masterVolume">Master Volume ({params.masterVolume.toFixed(2)})</label>
          <input
            id="masterVolume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.masterVolume}
            onChange={(e) => handleChange("masterVolume", parseFloat(e.target.value))}
          />
        </div>

        {/* Attack Peak */}
        <div className={styles.control}>
          <label htmlFor="attackPeak">Attack Peak ({params.attackPeak.toFixed(2)})</label>
          <input
            id="attackPeak"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.attackPeak}
            onChange={(e) => handleChange("attackPeak", parseFloat(e.target.value))}
          />
        </div>

        {/* Attack Time */}
        <div className={styles.control}>
          <label htmlFor="attackTime">Attack ({params.attackTime.toFixed(3)}s)</label>
          <input
            id="attackTime"
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={params.attackTime}
            onChange={(e) => handleChange("attackTime", parseFloat(e.target.value))}
          />
        </div>

        {/* Decay Time */}
        <div className={styles.control}>
          <label htmlFor="decayTime">Decay ({params.decayTime.toFixed(3)}s)</label>
          <input
            id="decayTime"
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={params.decayTime}
            onChange={(e) => handleChange("decayTime", parseFloat(e.target.value))}
          />
        </div>

        {/* Sustain Level */}
        <div className={styles.control}>
          <label htmlFor="sustainLevel">Sustain ({params.sustainLevel.toFixed(2)})</label>
          <input
            id="sustainLevel"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.sustainLevel}
            onChange={(e) => handleChange("sustainLevel", parseFloat(e.target.value))}
          />
        </div>

        {/* Release Time */}
        <div className={styles.control}>
          <label htmlFor="releaseTime">Release ({params.releaseTime.toFixed(3)}s)</label>
          <input
            id="releaseTime"
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={params.releaseTime}
            onChange={(e) => handleChange("releaseTime", parseFloat(e.target.value))}
          />
        </div>

        {/* Oscillator Type */}
        <div className={styles.control}>
          <label htmlFor="oscillatorType">Waveform</label>
          <select
            id="oscillatorType"
            value={params.oscillatorType}
            onChange={(e) => handleChange("oscillatorType", e.target.value as OscillatorTypeConfig)}
          >
            {OSCILLATOR_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Scale Gain by Note Count */}
        <div className={styles.control}>
          <label htmlFor="scaleGainByNoteCount">
            <input
              id="scaleGainByNoteCount"
              type="checkbox"
              checked={params.scaleGainByNoteCount}
              onChange={(e) => handleChange("scaleGainByNoteCount", e.target.checked)}
            />
            Scale gain by note count (prevents clipping)
          </label>
        </div>

        {/* Compressor Threshold */}
        <div className={styles.control}>
          <label htmlFor="compressorThreshold">Compressor Threshold ({params.compressorThreshold.toFixed(1)}dB)</label>
          <input
            id="compressorThreshold"
            type="range"
            min="-100"
            max="0"
            step="1"
            value={params.compressorThreshold}
            onChange={(e) => handleChange("compressorThreshold", parseFloat(e.target.value))}
          />
        </div>

        {/* Compressor Ratio */}
        <div className={styles.control}>
          <label htmlFor="compressorRatio">Compressor Ratio ({params.compressorRatio.toFixed(1)}:1)</label>
          <input
            id="compressorRatio"
            type="range"
            min="1"
            max="20"
            step="0.1"
            value={params.compressorRatio}
            onChange={(e) => handleChange("compressorRatio", parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
