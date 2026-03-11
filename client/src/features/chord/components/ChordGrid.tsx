import { useCallback, useEffect, useRef, useState } from "react";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import { ChordQualityColors } from "../constants/chordQualityColors";
import { CHORD_NAME_TO_DATA, CHORD_TYPE_ORDER, getChordName } from "../data/chordNames";
import type { ChordType } from "../types";

const QUALITY_LABELS: Record<ChordType, string> = {
  major: "maj",
  minor: "m",
  dim: "dim",
  aug: "aug",
  dom7: "7",
  maj7: "maj7",
  min7: "m7",
  halfdim7: "m7b5",
};

interface ChordGridProps {
  value: string;
  onChange: (chordName: string) => void;
  customChord?: { root: number; quality: ChordType; customNotes: number[] } | null;
  "aria-label"?: string;
}

export function ChordGrid({ value, onChange, customChord, "aria-label": ariaLabel }: ChordGridProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleSelect = useCallback(
    (name: string) => {
      onChange(name);
      setIsOpen(false);
    },
    [onChange],
  );

  if (customChord?.customNotes) {
    const noteNames = customChord.customNotes.map((index) => PITCH_CLASSES[index]).join(" ");
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span
          style={{
            padding: "4px 8px",
            background: "#f3f4f6",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            border: "1px solid #d1d5db",
          }}
        >
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
          Reset
        </button>
      </div>
    );
  }

  const selectedData = CHORD_NAME_TO_DATA[value];
  const qualityColor = selectedData ? ChordQualityColors[selectedData.type] : null;

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="grid"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          minWidth: 90,
          padding: "5px 10px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          borderRadius: 6,
          background: "#fff",
          border: `1.5px solid ${qualityColor?.base ?? "#d1d5db"}`,
          color: qualityColor?.dark ?? "#374151",
          transition: "border-color 0.15s, color 0.15s",
        }}
      >
        <span>{value || "-"}</span>
        <span style={{ fontSize: 9, opacity: 0.6, marginTop: 1 }}>v</span>
      </button>

      {isOpen && (
        <div
          role="grid"
          aria-label="Chord picker"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 8px 28px rgba(0,0,0,0.16)",
            padding: "8px 10px",
            userSelect: "none",
          }}
        >
          <div role="row" style={{ display: "flex", marginBottom: 3 }}>
            <div style={{ width: 30, flexShrink: 0 }} />
            {CHORD_TYPE_ORDER.map((type) => (
              <div
                key={type}
                role="columnheader"
                style={{
                  width: 46,
                  flexShrink: 0,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: ChordQualityColors[type].dark,
                  letterSpacing: "0.05em",
                  paddingBottom: 3,
                  borderBottom: `2px solid ${ChordQualityColors[type].base}`,
                }}
              >
                {QUALITY_LABELS[type]}
              </div>
            ))}
          </div>

          {PITCH_CLASSES.map((rootLabel, rootIndex) => (
            <div key={rootLabel} role="row" style={{ display: "flex", alignItems: "center" }}>
              <div
                role="rowheader"
                style={{
                  width: 30,
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textAlign: "right",
                  paddingRight: 5,
                }}
              >
                {rootLabel}
              </div>
              {CHORD_TYPE_ORDER.map((type) => {
                const chordName = getChordName(rootIndex, type);
                const isSelected = chordName === value;
                const color = ChordQualityColors[type];
                return (
                  <button
                    key={type}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(chordName)}
                    style={{
                      width: 46,
                      height: 26,
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: isSelected ? 700 : 400,
                      cursor: "pointer",
                      border: isSelected ? `1.5px solid ${color.base}` : "1px solid transparent",
                      borderRadius: 4,
                      background: isSelected ? color.light : "transparent",
                      color: isSelected ? color.dark : "#374151",
                      textAlign: "center",
                      padding: 0,
                      transition: "background 0.08s",
                    }}
                    onMouseEnter={(event) => {
                      if (!isSelected) {
                        event.currentTarget.style.background = color.fill;
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!isSelected) {
                        event.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {chordName}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
