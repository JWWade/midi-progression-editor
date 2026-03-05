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
import { CHORD_NAME_TO_DATA } from "@/features/chord/data/chordNames";
import { ChordSelector } from "@/features/chord/components/ChordSelector";
import { ChordLabel } from "@/features/chord/components/ChordLabel";
import type { ScaleType } from "@/features/scale/types";
import { SCALE_LABELS } from "@/features/scale/types";
import { getScaleNotes } from "@/features/scale/utils";
import { calculateVoiceLeads } from "@/features/voice-leading";
import { useChordMorph, interpolateColor } from "@/features/chord-morphing";

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
const LABEL_DISTANCE = RING_RADIUS + 28; // 28px clears the node circle (r=12) with readable spacing

function computeLabelPoint(
  cx: number,
  cy: number,
  noteIndex: number,
): { x: number; y: number } {
  const angle = (noteIndex / 12) * 2 * Math.PI;
  return {
    x: cx + LABEL_DISTANCE * Math.sin(angle),
    y: cy - LABEL_DISTANCE * Math.cos(angle),
  };
}

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
  const [selectedChordName, setSelectedChordName] = useState("C");
  const [selectedToChordName, setSelectedToChordName] = useState("F");
  const [selectedScale, setSelectedScale] = useState<ScaleType>("major");
  const [showVoiceLeads, setShowVoiceLeads] = useState(false);
  const [showMorph, setShowMorph] = useState(false);
  const [hoveredLeadIndex, setHoveredLeadIndex] = useState<number | null>(null);
  const { scaleNotes, isLoading, error } = useChromaticCircleData();

  const { root: rootIndex, type: chordType } = CHORD_NAME_TO_DATA[selectedChordName];
  const { root: toRootIndex, type: toChordType } = CHORD_NAME_TO_DATA[selectedToChordName];

  const isSeventhChord = SEVENTH_CHORD_TYPES.has(chordType);
  const isToSeventhChord = SEVENTH_CHORD_TYPES.has(toChordType);
  const baseIntervals = CHORD_INTERVALS[chordType];
  const toBaseIntervals = CHORD_INTERVALS[toChordType];
  const chordNotes = transposeChord(baseIntervals, rootIndex);
  const toChordNotes = transposeChord(toBaseIntervals, toRootIndex);
  const chordIndices = chordNotes.map((n) => n.index);
  const toChordIndices = toChordNotes.map((n) => n.index);
  const scaleIndices = getScaleNotes(rootIndex, selectedScale);

  const fromPoints = calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, chordIndices);
  const toPoints = calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, toChordIndices);
  const { morphedPoints, morphProgress } = useChordMorph(fromPoints, toPoints);
  const isAnimating = morphProgress > 0 && morphProgress < 1;

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

  const morphStrokeColor = interpolateColor(strokeColor, toStrokeColor, morphProgress);
  const staticPolygonOpacity = showMorph && isAnimating ? 0.35 : 1;

  const voiceLeads = calculateVoiceLeads(
    chordNotes,
    toChordNotes,
    CENTER,
    CENTER,
    RING_RADIUS,
  );

  const fromNoteNames = chordNotes.map((n) => n.name).join(", ");
  const toNoteNames = toChordNotes.map((n) => n.name).join(", ");

  return (
    <div>
      <div style={CONTROLS_STYLE}>
        {/* Voice lead chord selectors */}
        <div style={VOICE_LEAD_ROW_STYLE}>
          {/* From Chord */}
          <div style={CHORD_SELECTOR_STYLE}>
            <label htmlFor="from-chord-select" style={{ ...LABEL_STYLE, color: PRIMARY_COLOR }}>
              From Chord
            </label>
            <ChordSelector
              id="from-chord-select"
              value={selectedChordName}
              onChange={setSelectedChordName}
              style={{ ...SELECT_STYLE }}
            />
          </div>

          <span style={ARROW_STYLE}>→</span>

          {/* To Chord */}
          <div style={{ ...CHORD_SELECTOR_STYLE, borderColor: TO_CHORD_COLOR }}>
            <label htmlFor="to-chord-select" style={{ ...LABEL_STYLE, color: TO_CHORD_COLOR }}>
              To Chord
            </label>
            <ChordSelector
              id="to-chord-select"
              value={selectedToChordName}
              onChange={setSelectedToChordName}
              style={{ ...SELECT_STYLE, borderColor: TO_CHORD_COLOR, color: TO_CHORD_COLOR }}
            />
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

        {/* Show Morph toggle */}
        <div style={ROOT_SELECTOR_STYLE}>
          <label htmlFor="show-morph" style={LABEL_STYLE}>
            Animate Morph:
          </label>
          <input
            id="show-morph"
            type="checkbox"
            checked={showMorph}
            onChange={(e) => setShowMorph(e.target.checked)}
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
          From: {selectedChordName} ({fromNoteNames})
        </span>
        {" → "}
        <span style={{ color: TO_CHORD_COLOR, fontWeight: "bold" }}>
          To: {selectedToChordName} ({toNoteNames})
        </span>
      </p>

      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-label="Chromatic Circle"
        overflow="visible"
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
          points={fromPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          strokeDasharray={strokeDasharray}
          opacity={staticPolygonOpacity}
        />

        {/* To chord polygon */}
        <polygon
          points={toPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={toFillColor}
          stroke={toStrokeColor}
          strokeWidth={2}
          strokeDasharray={toStrokeDasharray}
          opacity={staticPolygonOpacity}
        />

        {/* From chord vertex labels */}
        {chordNotes.map((note) => (
          <ChordLabel
            key={`from-label-${note.index}`}
            point={computeLabelPoint(CENTER, CENTER, note.index)}
            noteName={note.name}
            fill={strokeColor}
          />
        ))}

        {/* To chord vertex labels */}
        {toChordNotes.map((note) => (
          <ChordLabel
            key={`to-label-${note.index}`}
            point={computeLabelPoint(CENTER, CENTER, note.index)}
            noteName={note.name}
            fill={toStrokeColor}
          />
        ))}

        {/* Morphed polygon (shown when "Animate Morph" is enabled) */}
        {showMorph && (
          <polygon
            points={morphedPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="transparent"
            stroke={morphStrokeColor}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        )}

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
