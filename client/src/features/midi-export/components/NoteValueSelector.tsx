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
      viewBox="0 0 18 30"
      width="14"
      height="23"
      aria-hidden="true"
      className={styles.noteIcon}
    >
      {/* Stem */}
      <line x1="13" y1="3" x2="13" y2="23" strokeWidth="2" strokeLinecap="round" />
      {/* Filled note head */}
      <ellipse cx="8" cy="23" rx="7" ry="5" transform="rotate(-15 8 23)" />
    </svg>
  );
}

/** Inline SVG for a half note (open head + stem). */
function HalfNoteIcon() {
  return (
    <svg
      viewBox="0 0 18 30"
      width="14"
      height="23"
      aria-hidden="true"
      className={styles.noteIcon}
    >
      {/* Stem */}
      <line x1="13" y1="3" x2="13" y2="23" strokeWidth="2" strokeLinecap="round" />
      {/* Open note head */}
      <ellipse
        cx="8"
        cy="23"
        rx="7"
        ry="5"
        transform="rotate(-15 8 23)"
        fill="none"
        strokeWidth="2"
      />
    </svg>
  );
}

/** Inline SVG for a whole note (open oval, no stem). */
function WholeNoteIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      width="14"
      height="14"
      aria-hidden="true"
      className={styles.noteIcon}
    >
      {/* Open, slightly wider oval with a hollow centre */}
      <ellipse cx="9" cy="9" rx="8" ry="6" fill="none" strokeWidth="2.5" />
      <ellipse cx="9" cy="9" rx="3.5" ry="5.5" fill="currentColor" />
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
