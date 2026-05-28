import { useState } from "react";
import type { VoiceLeadingStyle, MotionBias, ExtensionRegisterPolicy } from "@/features/voice-leading";
import styles from "./VoiceLeadingPanel.module.css";

interface Preset {
  label: string;
  startOctave: number;
  style: VoiceLeadingStyle;
  /** Human-readable style label for display in tooltips. */
  styleLabel: string;
}

const STYLE_OPTIONS: { value: VoiceLeadingStyle; label: string }[] = [
  { value: 'minimal', label: 'Smooth Stepwise' },
  { value: 'close', label: 'Tightly Stacked' },
  { value: 'open', label: 'Wide & Spacious' },
  { value: 'flexible', label: 'Flexible Voices' },
];

const MOTION_BIAS_OPTIONS: { value: MotionBias; label: string; title: string }[] = [
  { value: 'up', label: '↑', title: 'Upward: prefer higher note on tie' },
  { value: 'neutral', label: '—', title: 'Neutral: no directional preference' },
  { value: 'down', label: '↓', title: 'Downward: prefer lower note on tie' },
];

const EXTENSION_REGISTER_OPTIONS: { value: ExtensionRegisterPolicy; label: string }[] = [
  { value: 'strict', label: 'Strict (keep 9/11/13 high)' },
  { value: 'relaxed', label: 'Relaxed (allow fold)' },
];

const PRESETS: Preset[] = [
  { label: 'Classic SATB', startOctave: 3, style: 'minimal', styleLabel: 'Smooth Stepwise' },
  { label: 'Keyboard-Friendly', startOctave: 4, style: 'close', styleLabel: 'Tightly Stacked' },
  { label: 'Bass-Led', startOctave: 2, style: 'open', styleLabel: 'Wide & Spacious' },
];

interface VoiceLeadingPanelProps {
  style: VoiceLeadingStyle;
  onStyleChange: (v: VoiceLeadingStyle) => void;
  motionBias: MotionBias;
  onMotionBiasChange: (v: MotionBias) => void;
  extensionRegisterPolicy: ExtensionRegisterPolicy;
  onExtensionRegisterPolicyChange: (v: ExtensionRegisterPolicy) => void;
  extensionGuardActive?: boolean;
  startOctave: number;
  onStartOctaveChange: (v: number) => void;
}

/**
 * Voice-leading control panel embedded in the MIDI export controls section.
 * Collapsed by default; click the header to expand.
 */
export function VoiceLeadingPanel({
  style,
  onStyleChange,
  motionBias,
  onMotionBiasChange,
  extensionRegisterPolicy,
  onExtensionRegisterPolicyChange,
  extensionGuardActive = false,
  startOctave,
  onStartOctaveChange,
}: VoiceLeadingPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Tie-break (motionBias) is only wired up in 'minimal' and 'flexible' styles
  const biasDisabled = style === 'close' || style === 'open';
  const biasTooltip = biasDisabled
    ? 'Tie-break only affects "Smooth Stepwise" and "Flexible Voices" styles'
    : undefined;

  const currentStyleLabel = STYLE_OPTIONS.find((o) => o.value === style)?.label ?? style;

  function applyPreset(preset: Preset) {
    onStyleChange(preset.style);
    onStartOctaveChange(preset.startOctave);
  }

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={styles.toggleHeader}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="vl-body"
      >
        <span className={styles.toggleTitle}>Voice-Leading</span>
        {!expanded && (
          <span className={styles.summary}>
            {currentStyleLabel} · Oct {startOctave}
            {extensionGuardActive && extensionRegisterPolicy === 'strict' ? ' · Ext Guard' : ''}
          </span>
        )}
        <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>▾</span>
      </button>

      {expanded && (
        <div id="vl-body" className={styles.body}>
          {/* Style selector */}
          <div className={styles.row}>
            <label className={styles.label} htmlFor="vl-style">
              Style
            </label>
            <select
              id="vl-style"
              className={styles.select}
              value={style}
              onChange={(e) => onStyleChange(e.target.value as VoiceLeadingStyle)}
              aria-label="Voice-leading style"
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tie-break preference */}
          <div className={styles.row}>
            <span className={`${styles.label} ${biasDisabled ? styles.disabled : ''}`}>Tie-Break</span>
            <div className={styles.biasGroup} role="group" aria-label="Tie-break preference" title={biasTooltip}>
              {MOTION_BIAS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.biasButton} ${motionBias === opt.value && !biasDisabled ? styles.biasSelected : ''}`}
                  onClick={() => !biasDisabled && onMotionBiasChange(opt.value)}
                  disabled={biasDisabled}
                  aria-pressed={motionBias === opt.value && !biasDisabled}
                  title={biasDisabled ? biasTooltip : opt.title}
                  aria-label={biasDisabled ? biasTooltip : opt.title}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Extension register policy */}
          <div className={styles.row}>
            <label className={styles.label} htmlFor="vl-extension-policy">
              Extension Reg
            </label>
            <select
              id="vl-extension-policy"
              className={styles.select}
              value={extensionRegisterPolicy}
              onChange={(e) => onExtensionRegisterPolicyChange(e.target.value as ExtensionRegisterPolicy)}
              aria-label="Extension register policy"
            >
              {EXTENSION_REGISTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {extensionGuardActive && extensionRegisterPolicy === 'strict' && (
            <div className={styles.guardHint} role="status" aria-live="polite">
              Ext Guard active for current progression
            </div>
          )}

          {/* Octave control */}
          <div className={styles.row}>
            <label className={styles.label} htmlFor="vl-octave">
              Start Octave
            </label>
            <select
              id="vl-octave"
              className={styles.selectSmall}
              value={startOctave}
              onChange={(e) => onStartOctaveChange(Number(e.target.value))}
              aria-label="Starting octave"
            >
              {[2, 3, 4, 5, 6].map((oct) => (
                <option key={oct} value={oct}>
                  {oct}
                </option>
              ))}
            </select>
          </div>

          {/* Style presets */}
          <div className={styles.presetsRow}>
            <span className={styles.label}>Presets</span>
            <div className={styles.presets}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={styles.presetButton}
                  onClick={() => applyPreset(preset)}
                  title={`${preset.label}: octave ${preset.startOctave}, ${preset.styleLabel}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
