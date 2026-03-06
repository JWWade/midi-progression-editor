import type { Chord } from "../types";
import { formatChordName, CHORD_QUALITY_LABELS } from "../utils/chordName";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";

const PANEL_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  padding: "16px 24px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  backgroundColor: "#f9fafb",
  minWidth: "180px",
  textAlign: "center",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#9ca3af",
  marginBottom: "4px",
};

const CHORD_NAME_STYLE: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#1f2937",
  lineHeight: 1.2,
};

const PLACEHOLDER_STYLE: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 500,
  color: "#9ca3af",
  fontStyle: "italic",
};

const ROOT_QUALITY_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  alignItems: "baseline",
  marginTop: "4px",
};

const ROOT_STYLE: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#4f46e5",
};

const QUALITY_STYLE: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "#6b7280",
};

interface CurrentChordPanelProps {
  chord: Chord | null;
}

export function CurrentChordPanel({ chord }: CurrentChordPanelProps) {
  return (
    <div style={PANEL_STYLE} aria-label="Current chord panel" aria-live="polite">
      <span style={LABEL_STYLE}>Current Chord</span>
      {chord === null ? (
        <span style={PLACEHOLDER_STYLE}>No chord selected</span>
      ) : (
        <>
          <span style={CHORD_NAME_STYLE}>{formatChordName(chord)}</span>
          <div style={ROOT_QUALITY_ROW_STYLE}>
            <span style={ROOT_STYLE}>{PITCH_CLASSES[chord.root]}</span>
            <span style={QUALITY_STYLE}>{CHORD_QUALITY_LABELS[chord.quality]}</span>
          </div>
        </>
      )}
    </div>
  );
}
