import styles from './PillToggle.module.css';

interface PillToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function PillToggle({ id, checked, onChange, label }: PillToggleProps) {
  return (
    <label className={styles.wrapper} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.input}
        aria-label={label}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  );
}
