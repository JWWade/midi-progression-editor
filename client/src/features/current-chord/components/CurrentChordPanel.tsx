import { useState, useCallback } from "react";
import type { Chord } from "../types";
import { formatChordName, CHORD_QUALITY_LABELS } from "../utils/chordName";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";
import { ChordThumbnail } from "./ChordThumbnail";

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

const THUMBNAIL_STYLE: React.CSSProperties = {
  marginBottom: "4px",
};

const ADD_BUTTON_STYLE: React.CSSProperties = {
  marginTop: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  minWidth: "44px",
  minHeight: "44px",
  padding: "10px 20px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(79,70,229,0.35)",
  transition: "transform 0.1s ease, background-color 0.15s ease",
};

const ADD_BUTTON_DISABLED_STYLE: React.CSSProperties = {
  ...ADD_BUTTON_STYLE,
  backgroundColor: "#d1d5db",
  color: "#9ca3af",
  cursor: "not-allowed",
  boxShadow: "none",
};

const ADD_BUTTON_ACTIVE_STYLE: React.CSSProperties = {
  ...ADD_BUTTON_STYLE,
  transform: "scale(0.93)",
};

interface CurrentChordPanelProps {
  chord: Chord | null;
  onAddChord: () => void;
}

export function CurrentChordPanel({ chord, onAddChord }: CurrentChordPanelProps) {
  const noteIndices = chord ? getChordNoteIndices(chord.root, chord.quality) : [];
  const isDisabled = chord === null;
  const [pressing, setPressing] = useState(false);

  const handleClick = useCallback(() => {
    if (isDisabled) return;
    onAddChord();
  }, [isDisabled, onAddChord]);

  const handlePointerDown = useCallback(() => {
    if (!isDisabled) setPressing(true);
  }, [isDisabled]);

  const handlePointerUp = useCallback(() => {
    setPressing(false);
  }, []);

  const buttonStyle = isDisabled
    ? ADD_BUTTON_DISABLED_STYLE
    : pressing
      ? ADD_BUTTON_ACTIVE_STYLE
      : ADD_BUTTON_STYLE;

  return (
    <div style={PANEL_STYLE} aria-label="Current chord panel" aria-live="polite">
      <span style={LABEL_STYLE}>Current Chord</span>
      <div style={THUMBNAIL_STYLE}>
        <ChordThumbnail
          noteIndices={noteIndices}
          quality={chord?.quality ?? "major"}
          size={80}
        />
      </div>
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
      <button
        style={buttonStyle}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label="Add chord to progression"
      >
        Add to Progression &#8594;
      </button>
    </div>
  );
}
