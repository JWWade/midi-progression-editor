import { memo } from "react";
import type { ScaleType, ScaleTension } from "@/features/scale/types";
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
          className={styles.tensionBadge}
          style={{ backgroundColor: TENSION_COLORS[descriptor.tension] }}
          aria-label={`Tension: ${descriptor.tension}`}
        >
          {descriptor.tension}
        </span>
      </div>
      <p className={styles.culturalContext}>{descriptor.culturalContext.join(", ")}</p>
    </div>
  );
});
