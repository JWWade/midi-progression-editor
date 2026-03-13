import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { getDiatonicIndices } from "../utils";
import { getCircleColorForTheme } from "../utils/circleColors";
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
  rotateChordNotes,
  rotateNamedChordRoot,
  dedupePitchClasses,
  getPrimitiveNoteIndices,
} from "@/features/chord/utils/transpose";
import { findNearestChord } from "@/features/chord/utils/findNearestChord";
import type { ChordType } from "@/features/chord/types";
import { SEVENTH_CHORD_TYPES } from "@/features/chord/types";
import { CHORD_NAME_TO_DATA, getChordName } from "@/features/chord/data/chordNames";
import { ChordGrid } from "@/features/chord/components/ChordGrid";
import type { ScaleType } from "@/features/scale/types";
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
import type { Chord, PrimitiveShape } from "@/features/current-chord";
import { useTheme } from "@/app/providers/useTheme";
import { useEnharmonic } from "@/app/providers/useEnharmonic";

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
  showExtension?: boolean;
  showCentroid?: boolean;
  showIntervals?: boolean;
}

export function ChromaticCircle({
  onCurrentChordChange,
  onKeyScaleChange,
  selectedScale: propSelectedScale = "major",
  showExtension: propShowExtension = false,
  showCentroid: propShowCentroid = false,
  showIntervals: propShowIntervals = false,
}: ChromaticCircleProps) {
  const { theme } = useTheme();
  const { pitchClasses } = useEnharmonic();

  type CustomChordState = {
    root: number;
    quality: ChordType;
    customNotes: number[];
    primitiveShape?: PrimitiveShape;
  };

  const [selectedChordName, setSelectedChordName] = useState("C");
  
  // Drag state for direct note movement
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNoteIndex, setDraggedNoteIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [didDrag, setDidDrag] = useState(false);
  const [suppressNextClick, setSuppressNextClick] = useState(false);
  const [moveAnnouncement, setMoveAnnouncement] = useState("");
  const [customFromChord, setCustomFromChord] = useState<CustomChordState | null>(null);
  // Use props for visualization toggles (received from App)
  const selectedScale = propSelectedScale;
  const showExtension = propShowExtension;
  const showCentroid = propShowCentroid;
  const showIntervals = propShowIntervals;
  const [selectedTone, setSelectedTone] = useState<ToneInfo | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const deselectTone = useCallback(() => setSelectedTone(null), []);

  /** Displays tone details for clicked notes. */
  const handleNoteClick = useCallback(
    (_noteName: string, toneInfo: ToneInfo) => {
      setSelectedTone(toneInfo);
    },
    [],
  );

  /**
   * Start dragging a note.
   * Only allows dragging notes that are currently in the From chord.
   */
  const handleNoteDragStart = useCallback((noteIndex: number, e: ReactPointerEvent) => {
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
  }, [customFromChord, selectedChordName]);

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
      const newChord: CustomChordState = {
        root: bestRoot,
        quality: bestQuality,
        customNotes: newNotes,
      };
      setCustomFromChord(newChord);
      onCurrentChordChange?.(newChord);
    }

    setMoveAnnouncement(`Moved ${pitchClasses[draggedNoteIndex]} to ${pitchClasses[dragTargetIndex]}`);
    setSuppressNextClick(true);
    
    // Reset drag state
    resetDragState();
  }, [isDragging, didDrag, draggedNoteIndex, dragTargetIndex, customFromChord, selectedChordName, onCurrentChordChange, pitchClasses]);

  const handleRotateChord = useCallback(
    (direction: "clockwise" | "counterclockwise") => {
      const semitones = direction === "clockwise" ? 1 : -1;

      if (customFromChord) {
        const rotatedCustomNotes = dedupePitchClasses(
          rotateChordNotes(customFromChord.customNotes, semitones),
        );
        if (rotatedCustomNotes.length === 0) return;

        const rotatedRoot = rotateNamedChordRoot(customFromChord.root, semitones);

        // Preserve primitive preset intent while rotating.
        if (customFromChord.primitiveShape) {
          const newChord: CustomChordState = {
            root: rotatedRoot,
            quality: customFromChord.quality,
            customNotes: rotatedCustomNotes,
            primitiveShape: customFromChord.primitiveShape,
          };
          setCustomFromChord(newChord);
          onCurrentChordChange?.(newChord);
          setMoveAnnouncement(`Rotated ${direction} by one semitone`);
          return;
        }

        const { root: bestRoot, quality: bestQuality, matchScore } = findNearestChord(rotatedCustomNotes);

        if (matchScore === 1) {
          // Promote back to a named chord when the rotated set is an exact match.
          setCustomFromChord(null);
          setSelectedChordName(getChordName(bestRoot, bestQuality));
        } else {
          const newChord: CustomChordState = {
            root: bestRoot,
            quality: bestQuality,
            customNotes: rotatedCustomNotes,
          };
          setCustomFromChord(newChord);
          onCurrentChordChange?.(newChord);
        }
      } else {
        const { root, type } = CHORD_NAME_TO_DATA[selectedChordName];
        const rotatedRoot = rotateNamedChordRoot(root, semitones);
        setSelectedChordName(getChordName(rotatedRoot, type));
      }

      setMoveAnnouncement(`Rotated ${direction} by one semitone`);
    },
    [customFromChord, selectedChordName, onCurrentChordChange],
  );

  const handleSelectPrimitiveShape = useCallback(
    (shape: PrimitiveShape) => {
      const root = customFromChord?.root ?? CHORD_NAME_TO_DATA[selectedChordName].root;
      const quality: ChordType =
        shape === "equilateral-triangle"
          ? "aug"
          : shape === "suspended-triangle"
            ? "major"
            : shape === "rectangle"
              ? "dom7"
              : "dim";
      const customNotes = getPrimitiveNoteIndices(root, shape);
      const newChord: CustomChordState = {
        root,
        quality,
        customNotes,
        primitiveShape: shape,
      };

      setCustomFromChord(newChord);
      onCurrentChordChange?.(newChord);
      setMoveAnnouncement(
        `Selected ${
          shape === "equilateral-triangle"
            ? "equilateral triangle"
            : shape === "suspended-triangle"
              ? "sus4 triangle"
              : shape === "rectangle"
                ? "rectangle"
                : "square"
        }`,
      );
    },
    [customFromChord, selectedChordName, onCurrentChordChange],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        deselectTone();
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      const isInFormControl =
        !!activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "SELECT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable);

      if (isInFormControl || !e.ctrlKey) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleRotateChord("clockwise");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleRotateChord("counterclockwise");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deselectTone, handleRotateChord]);

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
  const baseIntervals = CHORD_INTERVALS[chordType];

  // Use custom notes if available, otherwise calculate from root + quality
  const chordNotes = customFromChord?.customNotes
    ? customFromChord.customNotes.map(idx => ({ index: idx, name: pitchClasses[idx], role: "root" as const }))
    : transposeChord(baseIntervals, rootIndex, pitchClasses);
  const chordIndices = chordNotes.map((n) => n.index);

  const fromPoints = calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, chordIndices);

  // Triad subset points for seventh chords (used when showExtension is enabled)
  const fromTriadIntervals = getChordTriad(chordType);
  const fromTriadNotes = fromTriadIntervals
    ? transposeChord(fromTriadIntervals, rootIndex, pitchClasses)
    : null;
  const fromTriadPoints = fromTriadNotes
    ? calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, fromTriadNotes.map((n) => n.index))
    : null;

  const { morphedPoints: fromMorphedPoints, morphProgress } = useChordMorphing(
    fromPoints,
    prefersReducedMotion ? 1 : undefined,
  );
  const isAnimating = morphProgress > 0 && morphProgress < 1;

  const fromCentroid = calculateCentroid(fromMorphedPoints);

  const chordComplexity: ChordComplexity = getChordComplexity({ root: rootIndex, quality: chordType });

  const strokeColor = getChordColor(chordType, chordComplexity);
  const strokeDasharray = isSeventhChord ? "5,5" : undefined;
  const fillColor = `url(#${chordPolygonGradientId(chordType, chordComplexity)})`;

  const fromPolygonOpacity = isAnimating ? 0.75 : 1;

  const circleColor = useMemo(
    () => getCircleColorForTheme(rootIndex, chordType, theme, "circle"),
    [rootIndex, chordType, theme],
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
            userSelect: "none",
            WebkitUserSelect: "none",
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


        {/* From chord clickable vertices */}
        {chordNotes.map((note, i) => {
          const point = fromPoints[i];
          const interval = baseIntervals[i];
          const isSelected =
            selectedTone?.chordLabel === "From Chord" &&
            selectedTone?.note.index === note.index;
          const handleActivate = (e: React.MouseEvent | React.KeyboardEvent) => {
            e.stopPropagation();
            handleNoteClick(note.name, {
              note,
              role: getToneRole(interval, chordType),
              interval,
              frequency: noteIndexToFrequency(note.index),
              chordLabel: "From Chord",
            });
          };
          return point !== undefined ? (
            <g
              key={`from-vertex-${note.index}`}
              role="button"
              tabIndex={0}
              aria-label={`${note.name} in chord`}
              aria-pressed={isSelected}
              onClick={handleActivate}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleActivate(e);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? VERTEX_RADIUS_SELECTED : VERTEX_RADIUS}
                fill={isSelected ? VERTEX_SELECTED_FILL : strokeColor}
                stroke={isSelected ? VERTEX_SELECTED_STROKE : "none"}
                strokeWidth={isSelected ? 2 : 0}
                aria-hidden="true"
              />
              {isSelected && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={VERTEX_RADIUS_SELECTED + 4}
                  fill="none"
                  stroke={VERTEX_SELECTED_STROKE}
                  strokeWidth={2}
                  opacity={0.6}
                  aria-hidden="true"
                />
              )}
            </g>
          ) : null;
        })}


        {/* Outer ring note labels — single source of truth for note names */}
        {pitchClasses.map((label, i) => {
          const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const x = CENTER + RING_RADIUS * Math.cos(angle);
          const y = CENTER + RING_RADIUS * Math.sin(angle);
          const isInFromChord = chordIndices.includes(i);
          const noteStyle = isInFromChord
            ? getNoteStyle(i, chordIndices, chordType, diatonicIndices, chordComplexity)
            : getNoteStyle(i, [], chordType, diatonicIndices, chordComplexity);
          
          return (
            <g
              key={`pitch-${i}-${label}`}
              role="button"
              tabIndex={0}
              aria-label={label}
              aria-pressed={isInFromChord && selectedTone?.note.index === i}
              style={{ 
                cursor: isInFromChord ? "grab" : "pointer",
              }}
              onPointerDown={(e) => handleNoteDragStart(i, e)}
              onPointerMove={handleNoteDragMove}
              onPointerUp={handleNoteDragEnd}
              onPointerCancel={handleNoteDragEnd}
              onClick={(e) => {
                if (suppressNextClick) {
                  setSuppressNextClick(false);
                  return;
                }
                if (isDragging) return; // Don't fire click during drag
                e.stopPropagation();
                const note = { index: i, name: label, role: "root" as const };
                // Interval relative to chord root (0–11 semitones)
                const interval = (i - rootIndex + 12) % 12;
                handleNoteClick(label, {
                  note,
                  role: isInFromChord ? getToneRole(interval, chordType) : "Note",
                  interval,
                  frequency: noteIndexToFrequency(i),
                  chordLabel: isInFromChord ? "From Chord" : "Scale",
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  const note = { index: i, name: label, role: "root" as const };
                  const interval = (i - rootIndex + 12) % 12;
                  handleNoteClick(label, {
                    note,
                    role: isInFromChord ? getToneRole(interval, chordType) : "Note",
                    interval,
                    frequency: noteIndexToFrequency(i),
                    chordLabel: isInFromChord ? "From Chord" : "Scale",
                  });
                }
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
                aria-hidden="true"
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
                pointerEvents="none"
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
                aria-hidden="true"
              >
                {label}
              </text>
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
                  aria-hidden="true"
                />
              )}
              {/* Selected-state ring for keyboard and screen-reader users */}
              {selectedTone?.note.index === i && selectedTone.chordLabel !== "From Chord" && (
                <circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS + 4}
                  fill="none"
                  stroke={noteStyle.fill}
                  strokeWidth={2}
                  opacity={0.7}
                  pointerEvents="none"
                  aria-hidden="true"
                />
              )}
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
      <ToneInfoPanel selectedTone={selectedTone} onClose={deselectTone} />
      <div style={{ display: "flex", flexDirection: "column", marginTop: 12, alignItems: "center", gap: 10 }}>
        <div style={{ display: "inline-flex", alignItems: "stretch", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: 0.6,
                fontWeight: 600,
              }}
            >
              Transform
            </span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => handleRotateChord("counterclockwise")}
                title="Rotate counterclockwise by one semitone (Ctrl+Left)"
                aria-label="Rotate chord counterclockwise"
                style={{
                  width: 36,
                  height: 32,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  lineHeight: 1,
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  background: "var(--color-bg-surface)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                ↺
              </button>
              <button
                type="button"
                onClick={() => handleRotateChord("clockwise")}
                title="Rotate clockwise by one semitone (Ctrl+Right)"
                aria-label="Rotate chord clockwise"
                style={{
                  width: 36,
                  height: 32,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  lineHeight: 1,
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  background: "var(--color-bg-surface)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                ↻
              </button>
            </div>
          </div>

          <div aria-hidden="true" style={{ width: 1, background: "var(--color-border)", borderRadius: 999 }} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: 0.6,
                fontWeight: 600,
              }}
            >
              Templates
            </span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => handleSelectPrimitiveShape("equilateral-triangle")}
                title="Select equilateral triangle primitive"
                aria-label="Select equilateral triangle primitive"
                style={{
                  width: 36,
                  height: 32,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  lineHeight: 1,
                  color: customFromChord?.primitiveShape === "equilateral-triangle"
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                  cursor: "pointer",
                  background: "var(--color-bg-surface)",
                  border: customFromChord?.primitiveShape === "equilateral-triangle"
                    ? "2px solid var(--color-text-primary)"
                    : "1.5px solid var(--color-border)",
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                △
              </button>
              <button
                type="button"
                onClick={() => handleSelectPrimitiveShape("suspended-triangle")}
                title="Select sus4 triangle primitive"
                aria-label="Select sus4 triangle primitive"
                style={{
                  width: 36,
                  height: 32,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  lineHeight: 1,
                  color: customFromChord?.primitiveShape === "suspended-triangle"
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                  cursor: "pointer",
                  background: "var(--color-bg-surface)",
                  border: customFromChord?.primitiveShape === "suspended-triangle"
                    ? "2px solid var(--color-text-primary)"
                    : "1.5px solid var(--color-border)",
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                ◬
              </button>
              <button
                type="button"
                onClick={() => handleSelectPrimitiveShape("square")}
                title="Select square primitive"
                aria-label="Select square primitive"
                style={{
                  width: 36,
                  height: 32,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  lineHeight: 1,
                  color: customFromChord?.primitiveShape === "square"
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                  cursor: "pointer",
                  background: "var(--color-bg-surface)",
                  border: customFromChord?.primitiveShape === "square"
                    ? "2px solid var(--color-text-primary)"
                    : "1.5px solid var(--color-border)",
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                □
              </button>
              <button
                type="button"
                onClick={() => handleSelectPrimitiveShape("rectangle")}
                title="Select rectangle primitive"
                aria-label="Select rectangle primitive"
                style={{
                  width: 36,
                  height: 32,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  lineHeight: 1,
                  color: customFromChord?.primitiveShape === "rectangle"
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                  cursor: "pointer",
                  background: "var(--color-bg-surface)",
                  border: customFromChord?.primitiveShape === "rectangle"
                    ? "2px solid var(--color-text-primary)"
                    : "1.5px solid var(--color-border)",
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                ▭
              </button>
            </div>
          </div>
        </div>
        <ChordGrid
          value={selectedChordName}
          onChange={(name) => {
            setSelectedChordName(name);
            setCustomFromChord(null); // Clear custom chord when user selects a named chord
          }}
          customChord={customFromChord}
          aria-label="Chord"
        />
      </div>
    </div>
  );
}
