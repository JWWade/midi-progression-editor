import { useTheme } from '../providers/useTheme';
import { useEnharmonic } from '../providers/useEnharmonic';
import { PillToggle } from '@/shared/components/PillToggle/PillToggle';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  showIntervals: boolean;
  onIntervalsChange: (show: boolean) => void;
  showLegend: boolean;
  onLegendChange: (show: boolean) => void;
  onLoadJson: () => void;
}

export function AppHeader({
  showIntervals,
  onIntervalsChange,
  showLegend,
  onLegendChange,
  onLoadJson,
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
      <div className={styles.brand}>
        <h1 className={styles.brandName}>Apeirograph</h1>
      </div>

      {/* Right section: utility controls */}
      <div className={styles.rightSection}>
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
