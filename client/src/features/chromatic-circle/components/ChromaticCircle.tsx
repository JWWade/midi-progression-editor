import { useState } from "react";
import { useChromaticCircleData } from "../hooks/useChromaticCircleData";
import { PITCH_CLASSES } from "../utils";
import { calculatePolygonPoints } from "../utils/geometry";
import { getChordNotes } from "@/features/chord/api/getChordNotes";
import type { ChordType } from "@/features/chord/types";

const SIZE = 300;
const CENTER = SIZE / 2;
const RING_RADIUS = 110;
const NODE_RADIUS = 12;
const NATURAL_FONT_SIZE = 11;
const SHARP_FONT_SIZE = 9;
const PRIMARY_COLOR = "#4F46E5";

const ACTIVE_BUTTON_STYLE: React.CSSProperties = {
  fontWeight: "bold",
  backgroundColor: PRIMARY_COLOR,
  color: "white",
  border: `2px solid ${PRIMARY_COLOR}`,
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

const TOGGLE_CONTAINER_STYLE: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  marginBottom: "12px",
  justifyContent: "center",
};

export function ChromaticCircle() {
  const [quality, setQuality] = useState<ChordType>("major");
  const { scaleNotes, isLoading, error } = useChromaticCircleData();

  const chordNotes = getChordNotes(quality);
  const chordIndices = chordNotes.map((n) => n.index);

  return (
    <div>
      <div style={TOGGLE_CONTAINER_STYLE}>
        <button
          onClick={() => setQuality("major")}
          style={quality === "major" ? ACTIVE_BUTTON_STYLE : INACTIVE_BUTTON_STYLE}
        >
          Major
        </button>
        <button
          onClick={() => setQuality("minor")}
          style={quality === "minor" ? ACTIVE_BUTTON_STYLE : INACTIVE_BUTTON_STYLE}
        >
          Minor
        </button>
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
          fill="rgba(79, 70, 229, 0.1)"
          stroke={PRIMARY_COLOR}
          strokeWidth={2}
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

