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
import type { ScaleType } from "@/features/scale/types";
import { SCALE_LABELS } from "@/features/scale/types";
import { getScaleNotes } from "@/features/scale/utils";
import { calculateVoiceLeads } from "@/features/voice-leading";

const SIZE = 300;
const CENTER = SIZE / 2;
const RING_RADIUS = 110;
const NODE_RADIUS = 12;
const NATURAL_FONT_SIZE = 11;
const SHARP_FONT_SIZE = 9;
const PRIMARY_COLOR = "#4F46E5";
const SEVENTH_COLOR = "#A855F7";
const TO_CHORD_COLOR = "#059669";
const TO_CHORD_SEVENTH_COLOR = "#D97706";
const NON_SCALE_COLOR = "#D1D5DB";
const NON_SCALE_OPACITY = 0.6;
const NON_SCALE_TEXT_COLOR = "#4B5563";
const VOICE_LEAD_COLOR = "#D1D5DB";
const VOICE_LEAD_HOVER_COLOR = "#6B7280";

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

const CHORD_SELECTOR_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  alignItems: "center",
  padding: "8px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
};

const VOICE_LEAD_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  justifyContent: "center",
};

const ARROW_STYLE: React.CSSProperties = {
  fontSize: "20px",
  color: "#6B7280",
  fontWeight: "bold",
};

const CHORD_SUMMARY_STYLE: React.CSSProperties = {
  fontSize: "13px",
  color: "#374151",
  marginTop: "4px",
  textAlign: "center",
};

