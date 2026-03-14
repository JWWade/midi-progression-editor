import { useState, useEffect, useCallback, useMemo } from "react";
import { getDiatonicIndices } from "../utils";
import { getCircleColorForTheme } from "../utils/circleColors";
import { calculatePolygonPoints } from "../utils/geometry";
import {
  VIEWBOX_SIZE,
  CENTER,
  RING_RADIUS,
  RING_STROKE_WIDTH,
  CIRCLE_PADDING,
} from "../constants/visualConstants";
import { transposeChord, getChordTriad, CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import type { ChordType } from "@/features/chord/types";
import { SEVENTH_CHORD_TYPES } from "@/features/chord/types";
import type { ScaleType } from "@/features/scale/types";
import { useChordMorphing } from "@/features/chord-animation";
import {
  ToneInfoPanel,
  getToneRole,
  noteIndexToFrequency,
} from "@/features/chord-inspection";
import type { ToneInfo } from "@/features/chord-inspection";
import { calculateCentroid } from "@/features/chord-geometry";
import { getNoteStyle, chordPolygonGradientId } from "../utils/noteStyles";
import {
  getChordComplexity,
  getChordColor,
} from "@/features/color-language/utils/chordColorUtils";
import type { Chord } from "@/features/current-chord";
import { useTheme } from "@/app/providers/useTheme";
import { useEnharmonic } from "@/app/providers/useEnharmonic";

import { useChordState } from "../hooks/useChordState";
import { CircleDefs } from "./CircleDefs";
import { ChordPolygon } from "./ChordPolygon";
import { ChordVertex } from "./ChordVertex";
import { NoteNode } from "./NoteNode";
import { CircleControls } from "./CircleControls";

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

  const [selectedTone, setSelectedTone] = useState<ToneInfo | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const deselectTone = useCallback(() => setSelectedTone(null), []);

  const handleNoteClick = useCallback((_noteName: string, toneInfo: ToneInfo) => {
    setSelectedTone(toneInfo);
  }, []);

  const {
    selectedChordName,
    setSelectedChordName,
    customFromChord,
    setCustomFromChord,
    isDragging,
    dragTargetIndex,
    suppressNextClick,
    setSuppressNextClick,
    moveAnnouncement,
    effectiveRoot,
    effectiveQuality,
    handleNoteDragStart,
    handleNoteDragMove,
    handleNoteDragEnd,
    handleRotateChord,
    handleSelectPrimitiveShape,
  } = useChordState({
    onCurrentChordChange,
    onKeyScaleChange,
    selectedScale: propSelectedScale,
    pitchClasses,
  });

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
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const rootIndex = effectiveRoot;
  const chordType: ChordType = effectiveQuality;
  const isSeventhChord = SEVENTH_CHORD_TYPES.has(chordType);
  const baseIntervals = CHORD_INTERVALS[chordType];

  const chordNotes = customFromChord?.customNotes
    ? customFromChord.customNotes.map((idx) => ({
        index: idx,
        name: pitchClasses[idx],
        role: "root" as const,
      }))
    : transposeChord(baseIntervals, rootIndex, pitchClasses);
  const chordIndices = chordNotes.map((n) => n.index);

  const fromPoints = calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, chordIndices);

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
  const chordComplexity = getChordComplexity({ root: rootIndex, quality: chordType });
  const strokeColor = getChordColor(chordType, chordComplexity);
  const strokeDasharray = isSeventhChord ? "5,5" : undefined;
  const fillColor = `url(#${chordPolygonGradientId(chordType, chordComplexity)})`;
  const polygonOpacity = isAnimating ? 0.75 : 1;

  const circleColor = useMemo(
    () => getCircleColorForTheme(rootIndex, chordType, theme, "circle"),
    [rootIndex, chordType, theme],
  );

  const diatonicIndices = useMemo(
    () => getDiatonicIndices(rootIndex, propSelectedScale),
    [rootIndex, propSelectedScale],
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
          <CircleDefs />

          {/* Ambient background tint */}
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

          <ChordPolygon
            morphedPoints={fromMorphedPoints}
            fillColor={fillColor}
            strokeColor={strokeColor}
            strokeDasharray={strokeDasharray}
            opacity={polygonOpacity}
            showExtension={propShowExtension}
            triadPoints={fromTriadPoints}
            showCentroid={propShowCentroid}
            centroid={fromCentroid}
            showIntervals={propShowIntervals}
            chordIndices={chordIndices}
          />

          {/* Chord polygon vertices */}
          {chordNotes.map((note, i) => {
            const point = fromPoints[i];
            const interval = baseIntervals[i];
            const isSelected =
              selectedTone?.chordLabel === "From Chord" &&
              selectedTone?.note.index === note.index;
            if (point === undefined) return null;
            return (
              <ChordVertex
                key={`from-vertex-${note.index}`}
                noteName={note.name}
                point={point}
                isSelected={isSelected}
                strokeColor={strokeColor}
                onActivate={(e) => {
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
            );
          })}

          {/* Chromatic ring note nodes */}
          {pitchClasses.map((label, i) => {
            const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
            const x = CENTER + RING_RADIUS * Math.cos(angle);
            const y = CENTER + RING_RADIUS * Math.sin(angle);
            const isInFromChord = chordIndices.includes(i);
            const noteStyle = isInFromChord
              ? getNoteStyle(i, chordIndices, chordType, diatonicIndices, chordComplexity)
              : getNoteStyle(i, [], chordType, diatonicIndices, chordComplexity);
            const isSelected =
              selectedTone?.note.index === i && selectedTone.chordLabel !== "From Chord";

            return (
              <NoteNode
                key={`pitch-${i}-${label}`}
                label={label}
                index={i}
                x={x}
                y={y}
                noteStyle={noteStyle}
                isDragging={isDragging}
                dragTargetIndex={dragTargetIndex}
                isSelected={isSelected}
                isInFromChord={isInFromChord}
                onPointerDown={(e) => handleNoteDragStart(i, e)}
                onPointerMove={handleNoteDragMove}
                onPointerUp={handleNoteDragEnd}
                onPointerCancel={handleNoteDragEnd}
                onClick={(e) => {
                  if (suppressNextClick) {
                    setSuppressNextClick(false);
                    return;
                  }
                  if (isDragging) return;
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
              />
            );
          })}
        </svg>
      </div>

      {/* Accessible live region for drag/rotation announcements */}
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

      <CircleControls
        onRotate={handleRotateChord}
        onSelectShape={handleSelectPrimitiveShape}
        selectedChordName={selectedChordName}
        onChordChange={(name) => {
          setSelectedChordName(name);
          setCustomFromChord(null);
        }}
        customFromChord={customFromChord}
      />
    </div>
  );
}
