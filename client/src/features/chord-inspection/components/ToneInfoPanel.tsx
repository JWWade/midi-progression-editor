import type { ToneInfo } from "../types/tone-info";

interface ToneInfoPanelProps {
  selectedTone: ToneInfo | null;
}

const PANEL_STYLE: React.CSSProperties = {
  position: "absolute",
  right: 20,
  top: 100,
  width: 220,
  padding: "16px",
  backgroundColor: "#F3F4F6",
  borderRadius: 8,
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  border: "1px solid #E5E7EB",
  fontFamily: "system-ui, sans-serif",
};

const TITLE_STYLE: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "15px",
  fontWeight: "bold",
  color: "#111827",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "12px",
  color: "#6B7280",
  margin: "0",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const VALUE_STYLE: React.CSSProperties = {
  fontSize: "14px",
  color: "#1F2937",
  margin: "0 0 10px",
  fontWeight: "500",
};

const PLACEHOLDER_STYLE: React.CSSProperties = {
  fontSize: "13px",
  color: "#9CA3AF",
  margin: "0",
  fontStyle: "italic",
};

const CHORD_TAG_STYLE: React.CSSProperties = {
  display: "inline-block",
  fontSize: "11px",
  padding: "1px 6px",
  borderRadius: "4px",
  backgroundColor: "#E0E7FF",
  color: "#4338CA",
  marginBottom: "10px",
  fontWeight: "600",
};

export function ToneInfoPanel({ selectedTone }: ToneInfoPanelProps) {
  return (
    <div style={PANEL_STYLE} aria-label="Tone information panel" aria-live="polite">
      {selectedTone === null ? (
        <p style={PLACEHOLDER_STYLE}>Click a chord vertex to inspect its tone.</p>
      ) : (
        <>
          <h3 style={TITLE_STYLE}>{selectedTone.note.name}</h3>
          <span style={CHORD_TAG_STYLE}>{selectedTone.chordLabel}</span>
          <p style={LABEL_STYLE}>Role</p>
          <p style={VALUE_STYLE}>{selectedTone.role}</p>
          <p style={LABEL_STYLE}>Interval from root</p>
          <p style={VALUE_STYLE}>
            {selectedTone.interval === 0
              ? "0 semitones (unison)"
              : `+${selectedTone.interval} semitones`}
          </p>
          <p style={LABEL_STYLE}>Frequency</p>
          <p style={VALUE_STYLE}>{selectedTone.frequency.toFixed(2)} Hz</p>
        </>
      )}
    </div>
  );
}
