/**
 * Inline badge component displaying shared notes between adjacent chord pairs.
 * Rendered between progression tiles to show note overlap at a glance.
 */

import React, { memo } from "react";
import type { PairMetric } from "../utils/pairMetrics";
import styles from "./PairMetricBadge.module.css";

interface PairMetricBadgeProps {
  metric: PairMetric;
  /** Optional aria-label override for cases where parent provides rich context with chord names */
  ariaLabel?: string;
}

export const PairMetricBadge = memo(function PairMetricBadge({ metric, ariaLabel }: PairMetricBadgeProps): React.ReactElement | null {
  // Hide metrics for identical chord pairs
  if (metric.hide) {
    return null;
  }

  const minSize = Math.min(metric.sizeA, metric.sizeB);
  const percentage = Math.round(metric.proportion * 100);
  const badgeText = `${metric.sharedCount}/${minSize}`;
  const defaultLabel = `${metric.sharedCount} notes in common (${percentage}%)`;
  const label = ariaLabel || defaultLabel;
  const title = `${metric.sharedCount} notes in common (${percentage}%)`;

  return (
    <div
      className={styles.badge}
      role="img"
      aria-label={label}
      title={title}
      tabIndex={0}
    >
      {/* Badge text: "2/3" */}
      <div className={styles.badgeText}>{badgeText}</div>

      {/* Micro progress bar */}
      <div className={styles.microBarContainer}>
        <div
          className={styles.microBarFill}
          style={{ width: `${metric.proportion * 100}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Percentage label */}
      <div className={styles.percentage} aria-hidden="true">
        {percentage}%
      </div>
    </div>
  );
});
