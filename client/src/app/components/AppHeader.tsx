import { useTheme } from '../providers/useTheme';
import { useEnharmonic } from '../providers/useEnharmonic';
import styles from './AppHeader.module.css';

function UploadJsonIcon() {
  return (
    <svg
      className={styles.loadJsonIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7.5 18.5H6.2a4.2 4.2 0 0 1-.7-8.35A5.75 5.75 0 0 1 17.9 8.7a3.75 3.75 0 0 1 1.6 7.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.4V9.4m0 0-2.2 2.2M12 9.4l2.2 2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.8 15.2h1.4m11.6 0h1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <text
        x="19.4"
        y="19"
        fontSize="5.2"
        fontWeight="700"
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {"{}"}
      </text>
    </svg>
  );
}

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
            aria-label="Upload JSON"
            title="Upload JSON"
          >
            <UploadJsonIcon />
          </button>

        </div>
      </div>
    </header>
    </>
  );
}
