import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { getDiatonicIndices, PITCH_CLASSES, FLAT_PITCH_CLASSES } from "../utils";
import { getCircleColorForTheme } from "../utils/circleColors";
import { calculatePolygonPoints, orderPolygonNoteIndices } from "../utils/geometry";
import {
  VIEWBOX_SIZE,
  CENTER,
  RING_RADIUS,
  RING_STROKE_WIDTH,
  CIRCLE_PADDING,
  NODE_RADIUS,
} from "../constants/visualConstants";
import { transposeChord, CHORD_INTERVALS } from "@/features/chord/utils/transpose";
import { getChordName } from "@/features/chord/data/chordNames";
import { rerootChord } from "@/features/chord/utils/rerootChord";
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
import styles from "./ChromaticCircle.module.css";

interface ChromaticCircleProps {
  onCurrentChordChange?: (chord: Chord) => void;
  /** Initial named chord selected on first render (e.g. Dmaj7). */
  initialChordName?: string;
  selectedScale?: ScaleType;
  /** Key root pitch class (0–11) — renders the tonic marker on this node. */
  keyRoot?: number;
  showCentroid?: boolean;
  showIntervals?: boolean;
  /** When non-null, overrides the user's internal chord selection for rendering and animation. */
  externalChord?: Chord | null;
  /** When true, renders a pulsing ring to indicate active playback. */
  isPlaybackActive?: boolean;
  /** Pitch class currently sounding during arpeggiated playback (0..11). */
  playingPitchClass?: number | null;
  /**
   * When non-null, programmatically loads this chord into the circle's
   * internal selection state. Each distinct object reference triggers a load,
   * so spread a new object (`{ ...chord }`) to re-send the same chord.
   */
  loadChord?: Chord | null;
  /**
   * Controls how the CircleControls panel (Transform, Templates, chord
   * selector) is positioned relative to the SVG circle.
   *
   * - `'below'` (default): controls appear below the circle, stacked
   *   vertically — matches the traditional compact layout used in Inspect and
   *   Compose modes.
   * - `'side'`: controls appear to the right of the circle in a flex row,
   *   making full use of the wider viewport available in Explore mode.  On
   *   narrow screens (≤ 900 px) the layout automatically reverts to stacked.
   */
  controlsLayout?: 'below' | 'side';
}

/**
 * Returns the enharmonic spelling of a note if one exists, otherwise undefined.
 * @param noteIndex - Pitch class index (0=C … 11=B)
 * @param currentName - The note label currently shown in the UI (sharp or flat spelling)
 */
function getEnharmonicEquivalent(noteIndex: number, currentName: string): string | undefined {
  const sharpName = PITCH_CLASSES[noteIndex];
  const flatName = FLAT_PITCH_CLASSES[noteIndex];
  if (sharpName === flatName) return undefined;
  return currentName === sharpName ? flatName : sharpName;
}

