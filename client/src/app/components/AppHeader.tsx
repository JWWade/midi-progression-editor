import type { ScaleType } from '../../features/scale/types';
import { SCALE_LABELS } from '../../features/scale/types';
import { useTheme } from '../providers/useTheme';
import { useEnharmonic } from '../providers/useEnharmonic';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  selectedScale: ScaleType;
  onScaleChange: (scale: ScaleType) => void;
  showCentroid: boolean;
  onCentroidChange: (show: boolean) => void;
  showIntervals: boolean;
  onIntervalsChange: (show: boolean) => void;
}

export function AppHeader({
  selectedScale,
  onScaleChange,
  showCentroid,
  onCentroidChange,
  showIntervals,
  onIntervalsChange,
}: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { useFlats, toggleEnharmonic } = useEnharmonic();

  return (
    <header className={styles.header}>
      <div className={styles.toggles}>
        {/* Show Centroid toggle */}
        <label htmlFor="show-centroid" className={styles.toggleLabel}>
          <input
            id="show-centroid"
            type="checkbox"
            checked={showCentroid}
            onChange={(e) => onCentroidChange(e.target.checked)}
            className={styles.checkbox}
            aria-label="Toggle centroid display"
          />
          Centroid
        </label>

        {/* Show Intervals toggle */}
        <label htmlFor="show-intervals" className={styles.toggleLabel}>
          <input
            id="show-intervals"
            type="checkbox"
            checked={showIntervals}
            onChange={(e) => onIntervalsChange(e.target.checked)}
            className={styles.checkbox}
            aria-label="Toggle intervals display"
          />
          Intervals
        </label>
      </div>

      <div className={styles.rightControls}>
        {/* Scale selector */}
        <div className={styles.scaleSelector}>
          <label htmlFor="scale-select" className={styles.scaleLabel}>
            Scale:
          </label>
          <select
            id="scale-select"
            value={selectedScale}
            onChange={(e) => onScaleChange(e.target.value as ScaleType)}
            className={styles.select}
            aria-label="Select scale type"
          >
            {(Object.keys(SCALE_LABELS) as ScaleType[]).map((scale) => (
              <option key={scale} value={scale}>
                {SCALE_LABELS[scale]}
              </option>
            ))}
          </select>
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        {/* Enharmonic toggle */}
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleEnharmonic}
          aria-label={`Switch to ${useFlats ? 'sharp' : 'flat'} notation`}
          title={`Switch to ${useFlats ? 'sharp' : 'flat'} notation`}
        >
          {useFlats ? '♯ Sharps' : '♭ Flats'}
        </button>
      </div>
    </header>
  );
}
