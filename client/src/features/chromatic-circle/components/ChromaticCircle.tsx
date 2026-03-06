import { useState, useEffect, useCallback, useMemo } from "react";
import { useChromaticCircleData } from "../hooks/useChromaticCircleData";
import { PITCH_CLASSES, getDiatonicIndices } from "../utils";
import { getCircleColor } from "../utils/circleColors";
import { calculatePolygonPoints } from "../utils/geometry";
import {
  VIEWBOX_SIZE,
  CENTER,
  RING_RADIUS,
  NODE_RADIUS,
  NODE_STROKE_WIDTH,
  NATURAL_LABEL_FONT_SIZE,
  ACCIDENTAL_LABEL_FONT_SIZE,
  NOTE_FONT_FAMILY,
  LABEL_DISTANCE,
  VERTEX_RADIUS,
  VERTEX_RADIUS_SELECTED,
  VERTEX_SELECTED_FILL,
  VERTEX_SELECTED_STROKE,
  CENTROID_RADIUS,
  CENTROID_CROSSHAIR_LENGTH,
  RING_STROKE_WIDTH,
  POLYGON_STROKE_WIDTH,
  CIRCLE_PADDING,
} from "../constants/visualConstants";
import {
  transposeChord,
  getChordTriad,
  MAJOR_INTERVALS,
  MINOR_INTERVALS,
  MAJ7_INTERVALS,
  MIN7_INTERVALS,
  DOM7_INTERVALS,
  HALFDIM7_INTERVALS,
} from "@/features/chord/utils/transpose";
import type { ChordType } from "@/features/chord/types";
import { SEVENTH_CHORD_TYPES } from "@/features/chord/types";
import { CHORD_NAME_TO_DATA, CHORD_TYPE_ORDER, getChordName } from "@/features/chord/data/chordNames";
import { ChordSelector } from "@/features/chord/components/ChordSelector";
import { ChordLabel } from "@/features/chord/components/ChordLabel";
import type { ScaleType } from "@/features/scale/types";
import { SCALE_LABELS } from "@/features/scale/types";
import { calculateVoiceLeads } from "@/features/voice-leading";
import { useChordMorphing } from "@/features/chord-animation";
import { useAudioPlayback } from "@/features/audio";
import {
  ToneInfoPanel,
  getToneRole,
  noteIndexToFrequency,
} from "@/features/chord-inspection";
import type { ToneInfo } from "@/features/chord-inspection";
import { calculateCentroid } from "@/features/chord-geometry";
import { IntervalLabel, getIntervals, getIntervalName } from "@/features/chord-intervals";
import {
  getNoteStyle,
  CHORD_TONE_FILLS,
  chordToneGradientId,
} from "../utils/noteStyles";
import type { Chord } from "@/features/current-chord";

const PRIMARY_COLOR = "#4F46E5";
const SEVENTH_COLOR = "#A855F7";
const TO_CHORD_COLOR = "#059669";
const TO_CHORD_SEVENTH_COLOR = "#D97706";
const VOICE_LEAD_COLOR = "#D1D5DB";
const VOICE_LEAD_HOVER_COLOR = "#6B7280";

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

const CHORD_TYPE_LABELS: Record<ChordType, string> = {
  major: "Major",
  minor: "Minor",
  dom7: "Dom 7",
  maj7: "Maj 7",
  min7: "Min 7",
  halfdim7: "Half-dim 7",
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
  flexWrap: "wrap",
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

function playButtonStyle(color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: "4px 12px",
    borderRadius: "4px",
    border: `2px solid ${color}`,
    color: disabled ? "#9CA3AF" : color,
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
    backgroundColor: "transparent",
    borderColor: disabled ? "#9CA3AF" : color,
    fontSize: "13px",
    marginTop: "4px",
  };
}

