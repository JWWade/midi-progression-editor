import { useTheme } from '../providers/useTheme';
import { useEnharmonic } from '../providers/useEnharmonic';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  showCentroid: boolean;
  onCentroidChange: (show: boolean) => void;
  showIntervals: boolean;
  onIntervalsChange: (show: boolean) => void;
  showLegend: boolean;
  onLegendChange: (show: boolean) => void;
}

export function AppHeader({
  showCentroid,
  onCentroidChange,
  showIntervals,
  onIntervalsChange,
  showLegend,
  onLegendChange,
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
          />
          Intervals
        </label>

        {/* Show Legend toggle */}
        <label htmlFor="show-legend" className={styles.toggleLabel}>
          <input
            id="show-legend"
            type="checkbox"
            checked={showLegend}
            onChange={(e) => onLegendChange(e.target.checked)}
            className={styles.checkbox}
          />
          Legend
        </label>
      </div>

      <div className={styles.rightControls}>
        {/* Theme toggle */}
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'retro' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'retro' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : theme === 'dark' ? '💾 Retro' : '☀️ Light'}
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
