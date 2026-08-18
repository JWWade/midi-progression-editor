import styles from "./NoteValueSelector.module.css";
import { NOTE_VALUE_OPTIONS } from "../utils/noteValues";

interface NoteValueSelectorProps {
  value: number;
  onChange: (beats: number) => void;
}

/** Inline SVG for a quarter note (filled head + stem). */
function QuarterNoteIcon() {
  return (
    <svg
      viewBox="0 0 20 28"
      width="16"
      height="22"
      aria-hidden="true"
      className={styles.noteIcon}
    >
      <line x1="13.5" y1="4" x2="13.5" y2="19" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="8" cy="21" rx="5.6" ry="4.1" transform="rotate(-18 8 21)" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Inline SVG for a half note (open head + stem). */
function HalfNoteIcon() {
  return (
    <svg
      viewBox="0 0 20 28"
      width="16"
      height="22"
      aria-hidden="true"
      className={styles.noteIcon}
    >
      <line x1="13.5" y1="4" x2="13.5" y2="19" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse
        cx="8"
        cy="21"
        rx="5.6"
        ry="4.1"
        transform="rotate(-18 8 21)"
        fill="none"
        strokeWidth="2.2"
      />
    </svg>
  );
}

/** Inline SVG for a whole note (open oval, no stem). */
function WholeNoteIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      aria-hidden="true"
      className={styles.noteIcon}
    >
      <ellipse cx="10" cy="10" rx="7" ry="5" transform="rotate(-12 10 10)" fill="none" strokeWidth="2.3" />
    </svg>
  );
}

const NOTE_ICONS: Record<number, React.ReactNode> = {
  1: <QuarterNoteIcon />,
  2: <HalfNoteIcon />,
  4: <WholeNoteIcon />,
};

/**
 * Segmented button group for selecting a musical note value (beats per chord).
 * Replaces the plain numeric `<select>` with Quarter / Half / Whole note options.
 */
export function NoteValueSelector({ value, onChange }: NoteValueSelectorProps) {
  return (
    <div className={styles.noteValueSelector} role="group" aria-label="Note value">
      {NOTE_VALUE_OPTIONS.map((opt) => {
        const isSelected = opt.beats === value;
        return (
          <button
            key={opt.beats}
            type="button"
            className={`${styles.noteButton} ${isSelected ? styles.selected : ""}`}
            onClick={() => onChange(opt.beats)}
            aria-pressed={isSelected}
            aria-label={opt.ariaLabel}
            title={opt.ariaLabel}
          >
            {NOTE_ICONS[opt.beats]}
            <span className={styles.noteLabel}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
