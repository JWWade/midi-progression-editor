import type { ScaleType } from '../../features/scale/types';
import { SCALE_LABELS } from '../../features/scale/types';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  selectedScale: ScaleType;
  onScaleChange: (scale: ScaleType) => void;
  showVoiceLeads: boolean;
  onVoiceLeadsChange: (show: boolean) => void;
  showExtension: boolean;
  onExtensionChange: (show: boolean) => void;
  showCentroid: boolean;
  onCentroidChange: (show: boolean) => void;
  showIntervals: boolean;
  onIntervalsChange: (show: boolean) => void;
}

export function AppHeader({
  selectedScale,
  onScaleChange,
  showVoiceLeads,
  onVoiceLeadsChange,
  showExtension,
  onExtensionChange,
  showCentroid,
  onCentroidChange,
  showIntervals,
  onIntervalsChange,
}: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.toggles}>
        {/* Show Voice Leads toggle */}
        <label htmlFor="show-voice-leads" className={styles.toggleLabel}>
          <input
            id="show-voice-leads"
            type="checkbox"
            checked={showVoiceLeads}
            onChange={(e) => onVoiceLeadsChange(e.target.checked)}
            className={styles.checkbox}
            aria-label="Toggle voice leads"
          />
          Voice Leads
        </label>

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
    </header>
  );
}
