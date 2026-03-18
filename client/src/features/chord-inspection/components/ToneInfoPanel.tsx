import { useState, useCallback } from "react";
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
  backgroundColor: "var(--color-bg-surface)",
  borderRadius: 8,
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  border: "1px solid var(--color-border)",
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
  color: "var(--color-text-primary)",
};

const CLOSE_BUTTON_STYLE: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--color-text-muted)",
  fontSize: "20px",
  lineHeight: "1",
  padding: "0 0 0 8px",
  flexShrink: 0,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--color-text-secondary)",
  margin: "0",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const VALUE_STYLE: React.CSSProperties = {
  fontSize: "14px",
  color: "var(--color-text-primary)",
  margin: "0 0 10px",
  fontWeight: "500",
};

const COPY_BUTTON_STYLE: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: "0",
  cursor: "pointer",
  fontSize: "inherit",
  fontWeight: "inherit",
  color: "inherit",
  fontFamily: "inherit",
  textDecoration: "underline dotted",
};

const COPIED_LABEL_STYLE: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--color-text-secondary)",
  marginLeft: "4px",
};

export function ToneInfoPanel({ selectedTone, onClose }: ToneInfoPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyFrequency = useCallback(() => {
    if (selectedTone === null) return;
    navigator.clipboard.writeText(selectedTone.frequency.toFixed(2)).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => { /* clipboard write failed silently */ },
    );
  }, [selectedTone]);

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
      {selectedTone.enharmonicEquivalent !== undefined && (
        <>
          <p style={LABEL_STYLE}>Enharmonic Equivalent</p>
          <p style={VALUE_STYLE}>{selectedTone.enharmonicEquivalent}</p>
        </>
      )}
      {selectedTone.scaleDegree !== undefined && (
        <>
          <p style={LABEL_STYLE}>Scale Degree</p>
          <p style={VALUE_STYLE}>{selectedTone.scaleDegree}</p>
        </>
      )}
      <p style={LABEL_STYLE}>Frequency</p>
      <p style={VALUE_STYLE}>
        <button
          style={COPY_BUTTON_STYLE}
          onClick={handleCopyFrequency}
          aria-label="Copy frequency value"
          title="Click to copy"
        >
          {selectedTone.frequency.toFixed(2)}
        </button>
        {" "}Hz{copied && <span style={COPIED_LABEL_STYLE}>Copied!</span>}
      </p>
    </div>
  );
}
