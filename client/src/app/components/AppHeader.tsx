import type { ScaleType } from '../../features/scale/types';
import { SCALE_LABELS } from '../../features/scale/types';
import type { CursorMode } from '../../shared/types/CursorMode';
import { useTheme } from '../providers/useTheme';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  cursorMode: CursorMode;
  onCursorModeChange: (mode: CursorMode) => void;
  selectedScale: ScaleType;
  onScaleChange: (scale: ScaleType) => void;
  showExtension: boolean;
  onExtensionChange: (show: boolean) => void;
  showCentroid: boolean;
  onCentroidChange: (show: boolean) => void;
  showIntervals: boolean;
  onIntervalsChange: (show: boolean) => void;
}

export function AppHeader({
  cursorMode,
  onCursorModeChange,
  selectedScale,
  onScaleChange,
  showExtension,
  onExtensionChange,
  showCentroid,
  onCentroidChange,
  showIntervals,
  onIntervalsChange,
}: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.toggles}>
        {/* Show Extension toggle */}
        <label htmlFor="show-extension" className={styles.toggleLabel}>
          <input
            id="show-extension"
            type="checkbox"
            checked={showExtension}
            onChange={(e) => onExtensionChange(e.target.checked)}
            className={styles.checkbox}
            aria-label="Toggle extension display"
          />
          Extension
        </label>

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
        {/* Cursor Mode Toggle */}
        <div className={styles.modeToggle} role="group" aria-label="Cursor Mode">
          <button
            type="button"
            className={`${styles.modeButton} ${cursorMode === 'info' ? styles.modeButtonActive : ''}`}
            onClick={() => onCursorModeChange('info')}
            aria-pressed={cursorMode === 'info'}
            title="Info mode (I key) - Click notes to view their details"
          >
            ℹ Info
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${cursorMode === 'select' ? styles.modeButtonActive : ''}`}
            onClick={() => onCursorModeChange('select')}
            aria-pressed={cursorMode === 'select'}
            title="Selection mode (S key) - Click notes to select/deselect"
          >
            ✓ Select
          </button>
        </div>

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
      </div>
    </header>
  );
}
