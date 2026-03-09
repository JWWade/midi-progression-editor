import type { ToneInfo } from "../types/tone-info";

interface ToneInfoPanelProps {
  selectedTone: ToneInfo | null;
  onClose?: () => void;
}

const PANEL_STYLE: React.CSSProperties = {
  marginTop: "12px",
  width: "100%",
  maxWidth: "320px",
  padding: "14px 16px",
  backgroundColor: "#F3F4F6",
  borderRadius: 8,
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  border: "1px solid #E5E7EB",
  fontFamily: "system-ui, sans-serif",
  boxSizing: "border-box",
};

const HEADER_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: "6px",
};

const TITLE_STYLE: React.CSSProperties = {
  margin: "0",
  fontSize: "15px",
  fontWeight: "bold",
  color: "#111827",
};

const CLOSE_BUTTON_STYLE: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#9CA3AF",
  fontSize: "20px",
  lineHeight: "1",
  padding: "0 0 0 8px",
  flexShrink: 0,
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

export function ToneInfoPanel({ selectedTone, onClose }: ToneInfoPanelProps) {
  if (selectedTone === null) return null;

  return (
    <div style={PANEL_STYLE} aria-label="Tone information panel" aria-live="polite">
      <div style={HEADER_STYLE}>
        <h3 style={TITLE_STYLE}>{selectedTone.note.name}</h3>
        {onClose && (
          <button
            style={CLOSE_BUTTON_STYLE}
            onClick={onClose}
            aria-label="Close tone info panel"
          >
            ×
          </button>
        )}
      </div>
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
    </div>
  );
}
