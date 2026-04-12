import { memo, useCallback, useState, useRef, useEffect } from "react";
import type { PrimitiveShape } from "@/features/current-chord";
import { ChordGrid } from "@/features/chord/components/ChordGrid";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import { allReflectionAxes, type ReflectionAxis } from "@/features/chord/utils/reflectChord";
import type { CustomChordState } from "../types";

interface CircleControlsProps {
  onRotate: (direction: "clockwise" | "counterclockwise") => void;
  onMirrorWithAxis: (axis: ReflectionAxis) => void;
  onMutate: () => void;
  onSelectShape: (shape: PrimitiveShape) => void;
  onRandomChord: () => void;
  selectedChordName: string;
  onChordChange: (name: string) => void;
  customFromChord: CustomChordState | null;
  diatonicRoots?: Set<number>;
}

const BASE_BUTTON_STYLE: React.CSSProperties = {
  width: 36,
  height: 32,
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  lineHeight: 1,
  cursor: "pointer",
  background: "var(--color-bg-surface)",
  border: "1.5px solid var(--color-border)",
  borderRadius: 6,
  fontWeight: 600,
};

function getShapeButtonStyle(isActive: boolean): React.CSSProperties {
  return {
    ...BASE_BUTTON_STYLE,
    fontWeight: 700,
    color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
    border: isActive ? "2px solid var(--color-text-primary)" : "1.5px solid var(--color-border)",
  };
}

const ROTATE_ICON_STYLE: React.CSSProperties = {
  display: "inline-block",
};

/**
 * Renders a colored polygon (no glyph) mapped from pitch-class geometry on the
 * chromatic circle. Pitch class 0 = 12 o'clock, angle increases clockwise.
 */
function TemplateShapeIcon({
  pitchClasses,
  color,
  fillColor,
  isSelected,
}: {
  pitchClasses: readonly number[];
  color: string;
  fillColor: string;
  isSelected: boolean;
}): React.ReactElement {
  const size = 20;
  const center = size / 2;
  const r = 8;

  // Compute polygon vertices: map each pitch class to a point on the circle.
  const points = pitchClasses.map((pc) => {
    const angle = (pc / 12) * 2 * Math.PI;
    return {
      x: center + r * Math.sin(angle),
      y: center - r * Math.cos(angle),
    };
  });

  const polygonPoints = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      <polygon
        points={polygonPoints}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="miter"
        fill={isSelected ? fillColor : "none"}
      />
    </svg>
  );
}

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: 0.6,
  fontWeight: 600,
};

/**
 * Toolbar rendered below the chromatic circle SVG.
 *
 * Contains two button groups (Transform / Templates) and the chord-grid
 * selector.
 *
 * Wrapped with React.memo so it only re-renders when its own props change.
 */
