import { useTheme } from '../providers/useTheme';
import { useEnharmonic } from '../providers/useEnharmonic';
import { PillToggle } from '@/shared/components/PillToggle/PillToggle';
import type { LayoutMode } from '../types/layoutMode';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  showCentroid: boolean;
  onCentroidChange: (show: boolean) => void;
  showIntervals: boolean;
  onIntervalsChange: (show: boolean) => void;
  showLegend: boolean;
  onLegendChange: (show: boolean) => void;
  onLoadJson: () => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
}

const LAYOUT_MODES: { mode: LayoutMode; label: string }[] = [
  { mode: 'inspect', label: 'Inspect' },
  { mode: 'compose', label: 'Compose' },
];

export function AppHeader({
  showCentroid,
  onCentroidChange,
  showIntervals,
  onIntervalsChange,
  showLegend,
  onLegendChange,
  onLoadJson,
  layoutMode,
  onLayoutModeChange,
}: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { useFlats, toggleEnharmonic } = useEnharmonic();

  return (
    <>
    {theme === 'retro' && (
      <div className={styles.retroBanner} aria-hidden="true">
        <span className={styles.retroBannerText}>
          ★ APEIROGRAPH ★ BUILD CHORD PROGRESSIONS ★ EXPORT MIDI ★ PLAY YOUR MUSIC ★ HAVE FUN ★ ADD CHORDS ★ EXPLORE HARMONY ★
        </span>
      </div>
    )}
    <header className={styles.header}>
      {/* Left section: pill toggles */}
      <div className={styles.leftSection}>
        <div className={styles.toggles}>
          <PillToggle
            id="show-centroid"
            checked={showCentroid}
            onChange={onCentroidChange}
            label="Center"
          />
          <PillToggle
            id="show-intervals"
            checked={showIntervals}
            onChange={onIntervalsChange}
            label="Intervals"
          />
          <PillToggle
            id="show-legend"
            checked={showLegend}
            onChange={onLegendChange}
            label="Legend"
          />
        </div>
      </div>

      {/* Center: brand / wordmark */}
      <div className={styles.brand} aria-label="Application name">
        <span className={styles.brandName}>Apeirograph</span>
      </div>

      {/* Right section: layout mode + utility controls */}
      <div className={styles.rightSection}>
        {/* Layout mode segmented controls */}
        <div className={styles.layoutModeControls} role="group" aria-label="Workspace mode">
          {LAYOUT_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              className={`${styles.layoutModeButton} ${layoutMode === mode ? styles.layoutModeButtonActive : ''}`}
              aria-pressed={layoutMode === mode}
              onClick={() => onLayoutModeChange(mode)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.rightControls}>
          {/* Load JSON session button */}
          <button
            type="button"
            className={styles.themeToggle}
            onClick={onLoadJson}
            aria-label="Load session from JSON file"
            title="Load session from JSON file"
          >
            Load JSON
          </button>

          {/* Theme toggle (cycles light → dark → retro → light) */}
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={
              theme === 'light'
                ? 'Switch to dark mode'
                : theme === 'dark'
                ? 'Switch to retro mode'
                : 'Switch to light mode'
            }
            title={
              theme === 'light'
                ? 'Switch to dark mode'
                : theme === 'dark'
                ? 'Switch to retro mode'
                : 'Switch to light mode'
            }
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
      </div>
    </header>
    </>
  );
}
