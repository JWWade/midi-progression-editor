import { forwardRef, memo } from 'react';
import styles from './PlaceholderTile.module.css';

interface PlaceholderTileProps {
  id: string;
  intentId: string;
  /** Visual position in the full node list (1-based for aria-label). */
  position: number;
  isNew?: boolean;
  onDelete: (id: string) => void;
  onAnimationEnd?: () => void;
}

export const PlaceholderTile = memo(
  forwardRef<HTMLLIElement, PlaceholderTileProps>(function PlaceholderTile(
    { id, intentId, position, isNew = false, onDelete, onAnimationEnd },
    ref,
  ) {
    return (
      <li
        ref={ref}
        className={`${styles.tile}${isNew ? ` ${styles.tileHighlight}` : ''}`}
        aria-label={`Captured idea placeholder, position ${position}`}
        tabIndex={0}
        onAnimationEnd={onAnimationEnd}
      >
        <div className={styles.icon} aria-hidden="true">✦</div>
        <div className={styles.info}>
          <span className={styles.label}>Captured idea</span>
          <span className={styles.sub} title={intentId}>
            #{intentId.slice(0, 6)}
          </span>
        </div>
        <div className={styles.controls} aria-label="Placeholder controls">
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete(id)}
            aria-label="Remove captured idea placeholder"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </li>
    );
  }),
);
