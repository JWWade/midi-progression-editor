import type { PrimitiveShape } from "@/features/current-chord";
import { ChordGrid } from "@/features/chord/components/ChordGrid";
import type { CustomChordState } from "../types";

interface CircleControlsProps {
  onRotate: (direction: "clockwise" | "counterclockwise") => void;
  onSelectShape: (shape: PrimitiveShape) => void;
  onRandomChord: () => void;
  selectedChordName: string;
  onChordChange: (name: string) => void;
  customFromChord: CustomChordState | null;
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

function TriangleShapeIcon({ label, fontSize }: { label: string; fontSize: number }) {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden="true">
      <polygon points="11,1.5 20.5,18.5 1.5,18.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <text x="11" y="16" textAnchor="middle" fill="currentColor" fontSize={fontSize} fontWeight="700" fontFamily="sans-serif">{label}</text>
    </svg>
  );
}

function SquareShapeIcon({ label, fontSize, labelY }: { label: string; fontSize: number; labelY: number }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="17" height="17" stroke="currentColor" strokeWidth="2" />
      <text x="10" y={labelY} textAnchor="middle" fill="currentColor" fontSize={fontSize} fontWeight="700" fontFamily="sans-serif">{label}</text>
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
 */
export function CircleControls({
  onRotate,
  onSelectShape,
  onRandomChord,
  selectedChordName,
  onChordChange,
  customFromChord,
}: CircleControlsProps) {
  const activeShape = customFromChord?.primitiveShape;

  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: 12, alignItems: "center", gap: 10 }}>
      <div style={{ display: "inline-flex", alignItems: "stretch", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>

        {/* ── Transform ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={SECTION_LABEL_STYLE}>Transform</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => onRotate("counterclockwise")}
              title="Rotate counterclockwise by one semitone (Ctrl+Left)"
              aria-label="Rotate chord counterclockwise"
              style={{ ...BASE_BUTTON_STYLE, color: "var(--color-text-primary)" }}
            >
              <span style={{ ...ROTATE_ICON_STYLE, transform: "rotate(-90deg)" }}>↺</span>
            </button>
            <button
              type="button"
              onClick={() => onRotate("clockwise")}
              title="Rotate clockwise by one semitone (Ctrl+Right)"
              aria-label="Rotate chord clockwise"
              style={{ ...BASE_BUTTON_STYLE, color: "var(--color-text-primary)" }}
            >
              <span style={{ ...ROTATE_ICON_STYLE, transform: "rotate(90deg)" }}>↻</span>
            </button>
          </div>
        </div>

        <div aria-hidden="true" style={{ width: 1, background: "var(--color-border)", borderRadius: 999 }} />

        {/* ── Templates ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={SECTION_LABEL_STYLE}>Templates</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => onSelectShape("equilateral-triangle")}
              title="Select equilateral triangle primitive"
              aria-label="Select equilateral triangle primitive"
              style={getShapeButtonStyle(activeShape === "equilateral-triangle")}
            >
              <TriangleShapeIcon label="a" fontSize={8} />
            </button>
            <button
              type="button"
              onClick={() => onSelectShape("suspended-triangle")}
              title="Select sus4 triangle primitive"
              aria-label="Select sus4 triangle primitive"
              style={getShapeButtonStyle(activeShape === "suspended-triangle")}
            >
              <TriangleShapeIcon label="sus4" fontSize={5} />
            </button>
            <button
              type="button"
              onClick={() => onSelectShape("square")}
              title="Select square primitive"
              aria-label="Select square primitive"
              style={getShapeButtonStyle(activeShape === "square")}
            >
              <SquareShapeIcon label="dim" fontSize={6.5} labelY={13.5} />
            </button>
            <button
              type="button"
              onClick={() => onSelectShape("rectangle")}
              title="Select rectangle primitive"
              aria-label="Select rectangle primitive"
              style={getShapeButtonStyle(activeShape === "rectangle")}
            >
              <SquareShapeIcon label="7" fontSize={10} labelY={14} />
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
      />
    </div>
  );
}