export function ChromaticCircle() {
  const [chordType, setChordType] = useState<ChordType>("major");
  const [rootIndex, setRootIndex] = useState(0);
  const [toChordType, setToChordType] = useState<ChordType>("major");
  const [toRootIndex, setToRootIndex] = useState(5); // F
  const [selectedScale, setSelectedScale] = useState<ScaleType>("major");
  const [showVoiceLeads, setShowVoiceLeads] = useState(false);
  const [hoveredLeadIndex, setHoveredLeadIndex] = useState<number | null>(null);
  const { scaleNotes, isLoading, error } = useChromaticCircleData();

  const isSeventhChord = SEVENTH_CHORD_TYPES.has(chordType);
  const isToSeventhChord = SEVENTH_CHORD_TYPES.has(toChordType);
  const baseIntervals = CHORD_INTERVALS[chordType];
  const toBaseIntervals = CHORD_INTERVALS[toChordType];
  const chordNotes = transposeChord(baseIntervals, rootIndex);
  const toChordNotes = transposeChord(toBaseIntervals, toRootIndex);
  const chordIndices = chordNotes.map((n) => n.index);
  const toChordIndices = toChordNotes.map((n) => n.index);
  const scaleIndices = getScaleNotes(rootIndex, selectedScale);

  const strokeColor = isSeventhChord ? SEVENTH_COLOR : PRIMARY_COLOR;
  const strokeDasharray = isSeventhChord ? "5,5" : undefined;
  const fillColor = isSeventhChord
    ? "rgba(168, 85, 247, 0.1)"
    : "rgba(79, 70, 229, 0.1)";

  const toStrokeColor = isToSeventhChord ? TO_CHORD_SEVENTH_COLOR : TO_CHORD_COLOR;
  const toStrokeDasharray = isToSeventhChord ? "5,5" : undefined;
  const toFillColor = isToSeventhChord
    ? "rgba(217, 119, 6, 0.1)"
    : "rgba(5, 150, 105, 0.1)";

  const voiceLeads = calculateVoiceLeads(
    chordNotes,
    toChordNotes,
    CENTER,
    CENTER,
    RING_RADIUS,
  );

  const getTriadButtonStyle = (type: ChordType): React.CSSProperties =>
    chordType === type ? ACTIVE_BUTTON_STYLE : INACTIVE_BUTTON_STYLE;

  const getSeventhButtonStyle = (type: ChordType): React.CSSProperties =>
    chordType === type ? ACTIVE_SEVENTH_BUTTON_STYLE : INACTIVE_SEVENTH_BUTTON_STYLE;

  const getToTriadButtonStyle = (type: ChordType): React.CSSProperties =>
    toChordType === type
      ? { ...ACTIVE_BUTTON_STYLE, backgroundColor: TO_CHORD_COLOR, border: `2px solid ${TO_CHORD_COLOR}` }
      : { ...INACTIVE_BUTTON_STYLE, color: TO_CHORD_COLOR, border: `2px solid ${TO_CHORD_COLOR}` };

  const getToSeventhButtonStyle = (type: ChordType): React.CSSProperties =>
    toChordType === type
      ? { ...ACTIVE_SEVENTH_BUTTON_STYLE, backgroundColor: TO_CHORD_SEVENTH_COLOR, border: `2px solid ${TO_CHORD_SEVENTH_COLOR}` }
      : { ...INACTIVE_SEVENTH_BUTTON_STYLE, color: TO_CHORD_SEVENTH_COLOR, border: `2px solid ${TO_CHORD_SEVENTH_COLOR}` };

  const fromChordLabel = `${PITCH_CLASSES[rootIndex]} ${chordType}`;
  const toChordLabel = `${PITCH_CLASSES[toRootIndex]} ${toChordType}`;
  const fromNoteNames = chordNotes.map((n) => n.name).join(", ");
  const toNoteNames = toChordNotes.map((n) => n.name).join(", ");

  return (
    <div>
      <div style={CONTROLS_STYLE}>
        {/* Voice lead chord selectors */}
        <div style={VOICE_LEAD_ROW_STYLE}>
          {/* From Chord */}
          <div style={CHORD_SELECTOR_STYLE}>
            <span style={{ ...SECTION_LABEL_STYLE, color: PRIMARY_COLOR }}>From Chord</span>
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
                From Root:
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

          <span style={ARROW_STYLE}>→</span>

          {/* To Chord */}
          <div style={{ ...CHORD_SELECTOR_STYLE, borderColor: TO_CHORD_COLOR }}>
            <span style={{ ...SECTION_LABEL_STYLE, color: TO_CHORD_COLOR }}>To Chord</span>
            <div style={CHORD_GROUP_STYLE}>
              <span style={SECTION_LABEL_STYLE}>Triads</span>
              <div style={TOGGLE_CONTAINER_STYLE}>
                <button onClick={() => setToChordType("major")} style={getToTriadButtonStyle("major")}>
                  Major
                </button>
                <button onClick={() => setToChordType("minor")} style={getToTriadButtonStyle("minor")}>
                  Minor
                </button>
              </div>
            </div>
            <div style={CHORD_GROUP_STYLE}>
              <span style={SECTION_LABEL_STYLE}>Sevenths</span>
              <div style={TOGGLE_CONTAINER_STYLE}>
                <button onClick={() => setToChordType("maj7")} style={getToSeventhButtonStyle("maj7")}>
                  Maj7
                </button>
                <button onClick={() => setToChordType("min7")} style={getToSeventhButtonStyle("min7")}>
                  Min7
                </button>
                <button onClick={() => setToChordType("dom7")} style={getToSeventhButtonStyle("dom7")}>
                  Dom7
                </button>
                <button
                  onClick={() => setToChordType("halfdim7")}
                  style={getToSeventhButtonStyle("halfdim7")}
                >
                  HalfDim7
                </button>
              </div>
            </div>
            <div style={ROOT_SELECTOR_STYLE}>
              <label htmlFor="to-root-note-select" style={LABEL_STYLE}>
                To Root:
              </label>
              <select
                id="to-root-note-select"
                value={toRootIndex}
                onChange={(e) => setToRootIndex(Number(e.target.value))}
                style={{ ...SELECT_STYLE, borderColor: TO_CHORD_COLOR, color: TO_CHORD_COLOR }}
              >
                {PITCH_CLASSES.map((pitch, i) => (
                  <option key={pitch} value={i}>
                    {pitch}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Show Voice Leads toggle */}
        <div style={ROOT_SELECTOR_STYLE}>
          <label htmlFor="show-voice-leads" style={LABEL_STYLE}>
            Show Voice Leads:
          </label>
          <input
            id="show-voice-leads"
            type="checkbox"
            checked={showVoiceLeads}
            onChange={(e) => setShowVoiceLeads(e.target.checked)}
            style={{ cursor: "pointer", width: "16px", height: "16px" }}
          />
        </div>

        {/* Scale selector */}
        <div style={ROOT_SELECTOR_STYLE}>
          <label htmlFor="scale-select" style={LABEL_STYLE}>
            Scale:
          </label>
          <select
            id="scale-select"
            value={selectedScale}
            onChange={(e) => setSelectedScale(e.target.value as ScaleType)}
            style={SELECT_STYLE}
          >
            {(Object.keys(SCALE_LABELS) as ScaleType[]).map((scale) => (
              <option key={scale} value={scale}>
                {SCALE_LABELS[scale]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chord summary */}
      <p style={CHORD_SUMMARY_STYLE}>
        <span style={{ color: PRIMARY_COLOR, fontWeight: "bold" }}>
          From: {fromChordLabel} ({fromNoteNames})
        </span>
        {" → "}
        <span style={{ color: TO_CHORD_COLOR, fontWeight: "bold" }}>
          To: {toChordLabel} ({toNoteNames})
        </span>
      </p>

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

        {/* Voice lead lines (rendered below chord polygons) */}
        {showVoiceLeads &&
          voiceLeads.map((lead, i) => (
            <line
              key={i}
              x1={lead.from.x}
              y1={lead.from.y}
              x2={lead.to.x}
              y2={lead.to.y}
              stroke={hoveredLeadIndex === i ? VOICE_LEAD_HOVER_COLOR : VOICE_LEAD_COLOR}
              strokeWidth={hoveredLeadIndex === i ? 3 : 2}
              strokeLinecap="round"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredLeadIndex(i)}
              onMouseLeave={() => setHoveredLeadIndex(null)}
            />
          ))}

        {/* From chord polygon */}
        <polygon
          points={calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, chordIndices)
            .map((p) => `${p.x},${p.y}`)
            .join(" ")}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          strokeDasharray={strokeDasharray}
        />

        {/* To chord polygon */}
        <polygon
          points={calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, toChordIndices)
            .map((p) => `${p.x},${p.y}`)
            .join(" ")}
          fill={toFillColor}
          stroke={toStrokeColor}
          strokeWidth={2}
          strokeDasharray={toStrokeDasharray}
        />

        {PITCH_CLASSES.map((label, i) => {
          const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const x = CENTER + RING_RADIUS * Math.cos(angle);
          const y = CENTER + RING_RADIUS * Math.sin(angle);
          const isInScale = scaleIndices.includes(i);
          const nodeFill = isInScale ? PRIMARY_COLOR : NON_SCALE_COLOR;
          const textFill = isInScale ? "#fff" : NON_SCALE_TEXT_COLOR;
          return (
            <g key={label}>
              <circle
                cx={x}
                cy={y}
                r={NODE_RADIUS}
                fill={nodeFill}
                stroke="#fff"
                strokeWidth={1.5}
                opacity={isInScale ? 1 : NON_SCALE_OPACITY}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={label.length > 1 ? SHARP_FONT_SIZE : NATURAL_FONT_SIZE}
                fill={textFill}
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
