import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import { getChordName, CHORD_TYPE_ORDER } from "../data/chordNames";
import type { ChordType } from "../types";

interface ChordSelectorProps {
  value: string;
  onChange: (chordName: string) => void;
  customChord?: { root: number; quality: ChordType; customNotes: number[] } | null;
  id?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

export function ChordSelector({ 
  value, onChange, customChord, id, style, "aria-label": ariaLabel 
}: ChordSelectorProps) {
  // Display custom chord as read-only pill with reset button
  if (customChord?.customNotes) {
    const noteNames = customChord.customNotes.map(i => PITCH_CLASSES[i]).join(" ");
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center", ...style }}>
        <span style={{ 
          padding: "4px 8px", 
          background: "#f3f4f6", 
          borderRadius: 4, 
          fontSize: 13,
          fontWeight: 600,
          border: "1px solid #d1d5db",
        }}>
          {noteNames}
        </span>
        <button
          type="button"
          onClick={() => onChange(value)}
          style={{ 
            padding: "2px 6px", 
            fontSize: 11, 
            cursor: "pointer",
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 3,
          }}
          title="Reset to named chord"
          aria-label="Reset to named chord"
        >
          ↻
        </button>
      </div>
    );
  }
  
  // Original dropdown for named chords
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
