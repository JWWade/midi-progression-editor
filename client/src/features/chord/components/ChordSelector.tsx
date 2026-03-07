import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import { getChordName, CHORD_TYPE_ORDER } from "../data/chordNames";

interface ChordSelectorProps {
  value: string;
  onChange: (chordName: string) => void;
  id?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

export function ChordSelector({ value, onChange, id, style, "aria-label": ariaLabel }: ChordSelectorProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={style}
      aria-label={ariaLabel}
    >
      {PITCH_CLASSES.map((rootLabel, rootIndex) => (
        <optgroup key={rootLabel} label={rootLabel}>
          {CHORD_TYPE_ORDER.map((type) => {
            const name = getChordName(rootIndex, type);
            return (
              <option key={name} value={name}>
                {name}
              </option>
            );
          })}
        </optgroup>
      ))}
    </select>
  );
}
