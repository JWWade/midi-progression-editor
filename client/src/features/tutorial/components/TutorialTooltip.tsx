import { useLayoutEffect, useEffect, useRef } from 'react';
import type { TutorialStep } from '../types';
import styles from './TutorialTooltip.module.css';

export interface TutorialTooltipProps {
  step: TutorialStep;
  onDismiss: () => void;
  onSkip: () => void;
  onSkipAll: () => void;
}

/**
 * Anchored coach-mark tooltip.
 *
 * When `step.targetSelector` points to a DOM element the tooltip is
 * positioned below (or above) that element using direct DOM style mutations
 * (avoids React state so the ESLint set-state-in-effect rule is not triggered).
 * If the selector resolves to nothing, the tooltip falls back to a fixed
 * bottom-centre banner via its CSS `.centered` class.
 */
export function TutorialTooltip({
  step,
  onDismiss,
  onSkip,
  onSkipAll,
}: TutorialTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;

    function applyPosition() {
      if (!el) return;

      if (!step.targetSelector) {
        el.classList.add(styles.centered);
        return;
      }

      const target = document.querySelector(step.targetSelector);
      if (!target) {
        el.classList.add(styles.centered);
        return;
      }

      const rect = target.getBoundingClientRect();
      const tipRect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const MARGIN = 12;

      const spaceBelow = viewportH - rect.bottom;
      const placement: 'below' | 'above' =
        spaceBelow >= tipRect.height + MARGIN ? 'below' : 'above';

      const top =
        placement === 'below'
          ? rect.bottom + MARGIN
          : rect.top - tipRect.height - MARGIN;

      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - tipRect.width / 2, MARGIN),
        window.innerWidth - tipRect.width - MARGIN,
      );

      el.classList.remove(styles.centered);
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;

      // Update arrow direction
      if (arrowRef.current) {
        arrowRef.current.className = [
          styles.arrow,
          placement === 'above' ? styles.arrowDown : styles.arrowUp,
        ].join(' ');
      }
    }

    applyPosition();
    window.addEventListener('resize', applyPosition);
    window.addEventListener('scroll', applyPosition, { passive: true });
    return () => {
      window.removeEventListener('resize', applyPosition);
      window.removeEventListener('scroll', applyPosition);
    };
  }, [step.targetSelector]);

  // Keyboard: Escape → dismiss
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [onDismiss]);

  // Move focus into tooltip on mount for accessibility.
  useEffect(() => {
    tooltipRef.current?.focus();
  }, []);

  // Whether this is a centred banner (no anchor) — determines initial class.
  // After mount, the layout effect will adjust if a target is found.
  const hasTarget = Boolean(step.targetSelector);

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-modal="false"
      aria-label={`Tutorial tip: ${step.title}`}
      className={`${styles.tooltip} ${hasTarget ? '' : styles.centered}`}
      tabIndex={-1}
    >
      {/* Arrow indicator: only shown when tooltip is anchored to a target */}
      {hasTarget && (
        <span
          ref={arrowRef}
          className={`${styles.arrow} ${styles.arrowUp}`}
          aria-hidden="true"
        />
      )}

      <div className={styles.header}>
        <span className={styles.badge} aria-hidden="true">
          💡
        </span>
        <strong className={styles.title}>{step.title}</strong>
      </div>

      <p className={styles.description}>{step.description}</p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onDismiss}
          autoFocus
        >
          Got it
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onSkip}
        >
          Skip
        </button>
        <button
          type="button"
          className={styles.tertiaryBtn}
          onClick={onSkipAll}
        >
          Disable hints
        </button>
      </div>
    </div>
  );
}