export const CircleControls = memo(function CircleControls({
  onRotate,
  onMirrorWithAxis,
  onMutate,
  onSelectShape,
  onRandomChord,
  selectedChordName,
  onChordChange,
  customFromChord,
  diatonicRoots,
}: CircleControlsProps) {
  const activeShape = customFromChord?.primitiveShape;
  const [axisPickerOpen, setAxisPickerOpen] = useState(false);
  const mirrorButtonRef = useRef<HTMLButtonElement>(null);
  const axisPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!axisPickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        !mirrorButtonRef.current?.contains(e.target as Node) &&
        !axisPickerRef.current?.contains(e.target as Node)
      ) {
        setAxisPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [axisPickerOpen]);

  useEffect(() => {
    if (!axisPickerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAxisPickerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [axisPickerOpen]);

  const handleAxisSelect = useCallback(
    (axis: ReflectionAxis) => {
      setAxisPickerOpen(false);
      onMirrorWithAxis(axis);
    },
    [onMirrorWithAxis],
  );

  const AXES = allReflectionAxes();
  const throughNoteAxes = AXES.filter((a) => a.type === "through-note");
  const betweenAxes = AXES.filter((a) => a.type === "between-notes");

  const handleRotateCounterclockwise = useCallback(
    () => onRotate("counterclockwise"),
    [onRotate],
  );
  const handleRotateClockwise = useCallback(() => onRotate("clockwise"), [onRotate]);

  // Pitch-class geometries and colors for each template
  const templateIconProps = {
    equilateralTriangle: {
      pitchClasses: [0, 4, 8] as const,
      color: ChordQualityColors.aug.base,
      fillColor: ChordQualityColors.aug.fill,
    },
    suspendedTriangle: {
      pitchClasses: [0, 4, 7] as const,
      color: ChordQualityColors.major.base,
      fillColor: ChordQualityColors.major.fill,
    },
    square: {
      pitchClasses: [0, 3, 6, 9] as const,
      color: ChordQualityColors.dim.base,
      fillColor: ChordQualityColors.dim.fill,
    },
    rectangle: {
      pitchClasses: [0, 4, 7, 10] as const,
      color: ChordQualityColors.dom7.base,
      fillColor: ChordQualityColors.dom7.fill,
    },
    symmetricalTrapezoid: {
      pitchClasses: [0, 4, 7, 11] as const,
      color: ChordQualityColors.maj7.base,
      fillColor: ChordQualityColors.maj7.fill,
    },
  };

  return (
    <div data-circle-controls style={{ display: "flex", flexDirection: "column", marginTop: 12, alignItems: "center", gap: 10 }}>
      <div style={{ display: "inline-flex", alignItems: "stretch", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>

        {/* ── Transform ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={SECTION_LABEL_STYLE}>Transform</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, auto)", gap: 10 }}>
            <button
              type="button"
              onClick={handleRotateCounterclockwise}
              title="Rotate counterclockwise by one semitone (Ctrl+Left)"
              aria-label="Rotate chord counterclockwise"
              style={{ ...BASE_BUTTON_STYLE, color: "var(--color-text-primary)" }}
            >
              <span style={{ ...ROTATE_ICON_STYLE, transform: "rotate(-90deg)" }}>↺</span>
            </button>
            <button
              type="button"
              onClick={handleRotateClockwise}
              title="Rotate clockwise by one semitone (Ctrl+Right)"
              aria-label="Rotate chord clockwise"
              style={{ ...BASE_BUTTON_STYLE, color: "var(--color-text-primary)" }}
            >
              <span style={{ ...ROTATE_ICON_STYLE, transform: "rotate(90deg)" }}>↻</span>
            </button>
            <button
              ref={mirrorButtonRef}
              type="button"
              onClick={() => setAxisPickerOpen((o) => !o)}
              title="Reflect chord across an axis"
              aria-label="Reflect chord across an axis"
              aria-haspopup="listbox"
              aria-expanded={axisPickerOpen}
              style={{ ...BASE_BUTTON_STYLE, color: "var(--color-text-primary)", fontSize: 14,
                ...(axisPickerOpen ? { borderColor: "var(--color-text-primary)" } : {}),
              }}
            >
              ⇌
            </button>
            {axisPickerOpen && (
              <div
                ref={axisPickerRef}
                role="listbox"
                aria-label="Reflection axis"
                style={{
                  position: "fixed",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1001,
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
                  padding: "12px 16px",
                  display: "flex",
                  gap: 20,
                  userSelect: "none",
                }}
              >
                {[{ label: "Through note", axes: throughNoteAxes }, { label: "Between notes", axes: betweenAxes }].map(
                  ({ label, axes }) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.06em", color: "var(--color-text-secondary)",
                        marginBottom: 6, paddingBottom: 4,
                        borderBottom: "1px solid var(--color-border)" }}
                      >
                        {label}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {axes.map((axis) => (
                          <button
                            key={axis.value}
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => handleAxisSelect(axis)}
                            style={{
                              padding: "3px 8px",
                              fontSize: 12,
                              textAlign: "left",
                              cursor: "pointer",
                              border: "1px solid transparent",
                              borderRadius: 4,
                              background: "transparent",
                              color: "var(--color-text-primary)",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-elevated)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            {axis.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onMutate}
              title="Mutate one note at random"
              aria-label="Mutate one note at random"
              style={{ ...BASE_BUTTON_STYLE, color: "var(--color-text-primary)", fontSize: 14 }}
            >
              ⊛
            </button>
          </div>
        </div>

        <div aria-hidden="true" style={{ width: 1, background: "var(--color-border)", borderRadius: 999 }} />

        {/* ── Templates ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={SECTION_LABEL_STYLE}>Templates</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, auto)", gap: 10 }}>
            <button
              type="button"
              onClick={() => onSelectShape("equilateral-triangle")}
              title="Select equilateral triangle primitive"
              aria-label="Select equilateral triangle primitive"
              aria-pressed={activeShape === "equilateral-triangle"}
              style={getShapeButtonStyle(activeShape === "equilateral-triangle")}
            >
              <TemplateShapeIcon
                pitchClasses={templateIconProps.equilateralTriangle.pitchClasses}
                color={templateIconProps.equilateralTriangle.color}
                fillColor={templateIconProps.equilateralTriangle.fillColor}
                isSelected={activeShape === "equilateral-triangle"}
              />
            </button>
            <button
              type="button"
              onClick={() => onSelectShape("suspended-triangle")}
              title="Select sus4 triangle primitive"
              aria-label="Select sus4 triangle primitive"
              aria-pressed={activeShape === "suspended-triangle"}
              style={getShapeButtonStyle(activeShape === "suspended-triangle")}
            >
              <TemplateShapeIcon
                pitchClasses={templateIconProps.suspendedTriangle.pitchClasses}
                color={templateIconProps.suspendedTriangle.color}
                fillColor={templateIconProps.suspendedTriangle.fillColor}
                isSelected={activeShape === "suspended-triangle"}
              />
            </button>
            <button
              type="button"
              onClick={() => onSelectShape("square")}
              title="Select square primitive"
              aria-label="Select square primitive"
              aria-pressed={activeShape === "square"}
              style={getShapeButtonStyle(activeShape === "square")}
            >
              <TemplateShapeIcon
                pitchClasses={templateIconProps.square.pitchClasses}
                color={templateIconProps.square.color}
                fillColor={templateIconProps.square.fillColor}
                isSelected={activeShape === "square"}
              />
            </button>
            <button
              type="button"
              onClick={() => onSelectShape("rectangle")}
              title="Select rectangle primitive"
              aria-label="Select rectangle primitive"
              aria-pressed={activeShape === "rectangle"}
              style={getShapeButtonStyle(activeShape === "rectangle")}
            >
              <TemplateShapeIcon
                pitchClasses={templateIconProps.rectangle.pitchClasses}
                color={templateIconProps.rectangle.color}
                fillColor={templateIconProps.rectangle.fillColor}
                isSelected={activeShape === "rectangle"}
              />
            </button>
            <button
              type="button"
              onClick={() => onSelectShape("symmetrical-trapezoid")}
              title="Select symmetrical trapezoid primitive (major 7)"
              aria-label="Select symmetrical trapezoid primitive"
              aria-pressed={activeShape === "symmetrical-trapezoid"}
              style={getShapeButtonStyle(activeShape === "symmetrical-trapezoid")}
            >
              <TemplateShapeIcon
                pitchClasses={templateIconProps.symmetricalTrapezoid.pitchClasses}
                color={templateIconProps.symmetricalTrapezoid.color}
                fillColor={templateIconProps.symmetricalTrapezoid.fillColor}
                isSelected={activeShape === "symmetrical-trapezoid"}
              />
            </button>
            <button
              type="button"
              onClick={onRandomChord}
              title="Generate a random 3-note chord"
              aria-label="Generate random chord"
              style={{ ...BASE_BUTTON_STYLE, fontSize: 22, color: "var(--color-text-primary)" }}
            >
              ⚄
            </button>
          </div>
        </div>
      </div>

      <ChordGrid
        value={selectedChordName}
        onChange={onChordChange}
        customChord={customFromChord}
        aria-label="Chord"
        diatonicRoots={diatonicRoots}
      />
    </div>
  );
});
