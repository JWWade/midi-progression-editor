import { useState } from "react";
import { useChromaticCircleData } from "../hooks/useChromaticCircleData";
import { PITCH_CLASSES } from "../utils";
import { calculatePolygonPoints } from "../utils/geometry";
import {
  transposeChord,
  MAJOR_INTERVALS,
  MINOR_INTERVALS,
  MAJ7_INTERVALS,
  MIN7_INTERVALS,
  DOM7_INTERVALS,
  HALFDIM7_INTERVALS,
} from "@/features/chord/utils/transpose";
import type { ChordType } from "@/features/chord/types";
import { SEVENTH_CHORD_TYPES } from "@/features/chord/types";

const SIZE = 300;
const CENTER = SIZE / 2;
const RING_RADIUS = 110;
const NODE_RADIUS = 12;
const NATURAL_FONT_SIZE = 11;
const SHARP_FONT_SIZE = 9;
const PRIMARY_COLOR = "#4F46E5";
const SEVENTH_COLOR = "#A855F7";

const ACTIVE_BUTTON_STYLE: React.CSSProperties = {
  fontWeight: "bold",
  backgroundColor: PRIMARY_COLOR,
  color: "white",
  border: `2px solid ${PRIMARY_COLOR}`,
  borderRadius: "4px",
  padding: "4px 16px",
  cursor: "pointer",
};

const ACTIVE_SEVENTH_BUTTON_STYLE: React.CSSProperties = {
  fontWeight: "bold",
  backgroundColor: SEVENTH_COLOR,
  color: "white",
  border: `2px solid ${SEVENTH_COLOR}`,
  borderRadius: "4px",
  padding: "4px 16px",
  cursor: "pointer",
};

const INACTIVE_BUTTON_STYLE: React.CSSProperties = {
  fontWeight: "normal",
  backgroundColor: "transparent",
  color: PRIMARY_COLOR,
  border: `2px solid ${PRIMARY_COLOR}`,
  borderRadius: "4px",
  padding: "4px 16px",
  cursor: "pointer",
};

const INACTIVE_SEVENTH_BUTTON_STYLE: React.CSSProperties = {
  fontWeight: "normal",
  backgroundColor: "transparent",
  color: SEVENTH_COLOR,
  border: `2px solid ${SEVENTH_COLOR}`,
  borderRadius: "4px",
  padding: "4px 16px",
  cursor: "pointer",
};

const TOGGLE_CONTAINER_STYLE: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  justifyContent: "center",
};

const CONTROLS_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  alignItems: "center",
  marginBottom: "12px",
};

const ROOT_SELECTOR_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const SELECT_STYLE: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "4px",
  border: `2px solid ${PRIMARY_COLOR}`,
  color: PRIMARY_COLOR,
  fontWeight: "bold",
  cursor: "pointer",
  backgroundColor: "transparent",
};

const LABEL_STYLE: React.CSSProperties = {
  fontWeight: "bold",
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: "11px",
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const CHORD_GROUP_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  alignItems: "center",
};

const CHORD_INTERVALS: Record<ChordType, readonly number[]> = {
  major: MAJOR_INTERVALS,
  minor: MINOR_INTERVALS,
  maj7: MAJ7_INTERVALS,
  min7: MIN7_INTERVALS,
  dom7: DOM7_INTERVALS,
  halfdim7: HALFDIM7_INTERVALS,
};

export function ChromaticCircle() {
  const [chordType, setChordType] = useState<ChordType>("major");
  const [rootIndex, setRootIndex] = useState(0);
  const { scaleNotes, isLoading, error } = useChromaticCircleData();

  const isSeventhChord = SEVENTH_CHORD_TYPES.has(chordType);
  const baseIntervals = CHORD_INTERVALS[chordType];
  const chordNotes = transposeChord(baseIntervals, rootIndex);
  const chordIndices = chordNotes.map((n) => n.index);

  const strokeColor = isSeventhChord ? SEVENTH_COLOR : PRIMARY_COLOR;
  const strokeDasharray = isSeventhChord ? "5,5" : undefined;
  const fillColor = isSeventhChord
    ? "rgba(168, 85, 247, 0.1)"
    : "rgba(79, 70, 229, 0.1)";

  const getTriadButtonStyle = (type: ChordType): React.CSSProperties =>
    chordType === type ? ACTIVE_BUTTON_STYLE : INACTIVE_BUTTON_STYLE;

  const getSeventhButtonStyle = (type: ChordType): React.CSSProperties =>
    chordType === type ? ACTIVE_SEVENTH_BUTTON_STYLE : INACTIVE_SEVENTH_BUTTON_STYLE;

  return (
    <div>
      <div style={CONTROLS_STYLE}>
        <div style={CHORD_GROUP_STYLE}>
          <span style={SECTION_LABEL_STYLE}>Triads</span>
          <div style={TOGGLE_CONTAINER_STYLE}>
            <button onClick={() => setChordType("major")} style={getTriadButtonStyle("major")}>
              Major
            </button>
            <button onClick={() => setChordType("minor")} style={getTriadButtonStyle("minor")}>
              Minor
            </button>
          </div>
        </div>
        <div style={CHORD_GROUP_STYLE}>
          <span style={SECTION_LABEL_STYLE}>Sevenths</span>
          <div style={TOGGLE_CONTAINER_STYLE}>
            <button onClick={() => setChordType("maj7")} style={getSeventhButtonStyle("maj7")}>
              Maj7
            </button>
            <button onClick={() => setChordType("min7")} style={getSeventhButtonStyle("min7")}>
              Min7
            </button>
            <button onClick={() => setChordType("dom7")} style={getSeventhButtonStyle("dom7")}>
              Dom7
            </button>
            <button
              onClick={() => setChordType("halfdim7")}
              style={getSeventhButtonStyle("halfdim7")}
            >
              HalfDim7
            </button>
          </div>
        </div>
        <div style={ROOT_SELECTOR_STYLE}>
          <label htmlFor="root-note-select" style={LABEL_STYLE}>
            Root Note:
          </label>
          <select
            id="root-note-select"
            value={rootIndex}
            onChange={(e) => setRootIndex(Number(e.target.value))}
            style={SELECT_STYLE}
          >
            {PITCH_CLASSES.map((pitch, i) => (
              <option key={pitch} value={i}>
                {pitch}
              </option>
            ))}
          </select>
        </div>
      </div>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-label="Chromatic Circle"
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke="#555"
          strokeWidth={1}
        />
        <polygon
          points={calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, chordIndices)
            .map((p) => `${p.x},${p.y}`)
            .join(" ")}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          strokeDasharray={strokeDasharray}
        />
        {PITCH_CLASSES.map((label, i) => {
          const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const x = CENTER + RING_RADIUS * Math.cos(angle);
          const y = CENTER + RING_RADIUS * Math.sin(angle);
          return (
            <g key={label}>
              <circle
                cx={x}
                cy={y}
                r={NODE_RADIUS}
                fill="#646cff"
                stroke="#fff"
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={label.length > 1 ? SHARP_FONT_SIZE : NATURAL_FONT_SIZE}
                fill="#fff"
                fontFamily="sans-serif"
                fontWeight="bold"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      {isLoading && <p style={{ marginTop: "1rem" }}>Loading scale notes…</p>}
      {error && <p style={{ marginTop: "1rem", color: "#888" }}>Scale notes unavailable.</p>}
      {!isLoading && !error && scaleNotes.length > 0 && (
        <p style={{ marginTop: "1rem" }}>
          Scale notes: {scaleNotes.map((n) => n.name).join(", ")}
        </p>
      )}
    </div>
  );
}
