import type { VoiceLeadingStyle, MotionBias } from "@/features/voice-leading";
import type { Chord } from "@/features/current-chord/types";
import styles from "./VoiceLeadingPanel.module.css";

interface Preset {
  label: string;
  startOctave: number;
  style: VoiceLeadingStyle;
}

const STYLE_OPTIONS: { value: VoiceLeadingStyle; label: string }[] = [
  { value: 'minimal', label: 'Smooth Stepwise' },
  { value: 'close', label: 'Tightly Stacked' },
  { value: 'open', label: 'Wide & Spacious' },
  { value: 'flexible', label: 'Flexible Voices' },
];

const STRICTNESS_STOPS = [
  { value: 0, label: 'Low' },
  { value: 2, label: 'Med' },
  { value: 4, label: 'High' },
];

const MOTION_BIAS_OPTIONS: { value: MotionBias; label: string; title: string }[] = [
  { value: 'up', label: '↑', title: 'Upward: prefer higher note on tie' },
  { value: 'neutral', label: '—', title: 'Neutral: no directional preference' },
  { value: 'down', label: '↓', title: 'Downward: prefer lower note on tie' },
];

const PRESETS: Preset[] = [
  { label: 'Classic SATB', startOctave: 3, style: 'minimal' },
  { label: 'Keyboard-Friendly', startOctave: 4, style: 'close' },
  { label: 'Bass-Led', startOctave: 2, style: 'open' },
];

interface VoiceLeadingPanelProps {
  chords: Chord[];
  style: VoiceLeadingStyle;
  onStyleChange: (v: VoiceLeadingStyle) => void;
  strictness: number;
  onStrictnessChange: (v: number) => void;
  motionBias: MotionBias;
  onMotionBiasChange: (v: MotionBias) => void;
  startOctave: number;
  onStartOctaveChange: (v: number) => void;
}

/** Check whether all chords in the progression share the same voice count. */
function allSameVoiceCount(chords: Chord[]): boolean {
  if (chords.length < 2) return true;
  const sizes = chords.map((c) =>
    c.customNotes && c.customNotes.length > 0 ? c.customNotes.length : defaultVoiceCount(c),
  );
  return sizes.every((s) => s === sizes[0]);
}

function defaultVoiceCount(chord: Chord): number {
  const q = chord.quality;
  if (q === 'major' || q === 'minor' || q === 'dim' || q === 'aug') return 3;
  return 4; // seventh chords
}

/**
 * Voice-leading control panel embedded in the MIDI export controls section.
 * Exposes style, strictness, motion bias and start octave to the user.
 */
export function VoiceLeadingPanel({
  chords,
  style,
  onStyleChange,
  strictness,
  onStrictnessChange,
  motionBias,
  onMotionBiasChange,
  startOctave,
  onStartOctaveChange,
}: VoiceLeadingPanelProps) {
  const strictnessDisabled = allSameVoiceCount(chords);
  const strictnessTooltip = strictnessDisabled
    ? 'All chords have the same voice count — strictness only affects mixed-size progressions'
    : undefined;

  function applyPreset(preset: Preset) {
    onStyleChange(preset.style);
    onStartOctaveChange(preset.startOctave);
  }

  const strictnessFillPct = `${(strictness / 4) * 100}%`;

  return (
    <div className={styles.panel}>
      <div className={styles.sectionHeader}>Voice-Leading</div>

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

      {/* Strictness slider */}
      <div className={styles.sliderRow} title={strictnessTooltip}>
        <div className={styles.sliderHeader}>
          <label
            className={`${styles.label} ${strictnessDisabled ? styles.disabled : ''}`}
            htmlFor="vl-strictness"
          >
            Strictness
          </label>
          <span className={`${styles.sliderValue} ${strictnessDisabled ? styles.disabled : ''}`}>
            {STRICTNESS_STOPS.find((s) => s.value === strictness)?.label ?? strictness}
          </span>
        </div>
        <input
          id="vl-strictness"
          className={styles.slider}
          type="range"
          min={0}
          max={4}
          step={2}
          value={strictness}
          disabled={strictnessDisabled}
          style={{
            background: strictnessDisabled
              ? undefined
              : `linear-gradient(to right, var(--color-accent, #6366f1) ${strictnessFillPct}, var(--color-border-subtle, #2a2a4a) ${strictnessFillPct})`,
          }}
          onChange={(e) => onStrictnessChange(e.target.valueAsNumber)}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={strictness}
          aria-valuetext={STRICTNESS_STOPS.find((s) => s.value === strictness)?.label}
          aria-disabled={strictnessDisabled}
        />
        <div className={styles.sliderTicks} aria-hidden="true">
          {STRICTNESS_STOPS.map((s) => (
            <span
              key={s.value}
              className={`${styles.tick} ${strictness === s.value ? styles.tickActive : ''}`}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tie-break preference */}
      <div className={styles.row}>
        <span className={styles.label}>Tie-Break</span>
        <div className={styles.biasGroup} role="group" aria-label="Tie-break preference">
          {MOTION_BIAS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.biasButton} ${motionBias === opt.value ? styles.biasSelected : ''}`}
              onClick={() => onMotionBiasChange(opt.value)}
              aria-pressed={motionBias === opt.value}
              title={opt.title}
              aria-label={opt.title}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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
              title={`${preset.label}: octave ${preset.startOctave}, ${STYLE_OPTIONS.find((o) => o.value === preset.style)?.label}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
