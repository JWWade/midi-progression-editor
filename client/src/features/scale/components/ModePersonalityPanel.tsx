import { memo } from "react";
import type { ScaleBrightness, ScaleType, ScaleStability, ScaleTension } from "@/features/scale/types";
import { SCALE_DESCRIPTORS } from "@/features/scale/types";
import styles from "./ModePersonalityPanel.module.css";

interface ModePersonalityPanelProps {
  scaleType: ScaleType;
}

const TENSION_COLORS: Record<ScaleTension, string> = {
  stable:     "var(--color-accent)",
  moderate:   "hsl(45, 80%, 50%)",
  floating:   "hsl(200, 65%, 52%)",
  unresolved: "hsl(28, 78%, 50%)",
  high:       "hsl(340, 50%, 44%)",
};

const STABILITY_COLORS: Record<ScaleStability, string> = {
  low: "hsl(355, 60%, 45%)",
  moderate: "hsl(28, 78%, 50%)",
  high: "hsl(163, 62%, 38%)",
  veryHigh: "hsl(209, 72%, 43%)",
};

const BRIGHTNESS_COLORS: Record<ScaleBrightness, string> = {
  dark: "hsl(222, 20%, 34%)",
  neutral: "hsl(210, 10%, 46%)",
  warm: "hsl(24, 80%, 52%)",
  bright: "hsl(48, 90%, 48%)",
  ethereal: "hsl(196, 76%, 44%)",
};

export const ModePersonalityPanel = memo(function ModePersonalityPanel({
  scaleType,
}: ModePersonalityPanelProps) {
  const descriptor = SCALE_DESCRIPTORS[scaleType];

  return (
    <div className={styles.panel} aria-label="Mode personality">
      <p className={styles.summary}>{descriptor.summary}</p>
      <div className={styles.tagsRow}>
        {descriptor.mood.map((tag) => (
          <span key={tag} className={styles.moodChip}>{tag}</span>
        ))}
        <span
          className={`${styles.metricBadge} ${styles.tensionBadge}`}
          style={{ backgroundColor: TENSION_COLORS[descriptor.tension] }}
          aria-label={`Tension: ${descriptor.tension}`}
          title={`Tension: ${descriptor.tension}`}
        >
          <span className={`${styles.metricIcon} ${styles.metricIconTension}`} aria-hidden="true" />
          <span className={styles.metricAxis}>Tension</span>
          <span className={styles.metricValue}>{descriptor.tension}</span>
        </span>
        <span
          className={`${styles.metricBadge} ${styles.stabilityBadge}`}
          style={{ backgroundColor: STABILITY_COLORS[descriptor.stability] }}
          aria-label={`Stability: ${descriptor.stability}`}
          title={`Stability: ${descriptor.stability}`}
        >
          <span className={`${styles.metricIcon} ${styles.metricIconStability}`} aria-hidden="true" />
          <span className={styles.metricAxis}>Stability</span>
          <span className={styles.metricValue}>{descriptor.stability}</span>
        </span>
        <span
          className={`${styles.metricBadge} ${styles.brightnessBadge}`}
          style={{ backgroundColor: BRIGHTNESS_COLORS[descriptor.brightness] }}
          aria-label={`Brightness: ${descriptor.brightness}`}
          title={`Brightness: ${descriptor.brightness}`}
        >
          <span className={`${styles.metricIcon} ${styles.metricIconBrightness}`} aria-hidden="true" />
          <span className={styles.metricAxis}>Brightness</span>
          <span className={styles.metricValue}>{descriptor.brightness}</span>
        </span>
      </div>
      <p className={styles.culturalContext}>{descriptor.culturalContext.join(", ")}</p>
    </div>
  );
});
