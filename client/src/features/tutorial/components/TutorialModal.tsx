import { useEffect, useRef, useCallback } from 'react';
import type { TutorialStep, TutorialA11yDiagnostic } from '../types';
import styles from './TutorialModal.module.css';

export interface TutorialModalProps {
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
 * Full-screen modal overlay for onboarding tutorial steps.
 *
 * Traps keyboard focus inside the modal; pressing Escape dismisses it.
 * The backdrop is intentionally semi-transparent to keep context visible.
 */
export function TutorialModal({
  step,
  stepIndex,
  totalSteps,
  onDismiss,
  onSkip,
  onSkipAll,
  onSnooze,
  onFocusDiagnostic,
}: TutorialModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Capture the element that had focus before the modal mounted so we can
  // restore it when the modal is dismissed.
  const returnFocusRef = useRef<Element | null>(null);
  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    return () => {
      if (returnFocusRef.current instanceof HTMLElement) {
        returnFocusRef.current.focus();
      }
    };
  }, []);

  // Move focus into the dialog on mount and report accessibility diagnostics.
  useEffect(() => {
    dialogRef.current?.focus();
    const focusSuccess = document.activeElement === dialogRef.current;
    onFocusDiagnostic?.(step.id, { focusSuccess });
    // Intentionally omitting `onFocusDiagnostic` and `step.id` from deps
    // — this diagnostic should fire exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard: Escape → dismiss; Tab focus trap within dialog.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDismiss({ focusSuccess: true, inputMethod: 'keyboard' });
        return;
      }

      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [onDismiss]);

  // Detect input method from a click event detail.
  const getInputMethod = useCallback(
    (e: React.MouseEvent): 'keyboard' | 'pointer' =>
      e.detail === 0 ? 'keyboard' : 'pointer',
    [],
  );

  const showProgress = stepIndex > 0 && totalSteps > 0;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        e.stopPropagation();
        onDismiss({ focusSuccess: true, inputMethod: 'pointer' });
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-modal-title"
        aria-describedby="tutorial-modal-desc"
        className={styles.modal}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.iconRow} aria-hidden="true">
          🎓
        </div>

        <h2 id="tutorial-modal-title" className={styles.title}>
          {step.title}
        </h2>

        {showProgress && (
          <p
            className={styles.progressText}
            aria-label={`Step ${stepIndex} of ${totalSteps}`}
          >
            {stepIndex} of {totalSteps}
          </p>
        )}

        <p id="tutorial-modal-desc" className={styles.description}>
          {step.description}
        </p>

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
            Skip for now
          </button>
        </div>

        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.snoozeBtn}
            onClick={onSnooze}
            aria-label="Snooze tutorial hints for 30 minutes"
          >
            Snooze (30 min)
          </button>
          <button
            type="button"
            className={styles.disableBtn}
            onClick={onSkipAll}
          >
            Disable all hints
          </button>
        </div>
      </div>
    </div>
  );
}
