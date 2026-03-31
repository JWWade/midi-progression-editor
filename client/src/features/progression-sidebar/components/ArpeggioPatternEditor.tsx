import type { ArpeggioPattern, ArpeggioDirection, ArpeggioSubdivision } from "@/features/audio/types/arpeggioPattern";
import {
  ARPEGGIO_DIRECTION_LABELS,
  ARPEGGIO_SUBDIVISION_LABELS,
} from "@/features/audio/types/arpeggioPattern";
import styles from "./ArpeggioPatternEditor.module.css";

interface ArpeggioPatternEditorProps {
  pattern: ArpeggioPattern;
  onChange: (pattern: ArpeggioPattern) => void;
}

const DIRECTIONS: ArpeggioDirection[] = ["up", "down", "up-down", "random"];
const SUBDIVISIONS: ArpeggioSubdivision[] = ["quarter", "eighth", "sixteenth", "triplet"];
const REPEAT_OPTIONS = [1, 2, 3, 4];

export function ArpeggioPatternEditor({ pattern, onChange }: ArpeggioPatternEditorProps) {
  function update<K extends keyof ArpeggioPattern>(key: K, value: ArpeggioPattern[K]) {
    onChange({ ...pattern, [key]: value });
  }

  const swingFillPct = `${pattern.swingPercent}%`;

  return (
    <div
      className={styles.editor}
      role="group"
      aria-label="Arpeggio pattern settings"
    >
      {/* Direction */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Direction</legend>
        <div className={styles.radioGroup} role="radiogroup">
          {DIRECTIONS.map((dir) => (
            <label key={dir} className={styles.radioLabel}>
              <input
                type="radio"
                name="arpeggio-direction"
                value={dir}
                checked={pattern.direction === dir}
                onChange={() => update("direction", dir)}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>{ARPEGGIO_DIRECTION_LABELS[dir]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Subdivision */}
      <div className={styles.row}>
        <label className={styles.label} htmlFor="arpeggio-subdivision">
          Subdivision
        </label>
        <select
          id="arpeggio-subdivision"
          className={styles.select}
          value={pattern.subdivision}
          onChange={(e) => update("subdivision", e.target.value as ArpeggioSubdivision)}
          aria-label="Arpeggio note subdivision"
        >
          {SUBDIVISIONS.map((sub) => (
            <option key={sub} value={sub}>
              {ARPEGGIO_SUBDIVISION_LABELS[sub]}
            </option>
          ))}
        </select>
      </div>

      {/* Swing */}
      <div className={styles.row}>
        <div className={styles.sliderHeader}>
          <label className={styles.label} htmlFor="arpeggio-swing">
            Swing
          </label>
          <span className={styles.sliderValue} aria-hidden="true">
            {pattern.swingPercent}%
          </span>
        </div>
        <input
          id="arpeggio-swing"
          type="range"
          min={0}
          max={100}
          step={5}
          value={pattern.swingPercent}
          className={styles.slider}
          style={{
            background: `linear-gradient(to right, var(--color-accent, #6366f1) ${swingFillPct}, var(--color-border-subtle, #2a2a4a) ${swingFillPct})`,
          }}
          onChange={(e) => update("swingPercent", e.target.valueAsNumber)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pattern.swingPercent}
          aria-valuetext={`Swing: ${pattern.swingPercent}%`}
        />
      </div>

      {/* Repeats */}
      <div className={styles.row}>
        <label className={styles.label} htmlFor="arpeggio-repeats">
          Repeats
        </label>
        <select
          id="arpeggio-repeats"
          className={styles.select}
          value={pattern.repeats}
          onChange={(e) => update("repeats", Number(e.target.value))}
          aria-label="Number of arpeggio pattern repeats per chord"
        >
          {REPEAT_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
