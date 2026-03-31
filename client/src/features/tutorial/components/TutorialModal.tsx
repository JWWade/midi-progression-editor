import { useEffect, useRef } from 'react';
import type { TutorialStep } from '../types';
import styles from './TutorialModal.module.css';

export interface TutorialModalProps {
  step: TutorialStep;
  onDismiss: () => void;
  onSkip: () => void;
  onSkipAll: () => void;
}

/**
 * Full-screen modal overlay for onboarding tutorial steps.
 *
 * Traps keyboard focus inside the modal; pressing Escape dismisses it.
 * The backdrop is intentionally semi-transparent to keep context visible.
 */
export function TutorialModal({
  step,
  onDismiss,
  onSkip,
  onSkipAll,
}: TutorialModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog on mount.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Keyboard: Escape → dismiss; Tab focus trap within dialog.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDismiss();
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

  return (
    <div
      className={styles.backdrop}
      onClick={onDismiss}
      aria-hidden="true"
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

        <p id="tutorial-modal-desc" className={styles.description}>
          {step.description}
        </p>

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
            Skip for now
          </button>
        </div>

        <button
          type="button"
          className={styles.disableBtn}
          onClick={onSkipAll}
        >
          Disable all hints
        </button>
      </div>
    </div>
  );
}
