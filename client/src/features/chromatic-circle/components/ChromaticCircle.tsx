import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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
  VERTEX_RADIUS,
  VERTEX_RADIUS_SELECTED,
  VERTEX_SELECTED_FILL,
  VERTEX_SELECTED_STROKE,
  VERTEX_BADGE_OFFSET,
  VERTEX_BADGE_RADIUS,
  VERTEX_BADGE_FONT_SIZE,
  CENTROID_RADIUS,
  CENTROID_CROSSHAIR_LENGTH,
  RING_STROKE_WIDTH,
  POLYGON_STROKE_WIDTH,
  CIRCLE_PADDING,
} from "../constants/visualConstants";
import {
  transposeChord,
  getChordTriad,
  CHORD_INTERVALS,
} from "@/features/chord/utils/transpose";
import { findNearestChord } from "@/features/chord/utils/findNearestChord";
import type { ChordType } from "@/features/chord/types";
import { SEVENTH_CHORD_TYPES } from "@/features/chord/types";
import { CHORD_NAME_TO_DATA, getChordName } from "@/features/chord/data/chordNames";
import { ChordSelector } from "@/features/chord/components/ChordSelector";
import type { ScaleType } from "@/features/scale/types";
import { calculateVoiceLeads } from "@/features/voice-leading";
import { useChordMorphing } from "@/features/chord-animation";
import {
  ToneInfoPanel,
  getToneRole,
  noteIndexToFrequency,
} from "@/features/chord-inspection";
import type { ToneInfo } from "@/features/chord-inspection";
import { calculateCentroid } from "@/features/chord-geometry";
import { IntervalLabel, getIntervalName, getRootIntervals } from "@/features/chord-intervals";
import {
  getNoteStyle,
  CHORD_TONE_FILLS,
  chordToneGradientId,
} from "../utils/noteStyles";
import {
  getChordComplexity,
  getChordColor,
} from "@/features/color-language/utils/chordColorUtils";
import type { ChordComplexity } from "@/features/color-language/utils/chordColorUtils";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import {
  createRadialGradientDef,
} from "@/features/color-language/utils/svgGradient";
import type { Chord } from "@/features/current-chord";
import type { CursorMode } from "@/shared/types/CursorMode";

const VOICE_LEAD_COLOR = "#D1D5DB";
const VOICE_LEAD_HOVER_COLOR = "#6B7280";
const DRAG_THRESHOLD_PX = 8;

/** Returns the SVG `<radialGradient>` `id` used for a chord polygon fill. */
function chordPolygonGradientId(quality: ChordType, complexity: ChordComplexity): string {
  return `chord-polygon-${quality}-${complexity}`;
}

interface ChromaticCircleProps {
  onCurrentChordChange?: (chord: Chord) => void;
  /** Called whenever the key root or scale mode changes. */
  onKeyScaleChange?: (root: number, scale: ScaleType) => void;
  selectedScale?: ScaleType;
  showVoiceLeads?: boolean;
  showExtension?: boolean;
  showCentroid?: boolean;
  showIntervals?: boolean;
  /** Current cursor interaction mode (info or select) */
  cursorMode?: CursorMode;
  /** Set of currently selected note names (for selection mode) */
  selectedNotes?: Set<string>;
  /** Called when selected notes change in selection mode */
  onSelectedNotesChange?: (notes: Set<string>) => void;
}

