import { useLayoutEffect, useEffect, useRef, useCallback } from 'react';
import type { TutorialStep, TutorialA11yDiagnostic } from '../types';
import styles from './TutorialTooltip.module.css';

export interface TutorialTooltipProps {
  step: TutorialStep;
  /** 1-based position of this step within remaining steps (0 = unknown). */
  stepIndex: number;
  /** Total number of remaining (not yet completed/skipped) steps. */
  totalSteps: number;
  onDismiss: (a11y?: TutorialA11yDiagnostic) => void;
  onSkip: (a11y?: TutorialA11yDiagnostic) => void;
  onSkipAll: () => void;
  /** Temporarily pause tutorial prompts. */
  onSnooze: () => void;
  /**
   * Called once on mount with focus diagnostics so the provider can record
   * accessibility outcomes and emit warnings when focus fails.
   */
  onFocusDiagnostic?: (stepId: string, diagnostic: TutorialA11yDiagnostic) => void;
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
  stepIndex,
  totalSteps,
  onDismiss,
  onSkip,
  onSkipAll,
  onSnooze,
  onFocusDiagnostic,
}: TutorialTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  // Capture the element that had focus before the tooltip mounted so we can
  // restore it when the tooltip is dismissed.
  const returnFocusRef = useRef<Element | null>(null);
  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    return () => {
      if (returnFocusRef.current instanceof HTMLElement) {
        returnFocusRef.current.focus();
      }
    };
  }, []);

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;

    function applyPosition() {
      if (!el) return;

      if (!step.targetSelector) {
        el.classList.add(styles.centered);
        el.style.top = '';
        el.style.left = '';
        return;
      }

      const target = document.querySelector(step.targetSelector);
      if (!target) {
        el.classList.add(styles.centered);
        el.style.top = '';
        el.style.left = '';
        return;
      }

      const rect = target.getBoundingClientRect();
      const tipRect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const viewportW = window.innerWidth;
      const MARGIN = 12;

      const spaceBelow = viewportH - rect.bottom - MARGIN;
      const spaceAbove = rect.top - MARGIN;
      const placement: 'below' | 'above' =
        spaceBelow >= tipRect.height
          ? 'below'
          : spaceAbove >= tipRect.height
            ? 'above'
            : spaceBelow >= spaceAbove
              ? 'below'
              : 'above';

      const rawTop =
        placement === 'below'
          ? rect.bottom + MARGIN
          : rect.top - tipRect.height - MARGIN;
      const top = Math.min(
        Math.max(rawTop, MARGIN),
        Math.max(MARGIN, viewportH - tipRect.height - MARGIN),
      );

      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - tipRect.width / 2, MARGIN),
        viewportW - tipRect.width - MARGIN,
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

  // Keyboard: Escape → dismiss (keyboard input method)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDismiss({ focusSuccess: true, inputMethod: 'keyboard' });
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [onDismiss]);

  // Move focus into tooltip on mount and report accessibility diagnostics.
  useEffect(() => {
    tooltipRef.current?.focus();
    const focusSuccess = document.activeElement === tooltipRef.current;
    onFocusDiagnostic?.(step.id, { focusSuccess });
    // Intentionally omitting `onFocusDiagnostic` and `step.id` from deps
    // — this diagnostic should fire exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect input method from a click event detail.
  const getInputMethod = useCallback(
    (e: React.MouseEvent): 'keyboard' | 'pointer' =>
      e.detail === 0 ? 'keyboard' : 'pointer',
    [],
  );

  // Whether this is a centred banner (no anchor) — determines initial class.
  // After mount, the layout effect will adjust if a target is found.
  const hasTarget = Boolean(step.targetSelector);
  const showProgress = stepIndex > 0 && totalSteps > 0;
  const descId = `tutorial-tooltip-desc-${step.id}`;

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-modal="false"
      aria-label={`Tutorial tip: ${step.title}`}
      aria-describedby={descId}
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
        {showProgress && (
          <span className={styles.progress} aria-label={`Step ${stepIndex} of ${totalSteps}`}>
            {stepIndex}/{totalSteps}
          </span>
        )}
      </div>

      <p id={descId} className={styles.description}>{step.description}</p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={(e) => onDismiss({ focusSuccess: true, inputMethod: getInputMethod(e) })}
          autoFocus
        >
          Got it
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={(e) => onSkip({ focusSuccess: true, inputMethod: getInputMethod(e) })}
        >
          Skip
        </button>
        <button
          type="button"
          className={styles.snoozeBtn}
          onClick={onSnooze}
          aria-label="Snooze tutorial hints for 30 minutes"
        >
          Snooze
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