export function ChromaticCircle({ onCurrentChordChange }: { onCurrentChordChange?: (chord: Chord) => void }) {
  const [selectedChordName, setSelectedChordName] = useState("C");
  const [selectedToChordName, setSelectedToChordName] = useState("F");
  const [selectedScale, setSelectedScale] = useState<ScaleType>("major");
  const [showVoiceLeads, setShowVoiceLeads] = useState(false);
  const [showExtension, setShowExtension] = useState(false);
  const [showCentroid, setShowCentroid] = useState(false);
  const [showIntervals, setShowIntervals] = useState(false);
  const [hoveredLeadIndex, setHoveredLeadIndex] = useState<number | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneInfo | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const { scaleNotes, isLoading, error } = useChromaticCircleData();
  const fromAudio = useAudioPlayback();
  const toAudio = useAudioPlayback();

  const deselectTone = useCallback(() => setSelectedTone(null), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") deselectTone();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deselectTone]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const { root: rootIndex, type: chordType } = CHORD_NAME_TO_DATA[selectedChordName];
  const { root: toRootIndex, type: toChordType } = CHORD_NAME_TO_DATA[selectedToChordName];

  useEffect(() => {
    onCurrentChordChange?.({ root: rootIndex, quality: chordType });
  }, [rootIndex, chordType, onCurrentChordChange]);

  const isSeventhChord = SEVENTH_CHORD_TYPES.has(chordType);
  const isToSeventhChord = SEVENTH_CHORD_TYPES.has(toChordType);
  const baseIntervals = CHORD_INTERVALS[chordType];
  const toBaseIntervals = CHORD_INTERVALS[toChordType];
  const chordNotes = transposeChord(baseIntervals, rootIndex);
  const toChordNotes = transposeChord(toBaseIntervals, toRootIndex);
  const chordIndices = chordNotes.map((n) => n.index);
  const toChordIndices = toChordNotes.map((n) => n.index);

  const fromPoints = calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, chordIndices);
  const toPoints = calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, toChordIndices);

  // Triad subset points for seventh chords (used when showExtension is enabled)
  const fromTriadIntervals = getChordTriad(chordType);
  const fromTriadNotes = fromTriadIntervals
    ? transposeChord(fromTriadIntervals, rootIndex)
    : null;
  const fromTriadPoints = fromTriadNotes
    ? calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, fromTriadNotes.map((n) => n.index))
    : null;

  const toTriadIntervals = getChordTriad(toChordType);
  const toTriadNotes = toTriadIntervals
    ? transposeChord(toTriadIntervals, toRootIndex)
    : null;
  const toTriadPoints = toTriadNotes
    ? calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, toTriadNotes.map((n) => n.index))
    : null;

  const { morphedPoints: fromMorphedPoints, morphProgress } = useChordMorphing(fromPoints);
  const isAnimating = morphProgress > 0 && morphProgress < 1;

  const fromCentroid = calculateCentroid(fromMorphedPoints);
  const toCentroid = calculateCentroid(toPoints);

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

  const fromPolygonOpacity = isAnimating ? 0.75 : 1;

  const voiceLeads = calculateVoiceLeads(
    chordNotes,
    toChordNotes,
    CENTER,
    CENTER,
    RING_RADIUS,
  );

  const fromNoteNames = chordNotes.map((n) => n.name).join(", ");
  const toNoteNames = toChordNotes.map((n) => n.name).join(", ");
  const anyPlaying = fromAudio.isPlaying || toAudio.isPlaying;

  const circleColor = useMemo(
    () => getCircleColor(rootIndex, chordType),
    [rootIndex, chordType],
  );

  const diatonicIndices = useMemo(
    () => getDiatonicIndices(rootIndex, selectedScale),
    [rootIndex, selectedScale],
  );

  const circleTransition = prefersReducedMotion ? undefined : "fill 0.4s ease";

  return (
    <div style={{ position: "relative", maxWidth: "100%" }}>
      <div style={CONTROLS_STYLE}>
        {/* Voice lead chord selectors */}
        <div style={VOICE_LEAD_ROW_STYLE}>
          {/* From Chord */}
          <div style={CHORD_SELECTOR_STYLE}>
            <label style={{ ...LABEL_STYLE, color: PRIMARY_COLOR }}>
              From Chord
            </label>
            {/* Combined chord name dropdown */}
            <ChordSelector
              id="from-chord-select"
              value={selectedChordName}
              onChange={setSelectedChordName}
              style={{ ...SELECT_STYLE }}
              aria-label="From chord"
            />
            {/* Separate root-note selector */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <label htmlFor="from-root-select" style={{ ...LABEL_STYLE, fontSize: "12px" }}>
                Root:
              </label>
              <select
                id="from-root-select"
                value={rootIndex}
                onChange={(e) =>
                  setSelectedChordName(getChordName(Number(e.target.value), chordType))
                }
                style={SELECT_STYLE}
                aria-label="From chord root note"
              >
                {PITCH_CLASSES.map((label, i) => (
                  <option key={i} value={i}>
                    {label}
                  </option>
                ))}
              </select>
              {/* Separate chord-type selector */}
              <label htmlFor="from-type-select" style={{ ...LABEL_STYLE, fontSize: "12px" }}>
                Type:
              </label>
              <select
                id="from-type-select"
                value={chordType}
                onChange={(e) =>
                  setSelectedChordName(getChordName(rootIndex, e.target.value as ChordType))
                }
                style={SELECT_STYLE}
                aria-label="From chord type"
              >
                {CHORD_TYPE_ORDER.map((type) => (
                  <option key={type} value={type}>
                    {CHORD_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <button
              style={playButtonStyle(PRIMARY_COLOR, anyPlaying)}
              disabled={anyPlaying}
              onClick={() => void fromAudio.play(chordNotes)}
              aria-label={`Play ${selectedChordName} chord`}
            >
              ▶ Play
            </button>
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
            <button
              style={playButtonStyle(TO_CHORD_COLOR, anyPlaying)}
              disabled={anyPlaying}
              onClick={() => void toAudio.play(toChordNotes)}
              aria-label={`Play ${selectedToChordName} chord`}
            >
              ▶ Play
            </button>
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

        {/* Show Extension toggle */}
        <div style={ROOT_SELECTOR_STYLE}>
          <label htmlFor="show-extension" style={LABEL_STYLE}>
            Show Extension:
          </label>
          <input
            id="show-extension"
            type="checkbox"
            checked={showExtension}
            onChange={(e) => setShowExtension(e.target.checked)}
            style={{ cursor: "pointer", width: "16px", height: "16px" }}
          />
        </div>

        {/* Show Centroid toggle */}
        <div style={ROOT_SELECTOR_STYLE}>
          <label htmlFor="show-centroid" style={LABEL_STYLE}>
            Show Centroid:
          </label>
          <input
            id="show-centroid"
            type="checkbox"
            checked={showCentroid}
            onChange={(e) => setShowCentroid(e.target.checked)}
            style={{ cursor: "pointer", width: "16px", height: "16px" }}
          />
        </div>

        {/* Show Intervals toggle */}
        <div style={ROOT_SELECTOR_STYLE}>
          <label htmlFor="show-intervals" style={LABEL_STYLE}>
            Show Intervals:
          </label>
          <input
            id="show-intervals"
            type="checkbox"
            checked={showIntervals}
            onChange={(e) => setShowIntervals(e.target.checked)}
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

      <div
        style={{
          width: "100%",
          maxWidth: VIEWBOX_SIZE + CIRCLE_PADDING * 2,
          margin: "0 auto",
          padding: `0 ${CIRCLE_PADDING}px`,
          boxSizing: "border-box",
        }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          aria-label="Chromatic Circle"
          onClick={deselectTone}
          style={{
            display: "block",
            width: "100%",
            cursor: "default",
          }}
        >
        {/* Radial gradient fills for chord-tone note nodes (one per quality) */}
        <defs>
          {(Object.keys(CHORD_TONE_FILLS) as ChordType[]).map((quality) => (
            <radialGradient
              key={quality}
              id={chordToneGradientId(quality)}
              cx="35%"
              cy="35%"
              r="65%"
            >
              <stop offset="0%" stopColor="#fff" stopOpacity={0.55} />
              <stop offset="100%" stopColor={CHORD_TONE_FILLS[quality]} stopOpacity={1} />
            </radialGradient>
          ))}
        </defs>

        {/* Ambient background tint — shifts with key and chord quality */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill={circleColor}
          stroke="none"
          style={{ transition: circleTransition }}
          aria-hidden="true"
        />

        {/* Ring outline */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke="#555"
          strokeWidth={RING_STROKE_WIDTH}
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

        {/* From chord polygon — uses morphed points for smooth auto-animation */}
        {/* When showing extension for a seventh chord, this is the seventh polygon (background) */}
        <polygon
          points={fromMorphedPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={POLYGON_STROKE_WIDTH}
          strokeDasharray={strokeDasharray}
          opacity={fromPolygonOpacity}
        />

        {/* From chord triad polygon (foreground, only when extension is enabled) */}
        {showExtension && fromTriadPoints && (
          <polygon
            points={fromTriadPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="rgba(79, 70, 229, 0.1)"
            stroke={PRIMARY_COLOR}
            strokeWidth={POLYGON_STROKE_WIDTH}
            opacity={fromPolygonOpacity}
          />
        )}

        {/* To chord polygon */}
        {/* When showing extension for a seventh chord, this is the seventh polygon (background) */}
        <polygon
          points={toPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={toFillColor}
          stroke={toStrokeColor}
          strokeWidth={POLYGON_STROKE_WIDTH}
          strokeDasharray={toStrokeDasharray}
        />

        {/* To chord triad polygon (foreground, only when extension is enabled) */}
        {showExtension && toTriadPoints && (
          <polygon
            points={toTriadPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="rgba(5, 150, 105, 0.1)"
            stroke={TO_CHORD_COLOR}
            strokeWidth={POLYGON_STROKE_WIDTH}
          />
        )}

        {/* From chord centroid marker */}
        {showCentroid && (
          <g aria-label="From chord centroid">
            <line
              x1={fromCentroid.x - CENTROID_CROSSHAIR_LENGTH}
              y1={fromCentroid.y}
              x2={fromCentroid.x + CENTROID_CROSSHAIR_LENGTH}
              y2={fromCentroid.y}
              stroke={strokeColor}
              strokeWidth={RING_STROKE_WIDTH}
              opacity={0.5}
            />
            <line
              x1={fromCentroid.x}
              y1={fromCentroid.y - CENTROID_CROSSHAIR_LENGTH}
              x2={fromCentroid.x}
              y2={fromCentroid.y + CENTROID_CROSSHAIR_LENGTH}
              stroke={strokeColor}
              strokeWidth={RING_STROKE_WIDTH}
              opacity={0.5}
            />
            <circle
              cx={fromCentroid.x}
              cy={fromCentroid.y}
              r={CENTROID_RADIUS}
              fill={strokeColor}
              opacity={0.7}
            />
          </g>
        )}

        {/* To chord centroid marker */}
        {showCentroid && (
          <g aria-label="To chord centroid">
            <line
              x1={toCentroid.x - CENTROID_CROSSHAIR_LENGTH}
              y1={toCentroid.y}
              x2={toCentroid.x + CENTROID_CROSSHAIR_LENGTH}
              y2={toCentroid.y}
              stroke={toStrokeColor}
              strokeWidth={RING_STROKE_WIDTH}
              opacity={0.5}
            />
            <line
              x1={toCentroid.x}
              y1={toCentroid.y - CENTROID_CROSSHAIR_LENGTH}
              x2={toCentroid.x}
              y2={toCentroid.y + CENTROID_CROSSHAIR_LENGTH}
              stroke={toStrokeColor}
              strokeWidth={RING_STROKE_WIDTH}
              opacity={0.5}
            />
            <circle
              cx={toCentroid.x}
              cy={toCentroid.y}
              r={CENTROID_RADIUS}
              fill={toStrokeColor}
              opacity={0.7}
            />
          </g>
        )}

        {/* From chord interval labels */}
        {showIntervals &&
          getIntervals(chordIndices).map((semitones, i) => {
            const from = fromMorphedPoints[i];
            const to = fromMorphedPoints[(i + 1) % fromMorphedPoints.length];
            if (!from || !to) return null;
            return (
              <IntervalLabel
                key={`from-interval-${i}`}
                from={from}
                to={to}
                intervalName={getIntervalName(semitones)}
                centerX={CENTER}
                centerY={CENTER}
              />
            );
          })}

        {/* To chord interval labels */}
        {showIntervals &&
          getIntervals(toChordIndices).map((semitones, i) => {
            const from = toPoints[i];
            const to = toPoints[(i + 1) % toPoints.length];
            if (!from || !to) return null;
            return (
              <IntervalLabel
                key={`to-interval-${i}`}
                from={from}
                to={to}
                intervalName={getIntervalName(semitones)}
                centerX={CENTER}
                centerY={CENTER}
              />
            );
          })}

        {/* From chord clickable vertices */}
        {chordNotes.map((note, i) => {
          const point = fromPoints[i];
          const interval = baseIntervals[i];
          const isSelected =
            selectedTone?.chordLabel === "From Chord" &&
            selectedTone?.note.index === note.index;
          return point !== undefined ? (
            <circle
              key={`from-vertex-${note.index}`}
              cx={point.x}
              cy={point.y}
              r={isSelected ? VERTEX_RADIUS_SELECTED : VERTEX_RADIUS}
              fill={isSelected ? VERTEX_SELECTED_FILL : strokeColor}
              stroke={isSelected ? VERTEX_SELECTED_STROKE : "none"}
              strokeWidth={isSelected ? 2 : 0}
              style={{ cursor: "pointer" }}
              aria-label={`${note.name} in From Chord`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTone({
                  note,
                  role: getToneRole(interval, chordType),
                  interval,
                  frequency: noteIndexToFrequency(note.index),
                  chordLabel: "From Chord",
                });
              }}
            />
          ) : null;
        })}

        {/* To chord clickable vertices */}
        {toChordNotes.map((note, i) => {
          const point = toPoints[i];
          const interval = toBaseIntervals[i];
          const isSelected =
            selectedTone?.chordLabel === "To Chord" &&
            selectedTone?.note.index === note.index;
          return point !== undefined ? (
            <circle
              key={`to-vertex-${note.index}`}
              cx={point.x}
              cy={point.y}
              r={isSelected ? VERTEX_RADIUS_SELECTED : VERTEX_RADIUS}
              fill={isSelected ? VERTEX_SELECTED_FILL : toStrokeColor}
              stroke={isSelected ? VERTEX_SELECTED_STROKE : "none"}
              strokeWidth={isSelected ? 2 : 0}
              style={{ cursor: "pointer" }}
              aria-label={`${note.name} in To Chord`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTone({
                  note,
                  role: getToneRole(interval, toChordType),
                  interval,
                  frequency: noteIndexToFrequency(note.index),
                  chordLabel: "To Chord",
                });
              }}
            />
          ) : null;
        })}

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

        {PITCH_CLASSES.map((label, i) => {
          const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const x = CENTER + RING_RADIUS * Math.cos(angle);
          const y = CENTER + RING_RADIUS * Math.sin(angle);
          // From-chord tones take priority over to-chord tones; non-chord notes
          // fall back to diatonic / chromatic styling.
          const noteStyle = chordIndices.includes(i)
            ? getNoteStyle(i, chordIndices, chordType, diatonicIndices)
            : toChordIndices.includes(i)
            ? getNoteStyle(i, toChordIndices, toChordType, diatonicIndices)
            : getNoteStyle(i, [], chordType, diatonicIndices);
          return (
            <g key={label}>
              <circle
                cx={x}
                cy={y}
                r={NODE_RADIUS}
                fill={noteStyle.fill}
                stroke="#fff"
                strokeWidth={NODE_STROKE_WIDTH}
                opacity={noteStyle.opacity}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={label.length > 1 ? ACCIDENTAL_LABEL_FONT_SIZE : NATURAL_LABEL_FONT_SIZE}
                fill={noteStyle.textFill}
                fontFamily={NOTE_FONT_FAMILY}
                fontWeight="bold"
              >
                {label}
              </text>
            </g>
          );
        })}
        </svg>
      </div>
      <ToneInfoPanel selectedTone={selectedTone} />
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