export function ChromaticCircle({
  onCurrentChordChange,
  onKeyScaleChange,
  selectedScale: propSelectedScale = "major",
  showVoiceLeads: propShowVoiceLeads = false,
  showExtension: propShowExtension = false,
  showCentroid: propShowCentroid = false,
  showIntervals: propShowIntervals = false,
  cursorMode = 'info',
  selectedNotes = new Set(),
  onSelectedNotesChange,
}: ChromaticCircleProps) {
  const [selectedChordName, setSelectedChordName] = useState("C");
  const [selectedToChordName, setSelectedToChordName] = useState<string | null>(null);
  const hasToChord = selectedToChordName !== null;
  
  // Drag state for note moving in select mode
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNoteIndex, setDraggedNoteIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [didDrag, setDidDrag] = useState(false);
  const [suppressNextClick, setSuppressNextClick] = useState(false);
  const [moveAnnouncement, setMoveAnnouncement] = useState("");
  const [customFromChord, setCustomFromChord] = useState<{ root: number; quality: ChordType; customNotes: number[] } | null>(null);
  // Use props for visualization toggles (received from App)
  const selectedScale = propSelectedScale;
  const showVoiceLeads = propShowVoiceLeads;
  const showExtension = propShowExtension;
  const showCentroid = propShowCentroid;
  const showIntervals = propShowIntervals;
  const [hoveredLeadIndex, setHoveredLeadIndex] = useState<number | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneInfo | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const deselectTone = useCallback(() => setSelectedTone(null), []);

  /**
   * Mode-aware click handler for note vertices and badges.
   * In info mode: displays the note's details.
   * In select mode: toggles the note in the selection set.
   */
  const handleNoteClick = useCallback(
    (noteName: string, toneInfo: ToneInfo) => {
      if (cursorMode === 'info') {
        setSelectedTone(toneInfo);
      } else if (cursorMode === 'select' && onSelectedNotesChange) {
        const newSelected = new Set(selectedNotes);
        if (newSelected.has(noteName)) {
          newSelected.delete(noteName);
        } else {
          newSelected.add(noteName);
        }
        onSelectedNotesChange(newSelected);
      }
    },
    [cursorMode, selectedNotes, onSelectedNotesChange],
  );

  /**
   * Start dragging a note in select mode.
   * Only allows dragging notes that are currently in the From chord.
   */
  const handleNoteDragStart = useCallback((noteIndex: number, e: ReactPointerEvent) => {
    if (cursorMode !== 'select') return;
    
    // Get current chord indices (from custom or named chord)
    const currentChordIndices = customFromChord?.customNotes ?? 
      transposeChord(CHORD_INTERVALS[CHORD_NAME_TO_DATA[selectedChordName].type], CHORD_NAME_TO_DATA[selectedChordName].root).map(n => n.index);
    
    // Only allow dragging notes that are IN the From chord
    if (!currentChordIndices.includes(noteIndex)) return;
    
    e.stopPropagation();
    setIsDragging(true);
    setDidDrag(false);
    setDraggedNoteIndex(noteIndex);
    setDragTargetIndex(noteIndex);
    setDragStartPoint({ x: e.clientX, y: e.clientY });
    
    // Capture pointer for smooth drag
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [cursorMode, customFromChord, selectedChordName]);

  /**
   * Update the drag target position as pointer moves.
   * Converts pointer coords to nearest circle position (0-11).
   */
  const handleNoteDragMove = useCallback((e: ReactPointerEvent) => {
    if (!isDragging || draggedNoteIndex === null || dragStartPoint === null) return;

    // Require a minimum move distance so normal clicks don't become drags.
    const dx = e.clientX - dragStartPoint.x;
    const dy = e.clientY - dragStartPoint.y;
    const distance = Math.hypot(dx, dy);
    if (distance < DRAG_THRESHOLD_PX) return;
    if (!didDrag) setDidDrag(true);
    
    // Convert pointer coords to nearest circle position (0-11)
    const svgElement = (e.currentTarget as SVGGElement).ownerSVGElement;
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    const x = e.clientX - rect.left - CENTER;
    const y = e.clientY - rect.top - CENTER;
    const angle = Math.atan2(x, -y);
    const normalizedAngle = ((angle + 2 * Math.PI) % (2 * Math.PI));
    const index = Math.round((normalizedAngle / (2 * Math.PI)) * 12) % 12;
    
    setDragTargetIndex(index);
  }, [isDragging, draggedNoteIndex, dragStartPoint, didDrag]);

  /**
   * Complete the drag operation and update the chord.
   * Creates a custom chord with the moved note.
   */
  const handleNoteDragEnd = useCallback(() => {
    const resetDragState = () => {
      setIsDragging(false);
      setDidDrag(false);
      setDraggedNoteIndex(null);
      setDragTargetIndex(null);
      setDragStartPoint(null);
    };

    if (!isDragging || draggedNoteIndex === null || dragTargetIndex === null) {
      resetDragState();
      return;
    }

    // Treat below-threshold motion as click, not drag.
    if (!didDrag) {
      resetDragState();
      return;
    }
    
    // If target is the same as source, cancel drag
    if (dragTargetIndex === draggedNoteIndex) {
      setSuppressNextClick(true);
      resetDragState();
      return;
    }
    
    // Get current chord indices
    const currentChordIndices = customFromChord?.customNotes ?? 
      transposeChord(CHORD_INTERVALS[CHORD_NAME_TO_DATA[selectedChordName].type], CHORD_NAME_TO_DATA[selectedChordName].root).map(n => n.index);
    
    // Build new custom note set by replacing the dragged note
    const newNotes = currentChordIndices.map(idx => 
      idx === draggedNoteIndex ? dragTargetIndex : idx
    );
    
    // Find nearest chord match for "best fit" root/quality
    const { root: bestRoot, quality: bestQuality, matchScore } = findNearestChord(newNotes);

    if (matchScore === 1) {
      // Perfect match: treat as a named chord, not a custom one
      setCustomFromChord(null);
      setSelectedChordName(getChordName(bestRoot, bestQuality));
      onCurrentChordChange?.({ root: bestRoot, quality: bestQuality });
    } else {
      // Create custom chord and update state
      const newChord: { root: number; quality: ChordType; customNotes: number[] } = {
        root: bestRoot,
        quality: bestQuality,
        customNotes: newNotes,
      };
      setCustomFromChord(newChord);
      onCurrentChordChange?.(newChord);
    }

    setMoveAnnouncement(`Moved ${PITCH_CLASSES[draggedNoteIndex]} to ${PITCH_CLASSES[dragTargetIndex]}`);
    setSuppressNextClick(true);
    
    // Reset drag state
    resetDragState();
  }, [isDragging, didDrag, draggedNoteIndex, dragTargetIndex, customFromChord, selectedChordName, onCurrentChordChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") deselectTone();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deselectTone]);

  useEffect(() => {
    if (!moveAnnouncement) return;
    const timeoutId = window.setTimeout(() => setMoveAnnouncement(""), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [moveAnnouncement]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const { root: toRootIndex, type: toChordType } = CHORD_NAME_TO_DATA[selectedToChordName ?? "C"];

  // Priority: Custom chord overrides selected chord name
  const effectiveRoot = customFromChord?.root ?? CHORD_NAME_TO_DATA[selectedChordName].root;
  const effectiveQuality = customFromChord?.quality ?? CHORD_NAME_TO_DATA[selectedChordName].type;
  const rootIndex = effectiveRoot;
  const chordType = effectiveQuality;

  useEffect(() => {
    // Only fire onCurrentChordChange if we're not in a custom chord state
    // (custom chords fire their own updates in handleNoteDragEnd)
    if (!customFromChord) {
      onCurrentChordChange?.({ root: rootIndex, quality: chordType });
    }
  }, [rootIndex, chordType, onCurrentChordChange, customFromChord]);

  useEffect(() => {
    onKeyScaleChange?.(rootIndex, selectedScale);
  }, [rootIndex, selectedScale, onKeyScaleChange]);

  const isSeventhChord = SEVENTH_CHORD_TYPES.has(chordType);
  const isToSeventhChord = SEVENTH_CHORD_TYPES.has(toChordType);
  const baseIntervals = CHORD_INTERVALS[chordType];
  const toBaseIntervals = CHORD_INTERVALS[toChordType];
  
  // Use custom notes if available, otherwise calculate from root + quality
  const chordNotes = customFromChord?.customNotes
    ? customFromChord.customNotes.map(idx => ({ index: idx, name: PITCH_CLASSES[idx], role: "root" as const }))
    : transposeChord(baseIntervals, rootIndex);
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

  const chordComplexity: ChordComplexity = getChordComplexity({ root: rootIndex, quality: chordType });
  const toChordComplexity: ChordComplexity = getChordComplexity({ root: toRootIndex, quality: toChordType });

  const strokeColor = getChordColor(chordType, chordComplexity);
  const strokeDasharray = isSeventhChord ? "5,5" : undefined;
  const fillColor = `url(#${chordPolygonGradientId(chordType, chordComplexity)})`;

  const toStrokeColor = getChordColor(toChordType, toChordComplexity);
  const toStrokeDasharray = isToSeventhChord ? "5,5" : undefined;
  const toFillColor = `url(#${chordPolygonGradientId(toChordType, toChordComplexity)})`;

  const fromPolygonOpacity = isAnimating ? 0.75 : 1;

  const voiceLeads = calculateVoiceLeads(
    chordNotes,
    toChordNotes,
    CENTER,
    CENTER,
    RING_RADIUS,
  );

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
    <div style={{ position: "relative", maxWidth: "100%", width: "100%" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 550,
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
            maxHeight: 550,
            cursor: "default",
          }}
        >
        {/* Radial gradient fills for chord-tone note nodes (one per quality × complexity)
             and chord polygon fills (one per quality × complexity). */}
        <defs>
          {(Object.keys(CHORD_TONE_FILLS) as ChordType[]).flatMap((quality) =>
            (["triad", "seventh", "extended"] as ChordComplexity[]).map((complexity) => (
              <radialGradient
                key={`${quality}-${complexity}`}
                id={chordToneGradientId(quality, complexity)}
                cx="35%"
                cy="35%"
                r="65%"
              >
                <stop offset="0%" stopColor="#fff" stopOpacity={0.55} />
                <stop offset="100%" stopColor={getChordColor(quality, complexity)} stopOpacity={1} />
              </radialGradient>
            ))
          )}
          {(Object.keys(ChordQualityColors) as ChordType[]).flatMap((quality) =>
            (["triad", "seventh", "extended"] as ChordComplexity[]).map((complexity) => (
              <Fragment key={`polygon-${quality}-${complexity}`}>
                {createRadialGradientDef(
                  chordPolygonGradientId(quality, complexity),
                  { ...ChordQualityColors[quality], base: getChordColor(quality, complexity) },
                )}
              </Fragment>
            ))
          )}
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
        {hasToChord && showVoiceLeads &&
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
          strokeLinejoin="round"
          strokeDasharray={strokeDasharray}
          opacity={fromPolygonOpacity}
        />

        {/* From chord triad polygon (foreground, only when extension is enabled) */}
        {showExtension && fromTriadPoints && (
          <polygon
            points={fromTriadPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={POLYGON_STROKE_WIDTH}
            strokeLinejoin="round"
            opacity={fromPolygonOpacity}
          />
        )}

        {/* To chord polygon */}
        {/* When showing extension for a seventh chord, this is the seventh polygon (background) */}
        {hasToChord && (
          <polygon
            points={toPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={toFillColor}
            stroke={toStrokeColor}
            strokeWidth={POLYGON_STROKE_WIDTH}
            strokeLinejoin="round"
            strokeDasharray={toStrokeDasharray}
          />
        )}

        {/* To chord triad polygon (foreground, only when extension is enabled) */}
        {hasToChord && showExtension && toTriadPoints && (
          <polygon
            points={toTriadPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={toFillColor}
            stroke={toStrokeColor}
            strokeWidth={POLYGON_STROKE_WIDTH}
            strokeLinejoin="round"
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
        {hasToChord && showCentroid && (
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
          getRootIntervals(chordIndices).map((semitones, i) => {
            if (semitones === null) return null;
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
        {hasToChord && showIntervals &&
          getRootIntervals(toChordIndices).map((semitones, i) => {
            if (semitones === null) return null;
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
          const isSelectedInSelectMode = selectedNotes.has(note.name);
          return point !== undefined ? (
            <g key={`from-vertex-${note.index}`}>
              <circle
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
                  handleNoteClick(note.name, {
                    note,
                    role: getToneRole(interval, chordType),
                    interval,
                    frequency: noteIndexToFrequency(note.index),
                    chordLabel: "From Chord",
                  });
                }}
              />
              {/* Selection indicator ring for select mode */}
              {isSelectedInSelectMode && cursorMode === 'select' && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={VERTEX_RADIUS + 6}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2}
                  opacity={0.6}
                />
              )}
            </g>
          ) : null;
        })}

        {/* To chord clickable vertices */}
        {hasToChord && toChordNotes.map((note, i) => {
          const point = toPoints[i];
          const interval = toBaseIntervals[i];
          const isSelected =
            selectedTone?.chordLabel === "To Chord" &&
            selectedTone?.note.index === note.index;
          const isSelectedInSelectMode = selectedNotes.has(note.name);
          return point !== undefined ? (
            <g key={`to-vertex-${note.index}`}>
              <circle
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
                  handleNoteClick(note.name, {
                    note,
                    role: getToneRole(interval, toChordType),
                    interval,
                    frequency: noteIndexToFrequency(note.index),
                    chordLabel: "To Chord",
                  });
                }}
              />
              {/* Selection indicator ring for select mode */}
              {isSelectedInSelectMode && cursorMode === 'select' && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={VERTEX_RADIUS + 6}
                  fill="none"
                  stroke={toStrokeColor}
                  strokeWidth={2}
                  opacity={0.6}
                />
              )}
            </g>
          ) : null;
        })}

        {/* Outer ring note labels — single source of truth for note names */}
        {PITCH_CLASSES.map((label, i) => {
          const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const x = CENTER + RING_RADIUS * Math.cos(angle);
          const y = CENTER + RING_RADIUS * Math.sin(angle);
          // From-chord tones take priority over to-chord tones; non-chord notes
          // fall back to diatonic / chromatic styling.
          const noteStyle = chordIndices.includes(i)
            ? getNoteStyle(i, chordIndices, chordType, diatonicIndices, chordComplexity)
            : (hasToChord && toChordIndices.includes(i))
            ? getNoteStyle(i, toChordIndices, toChordType, diatonicIndices, toChordComplexity)
            : getNoteStyle(i, [], chordType, diatonicIndices, chordComplexity);
          
          const isInFromChord = chordIndices.includes(i);
          const isInToChord = hasToChord && toChordIndices.includes(i);
          const isSelectedInSelectMode = selectedNotes.has(label);
          
          return (
            <g
              key={`pitch-${i}-${label}`}
              style={{ 
                cursor: cursorMode === 'select' 
                  ? (isInFromChord ? "grab" : "pointer") 
                  : "pointer" 
              }}
              onPointerDown={(e) => handleNoteDragStart(i, e)}
              onPointerMove={handleNoteDragMove}
              onPointerUp={handleNoteDragEnd}
              onPointerCancel={handleNoteDragEnd}
              onPointerLeave={handleNoteDragEnd}
              onClick={(e) => {
                if (suppressNextClick) {
                  setSuppressNextClick(false);
                  return;
                }
                if (isDragging) return; // Don't fire click during drag
                e.stopPropagation();
                const note = { index: i, name: label, role: "root" as const };
                // Calculate interval: semitones from C (index 0)
                const interval = i;
                // Determine chord label context
                let chordLabel: "From Chord" | "To Chord" | "Scale" = "Scale";
                if (isInFromChord) {
                  chordLabel = "From Chord";
                } else if (isInToChord) {
                  chordLabel = "To Chord";
                }
                handleNoteClick(label, {
                  note,
                  role: isInFromChord 
                    ? getToneRole(interval, chordType)
                    : isInToChord
                    ? getToneRole(interval, toChordType)
                    : "Note",
                  interval,
                  frequency: noteIndexToFrequency(i),
                  chordLabel,
                });
              }}
            >
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
              {/* Selection indicator ring for select mode */}
              {isSelectedInSelectMode && cursorMode === 'select' && (
                <circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS + 6}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  opacity={1}
                />
              )}
              {/* Drag preview ring - shows where note will be dropped */}
              {isDragging && dragTargetIndex === i && (
                <circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS + 8}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={3}
                  opacity={0.8}
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}

        {/* From chord vertex badges (F) — outer ring */}
        {chordNotes.map((note, i) => {
          const angle = (note.index / 12) * 2 * Math.PI;
          const badgeX = CENTER + (RING_RADIUS + VERTEX_BADGE_OFFSET) * Math.sin(angle);
          const badgeY = CENTER - (RING_RADIUS + VERTEX_BADGE_OFFSET) * Math.cos(angle);
          const interval = baseIntervals[i];
          return (
            <g key={`from-badge-${note.index}`}>
              <g
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNoteClick(note.name, {
                    note,
                    role: getToneRole(interval, chordType),
                    interval,
                    frequency: noteIndexToFrequency(note.index),
                    chordLabel: "From Chord",
                  });
                }}
              >
                <circle
                  cx={badgeX}
                  cy={badgeY}
                  r={VERTEX_BADGE_RADIUS}
                  fill="white"
                  opacity={0.9}
                />
                <text
                  x={badgeX}
                  y={badgeY}
                  fontSize={VERTEX_BADGE_FONT_SIZE}
                  fontWeight="bold"
                  fill={strokeColor}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily={NOTE_FONT_FAMILY}
                >
                  ●
                </text>
              </g>
            </g>
          );
        })}

        {/* To chord vertex badges (T) — inner ring */}
        {hasToChord && toChordNotes.map((note, i) => {
          const angle = (note.index / 12) * 2 * Math.PI;
          const badgeX = CENTER + (RING_RADIUS - VERTEX_BADGE_OFFSET) * Math.sin(angle);
          const badgeY = CENTER - (RING_RADIUS - VERTEX_BADGE_OFFSET) * Math.cos(angle);
          const interval = toBaseIntervals[i];
          return (
            <g key={`to-badge-${note.index}`}>
              <g
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNoteClick(note.name, {
                    note,
                    role: getToneRole(interval, toChordType),
                    interval,
                    frequency: noteIndexToFrequency(note.index),
                    chordLabel: "To Chord",
                  });
                }}
              >
                <circle
                  cx={badgeX}
                  cy={badgeY}
                  r={VERTEX_BADGE_RADIUS}
                  fill="white"
                  opacity={0.9}
                />
                <text
                  x={badgeX}
                  y={badgeY}
                  fontSize={VERTEX_BADGE_FONT_SIZE}
                  fontWeight="bold"
                  fill={toStrokeColor}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily={NOTE_FONT_FAMILY}
                >
                  ○
                </text>
              </g>
            </g>
          );
        })}
        </svg>
      </div>
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          border: 0,
        }}
      >
        {moveAnnouncement}
      </div>
      {/* Only show ToneInfoPanel in info mode */}
      {cursorMode === 'info' && <ToneInfoPanel selectedTone={selectedTone} onClose={deselectTone} />}
      <div style={{ display: "flex", gap: 12, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af" }}>
          From
          <ChordSelector 
            value={selectedChordName} 
            onChange={(name) => {
              setSelectedChordName(name);
              setCustomFromChord(null); // Clear custom chord when user selects a named chord
            }}
            customChord={customFromChord}
            aria-label="From chord" 
          />
        </label>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
          <button
            type="button"
            onClick={() => setSelectedToChordName(selectedChordName)}
            title="Copy from-chord to to-chord"
            aria-label="Copy from-chord to to-chord"
            style={{
              padding: "4px 10px",
              fontSize: 16,
              cursor: "pointer",
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              color: "#6b7280",
              lineHeight: 1,
            }}
          >
            →
          </button>
        </div>
        <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af" }}>
          To
          <ChordSelector value={selectedToChordName ?? ""} onChange={(v) => setSelectedToChordName(v || null)} aria-label="To chord" />
        </label>
      </div>
    </div>
  );
}
