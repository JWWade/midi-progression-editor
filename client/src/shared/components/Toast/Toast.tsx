import React from 'react';
import styles from './Toast.module.css';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  message: string;
  action?: ToastAction;
}

export function Toast({ message, action }: ToastProps): React.ReactElement {
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.message}>{message}</span>
      {action && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
