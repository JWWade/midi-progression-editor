import type { Point } from "@/features/chromatic-circle/utils/geometry";

interface IntervalLabelProps {
  from: Point;
  to: Point;
  intervalName: string;
  centerX: number;
  centerY: number;
}

const LABEL_OFFSET = 12;
const RECT_WIDTH = 26;
const RECT_HEIGHT = 16;
const RECT_RX = 3;

export function IntervalLabel({
  from,
  to,
  intervalName,
  centerX,
  centerY,
}: IntervalLabelProps) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const dx = midX - centerX;
  const dy = midY - centerY;
  const magnitude = Math.sqrt(dx * dx + dy * dy);

  const labelX = magnitude > 0 ? midX + (dx / magnitude) * LABEL_OFFSET : midX;
  const labelY = magnitude > 0 ? midY + (dy / magnitude) * LABEL_OFFSET : midY;

  return (
    <g aria-label={`Interval: ${intervalName}`}>
      <rect
        x={labelX - RECT_WIDTH / 2}
        y={labelY - RECT_HEIGHT / 2}
        width={RECT_WIDTH}
        height={RECT_HEIGHT}
        fill="white"
        rx={RECT_RX}
        opacity={0.85}
      />
      <text
        x={labelX}
        y={labelY}
        fontSize="11"
        fontWeight="600"
        fill="#1F2937"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="sans-serif"
      >
        {intervalName}
      </text>
    </g>
  );
}