export function ChromaticCircle({
  onCurrentChordChange,
  initialChordName = "C",
  selectedScale: propSelectedScale = "major",
  keyRoot: propKeyRoot,
  showCentroid: propShowCentroid = false,
  showIntervals: propShowIntervals = false,
  externalChord,
  isPlaybackActive = false,
  playingPitchClass = null,
  loadChord,
  controlsLayout = 'below',
}: ChromaticCircleProps) {
  const { theme } = useTheme();
  const { pitchClasses } = useEnharmonic();

  const [selectedTone, setSelectedTone] = useState<ToneInfo | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  /** Ephemeral announcement shown while hovering / focusing a chord vertex. */
  const [previewAnnouncement, setPreviewAnnouncement] = useState("");
  /** Track which chord vertex note is currently being hovered/previewed (for R key re-root). */
  const hoveredVertexNoteRef = useRef<number | null>(null);

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
    handleMirrorWithAxis,
    handleSelectPrimitiveShape,
    handleRandomChord,
    handleMutateChord,
    handleRerootChord,
  } = useChordState({
    onCurrentChordChange,
    initialChordName,
    pitchClasses,
  });

  // Stable chord-change handler avoids creating a new function on every render.
  const handleChordChange = useCallback(
    (name: string) => {
      setSelectedChordName(name);
      setCustomFromChord(null);
    },
    [setSelectedChordName, setCustomFromChord],
  );

  // When a chord is sent back from the progression sidebar, load it into the
  // circle's internal selection state. Each new object reference triggers a
  // fresh load so that re-sending the same chord works correctly.
  useEffect(() => {
    if (!loadChord) return;
    if (loadChord.customNotes) {
      const customState = {
        root: loadChord.root,
        quality: loadChord.quality,
        customNotes: loadChord.customNotes,
        primitiveShape: loadChord.primitiveShape,
      };
      setCustomFromChord(customState);
      onCurrentChordChange?.(loadChord);
    } else {
      setCustomFromChord(null);
      setSelectedChordName(getChordName(loadChord.root, loadChord.quality));
      // onCurrentChordChange is fired by the existing effect in useChordState
      // once effectiveRoot/effectiveQuality update.
    }
  }, [loadChord, setCustomFromChord, setSelectedChordName, onCurrentChordChange]);

  // Ref that always holds the latest mutable state consumed by the stable note
  // event handlers below. Updated via useLayoutEffect (after each render) to
  // keep values fresh without triggering new renders.  This pattern lets the
  // stable useCallback handlers below omit these values from their dep arrays
  // while still reading their most recent values at event time.
  const noteHandlerStateRef = useRef({
    suppressNextClick,
    setSuppressNextClick,
    isDragging,
    rootIndex: 0 as number,
    chordIndices: [] as number[],
    chordType: "major" as ChordType,
    handleNoteClick,
  });

  // Stable per-note pointer-down handlers.  One function per note index, only
  // recreated when handleNoteDragStart (a useCallback) changes identity.
  const notePointerDownHandlers = useMemo(
    () =>
      Array.from(
        { length: 12 },
        (_, i) =>
          (e: ReactPointerEvent) =>
            handleNoteDragStart(i, e),
      ),
    [handleNoteDragStart],
  );

  /**
   * Reads note identity from the data attributes that NoteNode places on its
   * root `<g>` element, then fires handleNoteClick with the tone info built
   * from the latest noteHandlerStateRef values.
   *
   * Extracted to avoid duplicating this logic between stableNoteClick and
   * stableNoteKeyDown.
   */
  const fireToneInfoFromElement = useCallback(
    (el: Element) => {
      const idx = parseInt(el.getAttribute("data-note-index") ?? "-1", 10);
      if (idx < 0) return;
      const label = el.getAttribute("data-note-label") ?? "";
      const s = noteHandlerStateRef.current;
      const note = { index: idx, name: label, role: "root" as const };
      const interval = (idx - s.rootIndex + 12) % 12;
      const isInChord = s.chordIndices.includes(idx);
      s.handleNoteClick(label, {
        note,
        frequency: noteIndexToFrequency(idx),
        enharmonicEquivalent: getEnharmonicEquivalent(idx, label),
        scaleDegree: isInChord ? getToneRole(interval, s.chordType) : undefined,
      });
    },
    [],
  );

  // Stable click handler — reads the note identity from HTML data attributes set
  // by NoteNode on its root <g> element, then delegates into the latest handler
  // state via noteHandlerStateRef.
  const stableNoteClick = useCallback((e: React.MouseEvent) => {
    const s = noteHandlerStateRef.current;
    if (s.suppressNextClick) {
      s.setSuppressNextClick(false);
      return;
    }
    if (s.isDragging) return;
    e.stopPropagation();
    fireToneInfoFromElement(e.currentTarget as Element);
  }, [fireToneInfoFromElement]);

  // Stable keyboard handler — same delegation pattern as stableNoteClick.
  const stableNoteKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    fireToneInfoFromElement(e.currentTarget as Element);
  }, [fireToneInfoFromElement]);

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
      if (isInFormControl) return;

      // Handle R key to re-root from either selected note-node or hovered vertex.
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        const selectedIndex = selectedTone?.note.index;
        const chordIndices = noteHandlerStateRef.current.chordIndices;

        if (selectedIndex !== undefined && chordIndices.includes(selectedIndex)) {
          const pitchClassLabel = pitchClasses[selectedIndex];
          handleRerootChord(selectedIndex, pitchClassLabel);
          return;
        }

        if (hoveredVertexNoteRef.current !== null) {
          const noteIndex = hoveredVertexNoteRef.current;
          const pitchClassLabel = pitchClasses[noteIndex];
          handleRerootChord(noteIndex, pitchClassLabel);
          return;
        }

        return;
      }

      if (!e.ctrlKey) return;
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
  }, [deselectTone, handleRotateChord, handleRerootChord, pitchClasses, selectedTone]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Track chord onsets during playback and increment pulseCount to trigger the polygon
  // pulse animation. requestAnimationFrame defers the state update out of the effect
  // body, satisfying the react-hooks/set-state-in-effect lint rule.
  const [pulseCount, setPulseCount] = useState(0);
  useEffect(() => {
    if (externalChord == null) return;
    const id = requestAnimationFrame(() => {
      setPulseCount((k) => k + 1);
    });
    return () => cancelAnimationFrame(id);
  }, [externalChord]);

  const rootIndex = externalChord?.root ?? effectiveRoot;
  const chordType: ChordType = externalChord?.quality ?? effectiveQuality;
  const isSeventhChord = SEVENTH_CHORD_TYPES.has(chordType);
  const baseIntervals = CHORD_INTERVALS[chordType];

  // Prioritize custom notes if present (either from externalChord during playback
  // or from stored state). Only transpose standard intervals as a fallback.
  const chordNotes = externalChord?.customNotes
    ? externalChord.customNotes.map((idx) => ({
        index: idx,
        name: pitchClasses[idx],
        role: "root" as const,
      }))
    : !externalChord && customFromChord?.customNotes
      ? customFromChord.customNotes.map((idx) => ({
          index: idx,
          name: pitchClasses[idx],
          role: "root" as const,
        }))
      : transposeChord(baseIntervals, rootIndex, pitchClasses);
  const chordIndices = chordNotes.map((n) => n.index);
  const orderedChordIndices = orderPolygonNoteIndices(chordIndices, rootIndex);

  // Sync noteHandlerStateRef with the latest derived values and state.  Using
  // useLayoutEffect ensures the ref is updated before the browser paints and
  // before any user interaction events can fire after this render, without
  // violating the react-hooks/refs rule that forbids mutations during render.
  useLayoutEffect(() => {
    noteHandlerStateRef.current.suppressNextClick = suppressNextClick;
    noteHandlerStateRef.current.setSuppressNextClick = setSuppressNextClick;
    noteHandlerStateRef.current.isDragging = isDragging;
    noteHandlerStateRef.current.handleNoteClick = handleNoteClick;
    noteHandlerStateRef.current.rootIndex = rootIndex;
    noteHandlerStateRef.current.chordIndices = orderedChordIndices;
    noteHandlerStateRef.current.chordType = chordType;
  }, [
    suppressNextClick,
    setSuppressNextClick,
    isDragging,
    handleNoteClick,
    rootIndex,
    orderedChordIndices,
    chordType,
  ]);

  const fromPoints = calculatePolygonPoints(CENTER, CENTER, RING_RADIUS, orderedChordIndices);

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

  const keyDiatonicRoots = useMemo<Set<number>>(
    () => new Set(getDiatonicIndices(propKeyRoot ?? rootIndex, propSelectedScale)),
    [propKeyRoot, rootIndex, propSelectedScale],
  );

  const activeArpeggioPitchClass =
    playingPitchClass === null
      ? null
      : ((playingPitchClass % 12) + 12) % 12;

  const isHorizontal = controlsLayout === 'side';

  return (
    <div
      className={isHorizontal ? styles.horizontalLayout : undefined}
      style={isHorizontal ? undefined : { position: "relative", maxWidth: "100%", width: "100%" }}
    >
      {/* Circle SVG + live regions + tone panel (left column in side mode) */}
      <div
        className={isHorizontal ? styles.circleColumn : undefined}
        style={{ position: "relative" }}
      >
      <div
        style={{
          width: "100%",
          ...(!isHorizontal && { maxWidth: 550, margin: "0 auto" }),
          padding: `0 ${CIRCLE_PADDING}px`,
          boxSizing: "border-box",
        }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          className={styles.chromaticSvg}
          role="application"
          aria-label="Chromatic Circle"
          onClick={deselectTone}
          style={{
            display: "block",
            width: "100%",
            maxHeight: isHorizontal ? 660 : 550,
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

          {/* Playback-active indicator: pulsing outer ring */}
          {isPlaybackActive && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RING_RADIUS + 16}
              fill="none"
              stroke="#555"
              strokeWidth={2}
              className={styles.playbackRing}
              aria-hidden="true"
            />
          )}

          <ChordPolygon
            morphedPoints={fromMorphedPoints}
            fillColor={fillColor}
            strokeColor={strokeColor}
            strokeDasharray={strokeDasharray}
            opacity={polygonOpacity}
            showCentroid={propShowCentroid}
            centroid={fromCentroid}
            showIntervals={propShowIntervals}
            chordIndices={orderedChordIndices}
            pulse={pulseCount}
          />

          {/* Chord polygon vertices — click or press R/Enter/Space to re-root the chord */}
          <g role="group" aria-label="Chord vertices — press R on a vertex to set it as root">
          {orderedChordIndices.map((noteIndex, i) => {
            const point = fromPoints[i];
            const interval = baseIntervals[i];
            const isRoot = noteIndex === rootIndex;
            const noteName = pitchClasses[noteIndex];

            // Build accessible label: role name from the current root, action hint.
            const roleLabel = getToneRole(interval, chordType);
            const ariaLabel = isRoot
              ? `${noteName}, current chord root`
              : `${noteName}, vertex, ${roleLabel} from ${pitchClasses[rootIndex]}, press R to set as root`;

            if (point === undefined) return null;
            return (
              <ChordVertex
                key={`from-vertex-${noteIndex}`}
                point={point}
                isRoot={isRoot}
                isSelected={false}
                strokeColor={strokeColor}
                ariaLabel={ariaLabel}
                onRerootCommit={() => {
                  handleRerootChord(noteIndex, noteName);
                  setPreviewAnnouncement("");
                }}
                onRerootPreview={() => {
                  hoveredVertexNoteRef.current = noteIndex;
                  if (isRoot) {
                    setPreviewAnnouncement(`${noteName} is the current chord root`);
                    return;
                  }
                  const { quality, matchScore } = rerootChord(orderedChordIndices, noteIndex);
                  const chordLabel = getChordName(noteIndex, quality, pitchClasses);
                  if (matchScore === 1) {
                    setPreviewAnnouncement(
                      `Preview: ${noteName} as root. ${chordLabel} chord`,
                    );
                  } else {
                    const noteNames = orderedChordIndices.map((idx) => pitchClasses[idx]).join(", ");
                    setPreviewAnnouncement(
                      `Preview: ${noteName} as root. No exact match. Notes: ${noteNames}`,
                    );
                  }
                }}
                onRerootPreviewClear={() => {
                  hoveredVertexNoteRef.current = null;
                  setPreviewAnnouncement("");
                }}
              />
            );
          })}
          </g>

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
              selectedTone?.note.index === i && selectedTone.isChordVertex !== true;
            const isTonic = propKeyRoot !== undefined && i === propKeyRoot;

            return (
              <g key={`pitch-${i}-${label}`}>
                <NoteNode
                  label={label}
                  index={i}
                  x={x}
                  y={y}
                  noteStyle={noteStyle}
                  isArpeggioActive={isPlaybackActive && activeArpeggioPitchClass === i}
                  isDropTarget={isDragging && dragTargetIndex === i}
                  isSelected={isSelected}
                  isInFromChord={isInFromChord}
                  onPointerDown={notePointerDownHandlers[i]!}
                  onPointerMove={handleNoteDragMove}
                  onPointerUp={handleNoteDragEnd}
                  onPointerCancel={handleNoteDragEnd}
                  onClick={stableNoteClick}
                  onKeyDown={stableNoteKeyDown}
                />
                {/* Tonic marker: structural anchor rendered above node, below drag ring */}
                {isTonic && (
                  <circle
                    cx={x}
                    cy={y}
                    r={NODE_RADIUS + 5}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    opacity={0.9}
                    pointerEvents="none"
                    aria-hidden="true"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Accessible live region for drag/rotation/re-root commit announcements */}
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

      {/* Accessible live region for ephemeral re-root preview announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
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
        {previewAnnouncement}
      </div>

      <ToneInfoPanel selectedTone={selectedTone} onClose={deselectTone} />

      {/* Controls below the circle (default layout) */}
      {!isHorizontal && (
        <CircleControls
          onRotate={handleRotateChord}
          onMirrorWithAxis={handleMirrorWithAxis}
          onMutate={handleMutateChord}
          onSelectShape={handleSelectPrimitiveShape}
          onRandomChord={handleRandomChord}
          selectedChordName={selectedChordName}
          onChordChange={handleChordChange}
          customFromChord={customFromChord}
          diatonicRoots={keyDiatonicRoots}
        />
      )}
      </div>{/* end circleColumn / inner wrapper */}

      {/* Controls beside the circle (side layout — Explore mode) */}
      {isHorizontal && (
        <div className={styles.controlsColumn}>
          <CircleControls
            onRotate={handleRotateChord}
            onMirrorWithAxis={handleMirrorWithAxis}
            onMutate={handleMutateChord}
            onSelectShape={handleSelectPrimitiveShape}
            onRandomChord={handleRandomChord}
            selectedChordName={selectedChordName}
            onChordChange={handleChordChange}
            customFromChord={customFromChord}
            diatonicRoots={keyDiatonicRoots}
          />
        </div>
      )}
    </div>
  );
}
