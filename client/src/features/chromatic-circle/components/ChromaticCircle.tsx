import { useEffect } from "react";
import { useChromaticCircleData } from "../hooks/useChromaticCircleData";
import { PITCH_CLASSES } from "../utils";

const SIZE = 300;
const CENTER = SIZE / 2;
const RING_RADIUS = 110;
const NODE_RADIUS = 12;
const NATURAL_FONT_SIZE = 11;
const SHARP_FONT_SIZE = 9;

export function ChromaticCircle() {
  const { scaleNotes, isLoading, error } = useChromaticCircleData();

  useEffect(() => {
    if (scaleNotes.length > 0) {
      console.log(scaleNotes);
    }
  }, [scaleNotes]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return (
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
  );
}

