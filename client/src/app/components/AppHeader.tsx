import { useTheme } from '../providers/useTheme';
import { useEnharmonic } from '../providers/useEnharmonic';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  onLoadJson: () => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
}

export function AppHeader({
  onLoadJson,
  isSettingsOpen,
  onToggleSettings,
}: AppHeaderProps) {
  const { theme } = useTheme();
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
      {/* Left section: notation toggle */}
      <div className={styles.leftSection}>
        <div className={styles.toggles}>
          <label className={styles.enharmonicToggle} htmlFor="notation-toggle">
            <span className={styles.enharmonicSymbol} aria-hidden="true">♯</span>
            <input
              id="notation-toggle"
              type="checkbox"
              role="switch"
              checked={useFlats}
              onChange={(e) => {
                if (e.target.checked !== useFlats) {
                  toggleEnharmonic();
                }
              }}
              className={styles.enharmonicInput}
              aria-label="Use flat notation"
            />
            <span className={styles.enharmonicTrack} aria-hidden="true">
              <span className={styles.enharmonicThumb} />
            </span>
            <span className={styles.enharmonicSymbol} aria-hidden="true">♭</span>
          </label>
        </div>
      </div>

      {/* Center: brand / wordmark */}
      <div className={styles.brand}>
        <h1 className={styles.brandName}>Apeirograph</h1>
      </div>

      {/* Right section: utility controls */}
      <div className={styles.rightSection}>
        <div className={styles.rightControls}>
          <button
            type="button"
            className={styles.settingsToggle}
            onClick={onToggleSettings}
            aria-expanded={isSettingsOpen}
            aria-label="Toggle settings panels"
            title="Settings"
          >
            ⚙
          </button>

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

        </div>
      </div>
    </header>
    </>
  );
}
